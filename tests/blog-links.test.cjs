// tests/blog-links.test.cjs
//
// FD-1080 — links stored in a post's body render as clickable links.

const test = require('node:test');
const assert = require('node:assert');

const load = () => import('../src/lib/blogSpans.mjs');

test('a linked span renders as an anchor to its href', async () => {
  const { spansToHtml } = await load();
  const html = spansToHtml(
    [{ text: 'Free trial at ', marks: [] }, { text: 'tryflynt.ai', marks: ['k1'] }, { text: '.', marks: [] }],
    [{ _key: 'k1', _type: 'link', href: 'https://tryflynt.ai/go/blog' }],
  );
  assert.strictEqual(html, 'Free trial at <a href="https://tryflynt.ai/go/blog">tryflynt.ai</a>.');
});

test('a bold link keeps the bold inside the anchor', async () => {
  const { spansToHtml } = await load();
  const html = spansToHtml(
    [{ text: 'read this', marks: ['strong', 'k1'] }],
    [{ _key: 'k1', _type: 'link', href: '/blog/x' }],
  );
  assert.strictEqual(html, '<a href="/blog/x"><strong>read this</strong></a>');
});

test('text without a link, or a link with no href, stays plain', async () => {
  const { spansToHtml } = await load();
  assert.strictEqual(spansToHtml([{ text: 'plain', marks: ['em'] }]), '<em>plain</em>');
  assert.strictEqual(
    spansToHtml([{ text: 'x', marks: ['k1'] }], [{ _key: 'k1', _type: 'link' }]),
    'x',
  );
});

test('quotes in an href cannot break out of the attribute', async () => {
  const { spansToHtml } = await load();
  const html = spansToHtml([{ text: 'x', marks: ['k1'] }], [{ _key: 'k1', _type: 'link', href: 'https://a.com/"onmouseover="x' }]);
  assert.strictEqual(html, '<a href="https://a.com/&quot;onmouseover=&quot;x">x</a>');
});
