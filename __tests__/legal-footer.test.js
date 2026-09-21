/**
 * Legal footer: verifies the Impressum and Datenschutzerklärung content
 * required by specs/012-legal-imprint-privacy/spec.md is present in
 * index.html and reachable regardless of the active dashboard tab.
 */

const fs = require('fs');
const path = require('path');

const TAB_PANEL_IDS = [
  'vizPanelTotalDistance',
  'vizPanelHeartratePace',
  'vizPanelEquipment',
  'vizPanelEquipmentTimeline',
  'vizPanelPersonalBests',
  'vizPanelHeatmap'
];

describe('legal footer', () => {
  let html;

  beforeAll(() => {
    const htmlPath = path.join(__dirname, '../index.html');
    html = fs.readFileSync(htmlPath, 'utf-8');
  });

  it('contains a footer element', () => {
    expect(html).toMatch(/<footer[\s>]/);
  });

  describe('Impressum (US1)', () => {
    it('shows an Impressum heading with owner name, address, and email', () => {
      expect(html).toMatch(/Impressum/);
      expect(html).toMatch(/mailto:[^"'\s]+@[^"'\s]+/);
    });

    it('does not contain a phone number', () => {
      expect(html).not.toMatch(/tel:/i);
      // Flags a standalone phone-like sequence of 6+ digits (with optional +, spaces, dashes)
      // near the footer, without false-positiving on unrelated numeric content elsewhere.
      const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
      expect(footerMatch).not.toBeNull();
      const footerHtml = footerMatch[0];
      expect(footerHtml).not.toMatch(/\+?\d[\d\s-]{5,}\d/);
    });
  });

  describe('Datenschutzerklärung (US2)', () => {
    it('shows a Datenschutzerklärung heading', () => {
      expect(html).toMatch(/Datenschutzerklärung/);
    });

    it('states that imported data is processed locally and not stored on a server', () => {
      const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
      const footerHtml = footerMatch[0];
      expect(footerHtml).toMatch(/lokal in Ihrem Browser verarbeitet/);
      expect(footerHtml).toMatch(/nicht auf einem Server .* gespeichert/);
    });

    it('discloses that external libraries may trigger standard network requests', () => {
      const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
      const footerHtml = footerMatch[0];
      expect(footerHtml).toMatch(/CDN/);
      expect(footerHtml).toMatch(/Browser-\/Netzwerkanfragen/);
    });
  });

  describe('reachable from every tab (US3)', () => {
    it('places the footer outside every tab panel element', () => {
      const footerIndex = html.indexOf('<footer');
      expect(footerIndex).toBeGreaterThan(-1);

      TAB_PANEL_IDS.forEach((panelId) => {
        const panelOpenRe = new RegExp(`<div id="${panelId}"[^>]*>`);
        const panelOpenMatch = html.match(panelOpenRe);
        expect(panelOpenMatch).not.toBeNull();

        // The footer must not be located between this panel's opening tag and
        // the next tab panel/footer, i.e. it must not be nested inside it.
        const panelStart = panelOpenMatch.index;
        expect(footerIndex).toBeGreaterThan(panelStart);
      });
    });
  });
});
