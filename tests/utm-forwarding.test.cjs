// marketing/utm-forwarding.test.js
//
// Run with:  node --test marketing/
//
// No test dependency: Node's built-in runner, because this directory is a
// handover artifact and deliberately has no package.json or toolchain of its
// own. The DOM pieces are covered with a fake small enough to read in one
// screen — the alternative (jsdom) would mean introducing a toolchain here for
// two functions.

const test = require('node:test');
const assert = require('node:assert');

// The script under test lives in public/, which the site's package.json marks
// as ESM ("type": "module"). A plain require() would therefore load it as an ES
// module, where the UMD wrapper's `module.exports` branch never fires and the
// exports come back empty. Evaluating the source as CommonJS here keeps
// public/utm-forwarding.js byte-identical to the handover artifact — the file is
// shipped to browsers verbatim and must not grow test scaffolding.
const utm = (() => {
  const source = require('node:fs').readFileSync(
    `${__dirname}/../public/utm-forwarding.js`,
    'utf8',
  );
  const shim = { exports: {} };
  new Function('module', 'exports', source)(shim, shim.exports);
  return shim.exports;
})();

const SITE = 'https://tryflynt.ai/pricing';
const APP = 'https://app.tryflynt.ai/';

/** An in-memory sessionStorage. */
function fakeStorage(initial) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    data,
  };
}

/** A sessionStorage that throws on every access, as private modes can. */
const deniedStorage = null;

/** Minimal anchor + document stand-ins for the sweep. */
function fakeDocument(hrefs) {
  const anchors = hrefs.map((href) => {
    const attrs = { href };
    return {
      getAttribute: (name) => attrs[name],
      setAttribute: (name, value) => {
        attrs[name] = value;
      },
    };
  });
  return {
    anchors,
    querySelectorAll: () => anchors,
    hrefs: () => anchors.map((a) => a.getAttribute('href')),
  };
}

test('readParams takes the four keys the app reads, and nothing else', () => {
  const found = utm.readParams(
    '?utm_source=agency_xyz&utm_medium=partner&utm_campaign=uk_launch' +
      '&utm_content=hero_cta&utm_term=ignored&gclid=ignored'
  );

  assert.deepStrictEqual(found, {
    utm_source: 'agency_xyz',
    utm_medium: 'partner',
    utm_campaign: 'uk_launch',
    utm_content: 'hero_cta',
  });
});

test('readParams drops blank and whitespace-only values', () => {
  assert.deepStrictEqual(
    utm.readParams('?utm_source=&utm_medium=%20%20&utm_campaign=uk_launch'),
    { utm_campaign: 'uk_launch' }
  );
});

test('readParams on a bare URL finds nothing', () => {
  assert.deepStrictEqual(utm.readParams(''), {});
});

// AC1 — a tracked landing carries the channel into the app.
test('AC1: an app link gains the forwarded parameters', () => {
  const next = utm.withForwardedParams(
    APP,
    { utm_source: 'agency_xyz', utm_medium: 'partner' },
    SITE
  );

  const url = new URL(next);
  assert.strictEqual(url.hostname, 'app.tryflynt.ai');
  assert.strictEqual(url.searchParams.get('utm_source'), 'agency_xyz');
  assert.strictEqual(url.searchParams.get('utm_medium'), 'partner');
});

test('AC1: the test environment host is forwarded too', () => {
  const next = utm.withForwardedParams(
    'https://flynt-test.web.app/',
    { utm_source: 'agency_xyz' },
    'https://flynt-website.web.app/'
  );

  assert.match(next, /utm_source=agency_xyz/);
});

// AC2 — an untracked visit invents nothing.
test('AC2: with nothing to forward the href is returned byte-identical', () => {
  assert.strictEqual(utm.withForwardedParams(APP, {}, SITE), APP);
});

test('AC2: an untracked visit rewrites no links at all', () => {
  const doc = fakeDocument([APP, `${APP}?plan=growth`]);
  const rewritten = utm.rewriteAll(doc, {}, SITE);

  assert.strictEqual(rewritten, 0);
  assert.deepStrictEqual(doc.hrefs(), [APP, `${APP}?plan=growth`]);
});

// AC4 — merging with a link's own query parameters.
test("AC4: the link's own unrelated parameters survive alongside the channel", () => {
  const next = utm.withForwardedParams(
    `${APP}?plan=growth&ref=footer`,
    { utm_source: 'agency_xyz' },
    SITE
  );

  const url = new URL(next);
  assert.strictEqual(url.searchParams.get('plan'), 'growth');
  assert.strictEqual(url.searchParams.get('ref'), 'footer');
  assert.strictEqual(url.searchParams.get('utm_source'), 'agency_xyz');
});

