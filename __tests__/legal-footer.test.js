/**
 * Legal footer: verifies the Impressum and Datenschutzerklärung content
 * required by specs/012-legal-imprint-privacy/spec.md is present in
 * index.html and reachable regardless of the active dashboard tab.
 */

const fs = require('fs');
const path = require('path');

const TAB_PANEL_IDS = [
  'vizPanelTotalDistance',
  'vizPanelPaceMetrics',
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
    it('shows the alpha feedback button next to the legal buttons', () => {
      expect(html).toMatch(/alpha phase.*please feedback/i);
      expect(html).toMatch(/href="mailto:myaidevproject@gmail\.com\?subject=TriAnalytica%20Feedback&body=/i);
      expect(html).toMatch(/Open an email to send feedback/i);
    });

    it('shows an Impressum button and preserves the owner contact information in the modal', () => {
      expect(html).toMatch(/Impressum/i);
      expect(html).toMatch(/Dennis Eggert/);
      expect(html).toMatch(/Germanenstr\. 6/);
      expect(html).toMatch(/53175 Bonn/i);
      expect(html).toMatch(/myaidevproject@gmail.com/i);
      expect(html).toMatch(/mailto:[^"'\s]+@[^"'\s]+/);
      expect(html).toMatch(/id="imprintButton"|id="imprintPolicyButton"/i);
    });

    it('does not contain a phone number', () => {
      expect(html).not.toMatch(/tel:/i);
      const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
      expect(footerMatch).not.toBeNull();
      const footerHtml = footerMatch[0];
      expect(footerHtml).not.toMatch(/\+?\d[\d\s-]{5,}\d/);
    });
  });

  describe('Datenschutzerklärung / Privacy Policy (US2)', () => {
    it('shows a dedicated privacy link/button in both languages', () => {
      expect(html).toMatch(/Datenschutzerklärung\s*\/\s*Privacy Policy/i);
      expect(html).toMatch(/Datenschutzerklärung/i);
      expect(html).toMatch(/Privacy Policy/i);
      expect(html).toMatch(/id="privacyPolicyButton"/i);
    });

    it('does not include the long footer privacy sentence', () => {
      expect(html).not.toMatch(/Deine importierten GPX-\/CSV-Aktivitätsdateien werden lokal in deinem Browser verarbeitet/i);
      expect(html).not.toMatch(/Your imported GPX\/CSV activity files are processed locally in your browser/i);
    });

    it('keeps the detailed privacy policy text in the modal instead of inline in the footer', () => {
      expect(html).toMatch(/privacyPolicyModal/i);
      expect(html).toMatch(/Verarbeitung importierter Aktivitätsdaten|Processing of imported activity data/i);
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
