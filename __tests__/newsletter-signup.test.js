const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const FORM_URL = 'https://b7607f4e.sibforms.com/v2/serve/MUIFAJ8OOivDmU5Mx69AcESPOvh-2gWPGoi1WrjAS8AP30bZnuHSm2KG9XP2TBdY0i6jMP3oMW2fNIqs0VvuKtqSHoAK8PkPFueD4xCam-PnR9aiMUE5FA3fV7pWhN-6g-Lr_1u2RdEMaozKc1WRvBESwuNXn4xTNA_c3SZaWJpeVvKm7Va86oj0Zyl_9y0mBn6z5oU2Rvq7OGwJLw==';

function getNewsletterController() {
  const match = html.match(/<script data-newsletter-signup>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error('Newsletter signup controller script was not found');
  return match[1];
}

function createMockElement(id) {
  const listeners = {};
  const attributes = {};
  const element = {
    id,
    hidden: false,
    textContent: '',
    children: [],
    clickCalls: 0,
    style: {},
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      toggle(value, force) {
        const shouldAdd = force === undefined ? !this.values.has(value) : force;
        if (shouldAdd) this.values.add(value);
        else this.values.delete(value);
      },
      contains(value) { return this.values.has(value); }
    },
    querySelectorAll() { return []; },
    addEventListener(event, callback) { listeners[event] = callback; },
    setAttribute(name, value) { attributes[name] = String(value); },
    getAttribute(name) { return attributes[name] ?? null; },
    appendChild(child) { this.children.push(child); child.parentNode = this; },
    click() { this.clickCalls += 1; if (listeners.click) listeners.click({ preventDefault() {} }); },
    listeners,
    attributes
  };
  return element;
}

function loadNewsletterController() {
  const ids = ['newsletterSignupButton', 'newsletterSignupModal', 'newsletterSignupClose', 'newsletterSignupFrameHost', 'newsletterPrivacyLink', 'privacyPolicyButton'];
  const nodes = Object.fromEntries(ids.map(id => [id, createMockElement(id)]));
  nodes.newsletterSignupModal.classList.add('hidden');
  let createdFrames = 0;
  const document = {
    activeElement: createMockElement('activeElement'),
    getElementById: id => nodes[id] || null,
    querySelectorAll: () => [],
    addEventListener() {},
    createElement(tagName) {
      createdFrames += 1;
      const frame = createMockElement(tagName);
      frame.tagName = tagName.toUpperCase();
      return frame;
    }
  };
  vm.runInNewContext(getNewsletterController(), { document, HTMLElement: function HTMLElement() {} });
  return { nodes, get createdFrames() { return createdFrames; } };
}

describe('newsletter signup', () => {
  it('places an accessible invitation, privacy link, and direct Brevo fallback in the footer', () => {
    const footer = html.match(/<footer[\s\S]*?<\/footer>/i)?.[0] || '';
    expect(footer).toContain('newsletterSignupButton');
    expect(footer).toContain('newsletterPrivacyLink');
    expect(footer).toMatch(/signup details are handled by Brevo/i);
    expect(footer).toContain('aria-controls="newsletterSignupModal"');
    expect(html).toContain('id="newsletterFallbackLink"');
    expect(html).toContain(`href="${FORM_URL}"`);
    expect(html).not.toMatch(/<iframe\b[^>]*\bsrc=["']https:\/\/b7607f4e\.sibforms\.com/i);
  });

  it('does not create or load the Brevo iframe until the visitor opens the form', () => {
    const runtime = loadNewsletterController();
    expect(runtime.createdFrames).toBe(0);
    expect(runtime.nodes.newsletterSignupFrameHost.children).toHaveLength(0);
    expect(runtime.nodes.newsletterSignupModal.classList.contains('hidden')).toBe(true);

    runtime.nodes.newsletterSignupButton.click();

    expect(runtime.createdFrames).toBe(1);
    expect(runtime.nodes.newsletterSignupFrameHost.children).toHaveLength(1);
    expect(runtime.nodes.newsletterSignupFrameHost.children[0].src).toBe(FORM_URL);
    expect(runtime.nodes.newsletterSignupButton.getAttribute('aria-expanded')).toBe('true');
    expect(runtime.nodes.newsletterSignupModal.classList.contains('hidden')).toBe(false);
  });

  it('reuses a single iframe when the signup panel is closed and reopened', () => {
    const runtime = loadNewsletterController();
    runtime.nodes.newsletterSignupButton.click();
    runtime.nodes.newsletterSignupClose.click();
    runtime.nodes.newsletterSignupButton.click();

    expect(runtime.createdFrames).toBe(1);
    expect(runtime.nodes.newsletterSignupFrameHost.children).toHaveLength(1);
  });

  it('opens the existing privacy policy and never treats iframe load as a subscription confirmation', () => {
    const runtime = loadNewsletterController();
    runtime.nodes.newsletterSignupButton.click();
    runtime.nodes.newsletterPrivacyLink.click();

    expect(runtime.nodes.privacyPolicyButton.clickCalls).toBe(1);
    const frame = runtime.nodes.newsletterSignupFrameHost.children[0];
    expect(frame.listeners.load).toBeUndefined();
    expect(frame.onload).toBeUndefined();
    const signupDialog = html.match(/<div id="newsletterSignupModal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i)?.[0] || '';
    expect(signupDialog).not.toMatch(/subscription complete|successfully subscribed|Anmeldung erfolgreich/i);
  });
});
