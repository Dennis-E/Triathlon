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

  it('publishes the latest customer-facing updates first', () => {
    const latestArticle = newsHtml.match(/<article\b[\s\S]*?<\/article>/i)?.[0];
    expect(latestArticle).toMatch(/Training patterns, closer details, and better exports/);
    expect(latestArticle).toContain('<time datetime="2026-11-02">November 2, 2026</time>');
    expect(latestArticle).toMatch(/Workout Time[\s\S]*?workout count, duration, or distance/i);
    expect(latestArticle).toMatch(/Pin a data detail[\s\S]*?speech bubble/i);
    expect(latestArticle).toMatch(/square or portrait[\s\S]*?Training Calendar[\s\S]*?multiple pages/i);
    expect(newsHtml.indexOf('Training patterns, closer details, and better exports')).toBeLessThan(newsHtml.indexOf('A smoother way through your training data'));
    expect(newsHtml).toMatch(/<article\b[\s\S]*?<h2[^>]*>A smoother way through your training data[\s\S]*?<time datetime="2026-10-19">October 19, 2026<\/time>[\s\S]*?arrow keys[\s\S]*?hidden[\s\S]*?keeps its current zoom[\s\S]*?choice of where to save[\s\S]*?newsletter signup[\s\S]*?activity illustrations[\s\S]*?<\/article>/i);
    expect(newsHtml.indexOf('A smoother way through your training data')).toBeLessThan(newsHtml.indexOf('More ways to explore your training—and a new way to import it'));
    expect(newsHtml).toMatch(/<article\b[\s\S]*?<h2[^>]*>More ways to explore your training—and a new way to import it[\s\S]*?<time datetime="2026-10-12">October 12, 2026<\/time>[\s\S]*?TrainingPeaks import[\s\S]*?Pie Charts[\s\S]*?Lifetime Statistics[\s\S]*?activity-aware messages[\s\S]*?<\/article>/i);
    expect(newsHtml.indexOf('More ways to explore your training—and a new way to import it')).toBeLessThan(newsHtml.indexOf('Wordcloud, clearer Personal Bests, and more control'));
    expect(newsHtml).toMatch(/<article\b[\s\S]*?<h2[^>]*>Wordcloud, clearer Personal Bests, and more control[\s\S]*?<time datetime="2026-10-05">October 5, 2026<\/time>[\s\S]*?frequency-ranked cloud[\s\S]*?Equipment and Personal Bests[\s\S]*?navigation arrows[\s\S]*?<\/article>/i);
    expect(newsHtml.indexOf('Wordcloud, clearer Personal Bests, and more control')).toBeLessThan(newsHtml.indexOf('Your training has a calendar now'));
    expect(newsHtml).toMatch(/<article\b[\s\S]*?<h2[^>]*>Your training has a calendar now[\s\S]*?<time datetime="2026-09-28">September 28, 2026<\/time>[\s\S]*?Training Calendar[\s\S]*?Pace vs \.\.\.[\s\S]*?<\/article>/i);
    expect(newsHtml.indexOf('Your training has a calendar now')).toBeLessThan(newsHtml.indexOf('TriAnalytica is now in alpha'));
  });

  it('keeps the published content in one ordered collection', () => {
    expect(newsHtml).toMatch(/<main\b[\s\S]*?(?:id="newsArticles"|aria-label="Published news")[\s\S]*?<article\b[\s\S]*?<\/article>[\s\S]*?<\/main>/i);
    expect((newsHtml.match(/<article\b/gi) || []).length).toBe(6);
    expect(newsHtml).not.toMatch(/coming soon|more news soon|unpublished/i);
  });

  it('illustrates every update with an accessible linked screenshot and caption', () => {
    const articles = newsHtml.match(/<article\b[\s\S]*?<\/article>/gi);
    expect(articles).toHaveLength(6);
    articles.forEach(article => {
      expect(article).toMatch(/<figure class="news-screenshot">[\s\S]*?<figcaption>[^<]+<\/figcaption>[\s\S]*?<\/figure>/);
      const image = article.match(/<img src="(assets\/previews\/[^\"]+\.png)" alt="([^\"]+)"[^>]*>/);
      expect(image).not.toBeNull();
      expect(image[2].length).toBeGreaterThan(20);
      expect(article).toContain(`<a href="${image[1]}" aria-label="`);
      const asset = fs.readFileSync(path.join(__dirname, '..', image[1]));
      expect(asset.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(asset.readUInt32BE(16)).toBeGreaterThan(0);
      expect(asset.readUInt32BE(20)).toBeGreaterThan(0);
      expect(image[0]).toContain(`width="${asset.readUInt32BE(16)}"`);
      expect(image[0]).toContain(`height="${asset.readUInt32BE(20)}"`);
    });
    expect((newsHtml.match(/loading="lazy"/g) || [])).toHaveLength(5);
    expect(newsHtml).toMatch(/\.news-screenshot img\s*\{[^}]*width: 100%;[^}]*height: auto;/);
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
    expect(newsHtml).toMatch(/A smoother way through your training data/);
    expect(newsHtml).toMatch(/Wordcloud, clearer Personal Bests, and more control/);
    expect(newsHtml).toMatch(/More ways to explore your training—and a new way to import it/);
    expect(newsHtml).toMatch(/Your training has a calendar now/);
    expect(newsHtml).toMatch(/fellow athletes[\s\S]*?feedback, suggestions, and wishes/i);
  });
});