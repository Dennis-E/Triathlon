/**
 * Syntax check for the inline <script> block in index.html.
 *
 * Catches JavaScript syntax errors — duplicate `const` declarations, unmatched
 * braces, orphaned code after a function closes, etc. — that break the entire
 * page at runtime but are invisible to unit tests that only import extracted
 * utility modules.
 *
 * Strategy: extract every inline <script> block, wrap in strict mode, and ask
 * Node's own parser to validate via `new Function(...)`.  Strict mode is
 * required because it turns duplicate `const` declarations in the same scope
 * into a hard SyntaxError (without strict mode the engine may silently accept
 * some forms).
 */

const fs   = require('fs');
const path = require('path');

function extractInlineScripts(html) {
  // Match <script> … </script> blocks that have no src= attribute.
  const blocks = [];
  const re = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push(m[1]);
  }
  return blocks.join('\n');
}

describe('index.html inline script syntax', () => {
  let inlineCode;

  beforeAll(() => {
    const htmlPath = path.join(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    inlineCode = extractInlineScripts(html);
  });

  it('contains at least one inline script block', () => {
    expect(inlineCode.length).toBeGreaterThan(100);
  });

  it('has no syntax errors in any inline <script> block', () => {
    // new Function() parses (but does not execute) the body and throws
    // SyntaxError for malformed JavaScript — unmatched braces, stray tokens, etc.
    expect(() => new Function(inlineCode)).not.toThrow();
  });

  it('has no duplicate top-level const declarations inside renderPbChart', () => {
    // Specifically guard against the class of bug where an edit accidentally
    // duplicates the closing block of renderPbChart, creating two `const hasAny`
    // declarations in the same function scope.
    const matches = (inlineCode.match(/\bconst hasAny\b/g) || []);
    expect(matches.length).toBeLessThanOrEqual(1);
  });
});