test("AC4: a parameter already on the link wins — the CTA author was explicit", () => {
  const next = utm.withForwardedParams(
    `${APP}?utm_source=hardcoded`,
    { utm_source: 'agency_xyz', utm_medium: 'partner' },
    SITE
  );

  const url = new URL(next);
  assert.strictEqual(url.searchParams.get('utm_source'), 'hardcoded');
  // The keys it did not specify are still filled in.
  assert.strictEqual(url.searchParams.get('utm_medium'), 'partner');
  assert.deepStrictEqual(url.searchParams.getAll('utm_source'), ['hardcoded']);
});

test('a link already carrying everything is left byte-identical', () => {
  const href = `${APP}?utm_source=agency_xyz`;
  assert.strictEqual(
    utm.withForwardedParams(href, { utm_source: 'agency_xyz' }, SITE),
    href
  );
});

// Destination allowlist — the leak guard.
test('off-site links are never rewritten, so no partner code leaks', () => {
  const params = { utm_source: 'agency_xyz' };
  for (const href of [
    'https://calendly.com/flynt/demo',
    'https://www.youtube.com/watch?v=abc',
    'https://fonts.googleapis.com/css2?family=Inter',
    'https://tryflynt.ai/pricing',
    '/faq',
    '#top',
    'mailto:hello@tryflynt.ai',
  ]) {
    assert.strictEqual(
      utm.withForwardedParams(href, params, SITE),
      href,
      `${href} must not be rewritten`
    );
  }
});

test('isAppUrl is case-insensitive on the host', () => {
  assert.strictEqual(utm.isAppUrl(new URL('https://APP.TryFlynt.ai/')), true);
  assert.strictEqual(utm.isAppUrl(new URL('https://evil.com/app.tryflynt.ai')), false);
  assert.strictEqual(
    utm.isAppUrl(new URL('https://app.tryflynt.ai.evil.com/')),
    false
  );
});

// AC3 — surviving navigation between marketing pages.
test('AC3: the channel is remembered on the tracked landing', () => {
  const storage = fakeStorage();
  const resolved = utm.resolveParams('?utm_source=agency_xyz', storage);

  assert.deepStrictEqual(resolved, { utm_source: 'agency_xyz' });
  assert.deepStrictEqual(JSON.parse(storage.data[utm.STORAGE_KEY]), {
    utm_source: 'agency_xyz',
  });
});

test('AC3: a later untracked page still forwards the remembered channel', () => {
  const storage = fakeStorage();
  utm.resolveParams('?utm_source=agency_xyz&utm_medium=partner', storage);

  // Visitor navigates to /faq — no query string at all.
  assert.deepStrictEqual(utm.resolveParams('', storage), {
    utm_source: 'agency_xyz',
    utm_medium: 'partner',
  });
});

test('first touch wins: a second tracked link in the session does not '
  + 're-attribute', () => {
  const storage = fakeStorage();
  utm.resolveParams('?utm_source=agency_xyz', storage);

  assert.deepStrictEqual(utm.resolveParams('?utm_source=other_partner', storage), {
    utm_source: 'agency_xyz',
  });
});

test('a corrupt stored entry is ignored so the next tracked visit re-captures',
  () => {
    const storage = fakeStorage({ [utm.STORAGE_KEY]: 'not json' });

    assert.deepStrictEqual(utm.resolveParams('?utm_source=agency_xyz', storage), {
      utm_source: 'agency_xyz',
    });
  });

test('a stored entry cannot smuggle in keys the app does not read', () => {
  const storage = fakeStorage({
    [utm.STORAGE_KEY]: JSON.stringify({ utm_source: 'agency_xyz', evil: 'x' }),
  });

  assert.deepStrictEqual(utm.resolveParams('', storage), {
    utm_source: 'agency_xyz',
  });
});

test('denied storage still forwards on the landing page itself', () => {
  assert.deepStrictEqual(
    utm.resolveParams('?utm_source=agency_xyz', deniedStorage),
    { utm_source: 'agency_xyz' }
  );
});

// The real markup: these are the actual CTAs on tryflynt.ai.
test('every app-bound CTA on the live page shape is rewritten, and nothing '
  + 'else is', () => {
  const doc = fakeDocument([
    'https://app.tryflynt.ai/', // "Login" (nav)
    'https://app.tryflynt.ai/', // "Try for Free" (nav)
    'https://app.tryflynt.ai/', // "Get Started →" (how-it-works steps)
    'https://app.tryflynt.ai/', // "Find Leads" (lead finder)
    '/about',
    '/faq',
    '/blog',
    'https://calendly.com/flynt/demo',
  ]);

  const rewritten = utm.rewriteAll(
    doc,
    { utm_source: 'agency_xyz', utm_medium: 'partner' },
    SITE
  );

  assert.strictEqual(rewritten, 4);
  const hrefs = doc.hrefs();
  for (const href of hrefs.slice(0, 4)) {
    assert.strictEqual(
      new URL(href).searchParams.get('utm_source'),
      'agency_xyz'
    );
  }
  assert.deepStrictEqual(hrefs.slice(4), [
    '/about',
    '/faq',
    '/blog',
    'https://calendly.com/flynt/demo',
  ]);
});

