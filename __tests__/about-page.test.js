const fs = require('fs');
const path = require('path');

function readPage(fileName) {
  return fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');
}

function textContent(html) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '\u2014', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d', hellip: '\u2026' };
  return html.replace(/<\/(?:p|h[1-6]|section|main|nav|header)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, value) => {
      if (value.startsWith('#')) {
        return String.fromCodePoint(value[1].toLowerCase() === 'x' ? parseInt(value.slice(2), 16) : Number(value.slice(1)));
      }
      return entities[value] ?? entity;
    })
    .replace(/\s+/gu, ' ').trim();
}

function region(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'i'));
  expect(match).not.toBeNull();
  return match[0];
}

const greeting = 'Hello fellow triathletes 👋';
const sectionTitles = [
  'A late start. A long-lasting habit.',
  'The kids joined a club. So did the rest of us.',
  'Why TriAnalytica?'
];
const approvedCopy = `Hello fellow triathletes 👋
I’m Dennis — just another age grouper with a soft spot for training data.

TriAnalytica is my fun side project: a place where my passion for triathlon meets my curiosity about AI. I’m learning what AI can do, how to build software with it, and what happens when I apply that learning to something I actually care about.

Turns out, my training history provides plenty to work with.

A late start. A long-lasting habit.
I wasn’t a sporty kid who grew up racing. I got into endurance sport at university, when I quit smoking and started moving.

Somewhere along the way, that became swimming, cycling, and running. Now I happily belong to the large and distinguished group known as “just another age grouper”.

I enjoy training, racing, and occasionally convincing myself that looking at the data counts as recovery.

The kids joined a club. So did the rest of us.
About two years ago, my kids took part in a children’s triathlon and wanted to join our local triathlon club.

As these things go, the whole family gradually got pulled into club life. These days, I happily manage the youth section: more than 80 kids and teens training and competing at local, regional, and national levels.

Lots of organisation. Lots of enthusiasm. Lots of fun. :-)

Why TriAnalytica?
Because I wanted to explore my own training — and learn how to build something along the way.

TriAnalytica brings those interests together: endurance sport, training data, and developing with AI. It’s an evolving side project, shaped by curiosity and the occasional “I wonder if I could make it do this…”

If it helps you discover something interesting about your own training, have a smile, or find a visual worth sharing with your fellow athletes, even better.

I’d be very happy to hear your feedback. Drop me a line at myaidevproject@gmail.com.

To stay up to date, you can sign up for the newsletter (via Brevo) or follow TriAnalytica on Instagram.

See you at the start line.

Dennis

Explore your training`;

