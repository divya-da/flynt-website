// tests/free-playbook-links.test.cjs
//
// FD-1110 — the free BD Playbook: every playbook link on the site points at
// the app's sign-up page carrying exactly the ticket's tag, and nothing else.
// Read off the source, so a hand edit to one of the three links is caught.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(`${__dirname}/../${file}`, 'utf8');

const EXPECTED = 'https://app.tryflynt.ai/signup?utm_campaign=free_resource';

test('the playbook link is the app sign-up page with the free_resource campaign', () => {
  const source = read('src/lib/playbook.js');
  const campaign = source.match(/PLAYBOOK_CAMPAIGN = '([^']+)'/)[1];
  assert.strictEqual(campaign, 'free_resource');
  assert.match(source, /https:\/\/app\.tryflynt\.ai\/signup\?utm_campaign=\$\{PLAYBOOK_CAMPAIGN\}/);
  // No utm_source on the link itself: the sign-up stays Direct and keeps the
  // campaign. (The file's comments explain that, so only code lines count.)
  const code = source.split('\n').filter((line) => !line.trim().startsWith('//')).join('\n');
  assert.doesNotMatch(code, /utm_source/);
  // Resolved, the same string the app recognises.
  assert.strictEqual(
    `https://app.tryflynt.ai/signup?utm_campaign=${campaign}`,
    EXPECTED,
  );
});

test('the nav (desktop and phone) and the homepage banner all use that one link', () => {
  const layout = read('src/layouts/Layout.astro');
  const home = read('src/pages/index.astro');
  const navLinks = layout.match(/href=\{PLAYBOOK_SIGNUP_URL\}[^>]*data-playbook-link/g) || [];
  const bannerLinks = home.match(/href=\{PLAYBOOK_SIGNUP_URL\}[^>]*data-playbook-link/g) || [];
  assert.strictEqual(navLinks.length, 2, 'desktop pill + phone pill');
  assert.strictEqual(bannerLinks.length, 1, 'the banner button');
  // The banner points at nothing else — the download is the app's.
  const banner = home.slice(home.indexOf('<section class="playbook"'), home.indexOf('SECTION — SOCIAL PROOF BAR'));
  assert.doesNotMatch(banner, /\.pdf/i);
  assert.strictEqual((banner.match(/href=/g) || []).length, 1, 'one link in the banner');
});

test('the copy is the ticket\'s', () => {
  const source = read('src/lib/playbook.js');
  assert.match(source, /The Business Development Tree/);
  assert.match(
    source.replace(/' \+\n\s*'/g, ''),
    /You need eleven clients, not a thousand leads\. Get the numbers behind that, the four ways to find them, and real data on what actually gets a reply\./,
  );
  const layout = read('src/layouts/Layout.astro');
  assert.strictEqual((layout.match(/Free BD Playbook/g) || []).length, 2, 'the nav button label, desktop + phone');
});
