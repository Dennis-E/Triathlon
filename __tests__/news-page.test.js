const fs = require('fs');
const path = require('path');

function readPage(fileName) {
  return fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');
}

describe('News page contract', () => {
  let indexHtml;
  let newsHtml;

  beforeAll(() => {
    indexHtml = readPage('index.html');
    newsHtml = readPage('news.html');
  });

  it('exposes News navigation from the existing header', () => {
    expect(indexHtml).toMatch(/<header[\s\S]*?<a[^>]+href="\.\/news\.html"[^>]*>\s*News\s*<\/a>[\s\S]*?<\/header>/i);
    expect(newsHtml).toMatch(/<a[^>]+href="\.\/index\.html"[^>]*>[^<]*(?:back|dashboard|TriAnalytica)[^<]*<\/a>/i);
  });

  it('publishes the alpha launch article', () => {
    expect(newsHtml).toMatch(/<title>[^<]*TriAnalytica News[^<]*<\/title>/i);
    expect(newsHtml).toMatch(/<h1[^>]*>[^<]*News[^<]*<\/h1>/i);
    expect(newsHtml).toMatch(/<article\b[\s\S]*?<h2\b[\s\S]*?<\/h2>[\s\S]*?(?:published|publication|2026)[\s\S]*?<p\b[\s\S]*?alpha[\s\S]*?<\/article>/i);
    expect(newsHtml).toMatch(/fellow athletes/i);
    expect(newsHtml).toMatch(/feedback/i);
    expect(newsHtml).toMatch(/suggestions/i);
    expect(newsHtml).toMatch(/wishes/i);
  });

  it('keeps the published content in one ordered collection', () => {
    expect(newsHtml).toMatch(/<main\b[\s\S]*?(?:id="newsArticles"|aria-label="Published news")[\s\S]*?<article\b[\s\S]*?<\/article>[\s\S]*?<\/main>/i);
    expect((newsHtml.match(/<article\b/gi) || []).length).toBe(1);
    expect(newsHtml).not.toMatch(/coming soon|more news soon|unpublished/i);
  });

  it('keeps the News header fixed above the page content', () => {
    expect(newsHtml).toMatch(/<header[^>]*class="[^"]*\bfixed\b[^"]*\btop-0\b[^"]*\bz-\d+[^"]*"/i);
    expect(newsHtml).toMatch(/<main[^>]*class="[^"]*\bpt-(?:24|28|32|36|40)\b[^"]*"/i);
    expect(newsHtml).toMatch(/<a[^>]+href="\.\/index\.html"[^>]*>[^<]*Back to dashboard[^<]*<\/a>/i);
  });

  it('preserves responsive header sizing and article content', () => {
    expect(newsHtml).toMatch(/<header[^>]*class="[^"]*\bw-full\b[^"]*"/i);
    expect(newsHtml).toMatch(/<div[^>]*class="[^"]*\bnews-shell\b[^"]*\bflex\b[^"]*\bitems-center\b[^"]*"/i);
    expect(newsHtml).toMatch(/TriAnalytica is now in alpha/);
    expect(newsHtml).toMatch(/fellow athletes[\s\S]*?feedback, suggestions, and wishes/i);
  });
});