describe('US1 About introduction', () => {
  it('preserves punctuation next to inline links while separating paragraphs', () => {
    expect(textContent('<p>Write to <a href="#">Dennis</a>.</p><p>Thanks!</p>')).toBe('Write to Dennis. Thanks!');
  });

  it('exposes About immediately after News in the existing main header', () => {
    const header = region(readPage('index.html'), 'header');
    expect(header).toMatch(/<a\b[^>]*href="\.\/news\.html"[^>]*>\s*News\s*<\/a>\s*<a\b[^>]*href="\.\/about\.html"[^>]*>\s*About\s*<\/a>/);
    expect(header).not.toMatch(/vizPanel/);
    const aboutLink = header.match(/<a\b[^>]*href="\.\/about\.html"[^>]*>/)[0];
    expect(aboutLink).not.toMatch(/\bhidden\b/);
  });

  it('delivers an English UTF-8 document with responsive metadata and the approved title', () => {
    const html = readPage('about.html');
    expect(html).toMatch(/^<!DOCTYPE html>/i);
    expect(html).toMatch(/<html\b[^>]*lang="en"/);
    expect(html).toMatch(/<meta charset="UTF-8">/i);
    expect(html).toMatch(/<meta name="viewport" content="width=device-width, initial-scale=1\.0">/);
    expect(html).toContain('<title>About TriAnalytica</title>');
    expect(html).toMatch(/<meta name="description" content="[^"]+">/);
    expect(html).toMatch(/<main\b[^>]*id="aboutContent"/);
  });

  it('uses the supplied greeting and exactly three subordinate section headings', () => {
    const html = readPage('about.html');
    const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)];
    expect(headings.map(match => [Number(match[1]), textContent(match[2])])).toEqual([
      [1, greeting], ...sectionTitles.map(title => [2, title])
    ]);
  });

  it('preserves the complete approved main copy and punctuation with no extra editorial content', () => {
    const main = region(readPage('about.html'), 'main');
    expect(textContent(main)).toBe(approvedCopy.replace(/\s+/gu, ' ').trim());
  });

  it('needs no import, embedded signup, application scripts, or biographical imagery', () => {
    const html = readPage('about.html');
    expect(html).not.toMatch(/<(?:form|input|iframe|video|canvas)\b|\bonclick=|localStorage|indexedDB|analysis-counter|dashboard-.*\.js/i);
    expect(region(html, 'main')).not.toMatch(/<img\b|<script\b/);
    const images = html.match(/<img\b[^>]*>/g) || [];
    expect(images).toHaveLength(1);
    expect(images[0]).toMatch(/src="assets\/logo\.png"/);
    expect(fs.existsSync(path.join(__dirname, '../assets/logo.png'))).toBe(true);
    const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || [];
    expect(scripts.every(script => /^<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>$/.test(script))).toBe(true);
  });

  it('offers feedback and updates using the existing email and signup destination and the confirmed Instagram profile', () => {
    const main = region(readPage('about.html'), 'main');
    const index = readPage('index.html');
    const newsletterUrl = index.match(/id="newsletterFallbackLink" href="([^"]+)"/)[1];
    expect(index).toContain('mailto:myaidevproject@gmail.com');
    expect(main).toMatch(/<a\b[^>]*href="mailto:myaidevproject@gmail\.com\?subject=TriAnalytica%20Feedback"[^>]*>myaidevproject@gmail\.com<\/a>/);
    expect(main).toContain(`href="${newsletterUrl}"`);
    expect(main).toMatch(/<a\b[^>]*href="https:\/\/b7607f4e\.sibforms\.com\/[^"]+"[^>]*referrerpolicy="no-referrer"[^>]*>newsletter \(via Brevo\)<\/a>/);
    expect(main).toMatch(/<a\b[^>]*href="https:\/\/www\.instagram\.com\/trianalytica\/"[^>]*referrerpolicy="no-referrer"[^>]*>TriAnalytica on Instagram<\/a>/);
  });
});