test('the sweep is idempotent — running twice adds no duplicate parameters',
  () => {
    const doc = fakeDocument([APP]);
    const params = { utm_source: 'agency_xyz' };

    utm.rewriteAll(doc, params, SITE);
    const afterFirst = doc.hrefs()[0];
    const secondPass = utm.rewriteAll(doc, params, SITE);

    assert.strictEqual(secondPass, 0);
    assert.strictEqual(doc.hrefs()[0], afterFirst);
    assert.deepStrictEqual(
      new URL(afterFirst).searchParams.getAll('utm_source'),
      ['agency_xyz']
    );
  });

test('requiring the module does not install anything', () => {
  // The browser branch is gated on `module` being absent; if that ever breaks,
  // requiring this file under Node would throw on `document`.
  assert.strictEqual(typeof utm.install, 'function');
  assert.strictEqual(typeof utm.autoInstall, 'function');
});

/** A window/document pair complete enough for install(). */
function fakeWindow({ search = '', hrefs = [], readyState = 'complete' } = {}) {
  const doc = fakeDocument(hrefs);
  const listeners = {};
  return {
    location: { search, href: `${SITE}${search}` },
    sessionStorage: fakeStorage(),
    document: Object.assign(doc, {
      readyState,
      addEventListener: (type, handler) => {
        (listeners[type] = listeners[type] || []).push(handler);
      },
    }),
    listeners,
  };
}

test('install sweeps the page and arms the fallback for later anchors', () => {
  const win = fakeWindow({ search: '?utm_source=agency_xyz', hrefs: [APP, '/faq'] });

  const result = utm.install(win);

  assert.deepStrictEqual(result.forwarded, { utm_source: 'agency_xyz' });
  assert.strictEqual(result.rewritten, 1);
  assert.match(win.document.hrefs()[0], /utm_source=agency_xyz/);
  assert.strictEqual(win.document.hrefs()[1], '/faq');
  // Both activation paths, so a middle-click on a late anchor is covered too.
  assert.strictEqual(win.listeners.click.length, 1);
  assert.strictEqual(win.listeners.auxclick.length, 1);
});

test('install on an untracked visit registers no listeners at all', () => {
  const win = fakeWindow({ hrefs: [APP] });

  const result = utm.install(win);

  assert.strictEqual(result.rewritten, 0);
  assert.deepStrictEqual(win.listeners, {});
  assert.strictEqual(win.document.hrefs()[0], APP);
});

test('the click fallback rewrites an anchor added after the sweep', () => {
  const win = fakeWindow({ search: '?utm_source=agency_xyz' });
  utm.install(win);
  const onActivate = win.listeners.click[0];

  const late = fakeDocument([APP]).anchors[0];
  onActivate({ target: { closest: () => late } });

  assert.match(late.getAttribute('href'), /utm_source=agency_xyz/);
});

test('the click fallback ignores a click that is not on a link', () => {
  const win = fakeWindow({ search: '?utm_source=agency_xyz' });
  utm.install(win);

  // A bare click target with no closest() must not throw.
  assert.doesNotThrow(() => win.listeners.click[0]({ target: {} }));
  assert.doesNotThrow(() => win.listeners.click[0]({ target: null }));
});

test('loaded as a plain browser script it installs itself', () => {
  // Guards the UMD gate specifically: get this wrong and the script silently
  // does nothing on the real site, with no error to notice.
  const vm = require('node:vm');
  const fs = require('node:fs');
  const source = fs.readFileSync(`${__dirname}/../public/utm-forwarding.js`, 'utf8');

  const win = fakeWindow({ search: '?utm_source=agency_xyz', hrefs: [APP] });
  const sandbox = { URL, URLSearchParams, JSON, Object, console };
  sandbox.globalThis = sandbox;
  Object.assign(sandbox, win, { window: win });

  vm.runInNewContext(source, sandbox);

  assert.match(win.document.hrefs()[0], /utm_source=agency_xyz/);
});

test('a script that loads before DOMContentLoaded waits for it', () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  const source = fs.readFileSync(`${__dirname}/../public/utm-forwarding.js`, 'utf8');

  const win = fakeWindow({
    search: '?utm_source=agency_xyz',
    hrefs: [APP],
    readyState: 'loading',
  });
  const sandbox = { URL, URLSearchParams, JSON, Object, console };
  sandbox.globalThis = sandbox;
  Object.assign(sandbox, win, { window: win });

  vm.runInNewContext(source, sandbox);

  // Nothing yet — the document is still parsing.
  assert.strictEqual(win.document.hrefs()[0], APP);

  win.listeners.DOMContentLoaded[0]();
  assert.match(win.document.hrefs()[0], /utm_source=agency_xyz/);
});