describe('US2 Return to analysis', () => {
  it('provides separate native header destinations for the brand, dashboard, and News', () => {
    const header = region(readPage('about.html'), 'header');
    const links = header.match(/<a\b[^>]*>[\s\S]*?<\/a>/g);
    const brand = links.find(link => /aria-label="Back to TriAnalytica dashboard"/.test(link));
    const dashboard = links.find(link => textContent(link) === 'Back to dashboard');
    const news = links.find(link => textContent(link) === 'News');
    expect(brand).toMatch(/href="\.\/index\.html"/);
    expect(dashboard).toMatch(/href="\.\/index\.html"/);
    expect(news).toMatch(/href="\.\/news\.html"/);
  });

  it('ends the main content with its own analysis link after the signature', () => {
    const main = region(readPage('about.html'), 'main');
    const finalLink = main.match(/<a\b[^>]*id="exploreTrainingLink"[^>]*>[\s\S]*?<\/a>/)?.[0];
    expect(finalLink).toMatch(/href="\.\/index\.html"/);
    expect(textContent(finalLink)).toBe('Explore your training');
    expect(textContent(main)).toMatch(/See you at the start line\. Dennis Explore your training$/);
    expect(main).toMatch(/<\/a>\s*<\/section>\s*<\/main>$/);
  });

  it('uses ordinary same-tab links without altering the existing index landing action', () => {
    const html = readPage('about.html');
    const links = html.match(/<a\b[^>]*>/g);
    expect(links).toHaveLength(7);
    const localLinks = links.filter(link => /href="\.\//.test(link));
    expect(localLinks).toHaveLength(4);
    localLinks.forEach(link => expect(link).toMatch(/href="\.\/(?:index|news)\.html"/));
    links.forEach(link => {
      expect(link).not.toMatch(/target=|onclick=|tabindex="-/);
    });
    expect(html).not.toMatch(/history\.|window\.open|localStorage|sessionStorage/);
    expect(region(readPage('index.html'), 'header')).toMatch(/<button\b[^>]*onclick="goToLanding\(\)"/);
  });
});

describe('US3 About accessible reading structure', () => {
  it('provides labelled landmarks and sections without a fixed content-covering header', () => {
    const html = readPage('about.html');
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html).toMatch(/<nav\b[^>]*aria-label="Site navigation"/);
    const main = region(html, 'main');
    const sections = [...main.matchAll(/<section\b[^>]*aria-labelledby="([^"]+)"/g)];
    expect(sections).toHaveLength(4);
    sections.forEach(section => expect(main).toContain(`id="${section[1]}"`));
    expect(html).not.toMatch(/position:\s*(?:fixed|absolute)|\btabindex="-/);
  });

  it('keeps focus styling and reflow rules in local CSS rather than requiring scripts', () => {
    const html = readPage('about.html');
    expect(html).toMatch(/a:focus-visible\s*\{[^}]*outline:\s*3px solid[^}]*outline-offset:/);
    expect(html).toMatch(/\.header-inner\s*\{[^}]*flex-wrap:\s*wrap/);
    expect(html).toMatch(/\.site-nav\s*\{[^}]*flex-wrap:\s*wrap/);
    expect(html).toMatch(/\.about-copy\s*\{[^}]*65ch/);
    expect(html).toMatch(/font-size:\s*[\d.]+rem/);
    expect(html).toMatch(/letter-spacing:\s*0/);
    expect(html).not.toMatch(/font-size:[^;}]*\b(?:vw|vh)|letter-spacing:\s*-|<script\b/);
  });
});

describe('US3 header navigation reflow', () => {
  it('wraps the affected index group while retaining every existing status and navigation contract', () => {
    const header = region(readPage('index.html'), 'header');
    const actions = header.match(/<div\b[^>]*class="[^"]*site-header-actions[^>]*>/)?.[0];
    expect(actions).toMatch(/\bflex-wrap\b/);
    expect(actions).toMatch(/\bmin-w-0\b/);
    expect(actions).toMatch(/\bmax-w-full\b/);
    expect(actions).toMatch(/\bgap-x-4\b/);
    expect(actions).toMatch(/\bgap-y-3\b/);
    expect(header).toMatch(/id="statusBadge"[^>]*\bmin-w-0\b[^>]*\bmax-w-full\b/);
    expect(header).toMatch(/id="statusText"[^>]*\bbreak-words\b/);
    expect(header).toMatch(/href="\.\/news\.html"/);
    expect(header).toMatch(/onclick="goToLanding\(\)"/);
  });

  it('explicitly styles keyboard focus and constrains the logo at enlarged text sizes', () => {
    const html = readPage('index.html');
    const header = region(html, 'header');
    expect(html).toMatch(/\.site-header-actions a:focus-visible[\s\S]*?\{[^}]*outline:[^}]*outline-offset:/);
    expect(html).toMatch(/header > button:focus-visible/);
    expect(header).toMatch(/<button\b[^>]*\bmax-w-full\b[^>]*\bmin-w-0\b/);
    expect(header).toMatch(/<img\b[^>]*\bmax-w-full\b/);
    expect(header).not.toMatch(/whitespace-nowrap|overflow-hidden/);
  });
});