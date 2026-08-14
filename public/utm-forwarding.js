// marketing/utm-forwarding.js
//
// Channel attribution handoff: marketing site → app (FD-700 Story 4).
//
// A partner shares a tracked link to the marketing site (tryflynt.ai/pricing
// ?utm_source=agency_xyz&utm_medium=partner). The visitor browses, then clicks
// "Try for Free" / "Get Started" — a plain <a> pointing at the app. Without
// this script the app is reached with a bare URL and the sign-up is recorded as
// Direct: the channel is lost at the handoff, because local storage is
// per-origin and the marketing site and the app are different origins.
//
// This script carries the parameters across by rewriting app-bound links. The
// app's own capture (acquisition_attribution_service.dart) takes over from
// there — it reads them off the landing URL, stores first touch, and strips
// them from the address bar.
//
// ⚠️ This file is NOT deployed by this repository. It is a handover artifact
// for the Astro marketing site, which lives elsewhere. See README.md.
//
// Deliberate choices:
//
// - **Allowlisted destinations.** Only hosts in APP_HOSTS are ever rewritten. A
//   looser rule (any external link, or anything matching /flynt/) would append
//   partner codes to the Calendly and YouTube links on the page, leaking a
//   partner's identifier to third parties.
// - **First touch per session.** The first tracked landing wins. A later
//   untracked page view must not wipe the channel, and a second tracked link in
//   the same session must not re-attribute — the app applies the same rule, so
//   disagreeing here would just produce a value the app then ignores.
// - **Every app-bound link, not just sign-up buttons.** Classifying buttons by
//   their label is brittle and gains nothing: forwarding on "Login" is
//   harmless, since the backend only ever writes attribution when an account is
//   created. A visitor who arrives via a partner link and happens to click
//   Login before signing up still attributes correctly.
// - **The marketing URL is left alone.** Only the app strips the parameters
//   from what the visitor sees; site-side analytics may still want them.

(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api; // tests
  } else if (root && root.document) {
    api.autoInstall(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * The only parameters the app reads — mirrors
   * `AcquisitionAttribution.utmParameterNames`. Forwarding anything else would
   * be noise the app discards.
   */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

  /** Hosts a link may be rewritten onto. Nothing else is ever touched. */
  var APP_HOSTS = ['app.tryflynt.ai', 'flynt-test.web.app'];

  var STORAGE_KEY = 'flynt_utm_forward';

  /** Tracking parameters present in a query string, trimmed and non-blank. */
  function readParams(search) {
    var params = new URLSearchParams(search || '');
    var found = {};
    for (var i = 0; i < UTM_KEYS.length; i++) {
      var value = (params.get(UTM_KEYS[i]) || '').trim();
      if (value) found[UTM_KEYS[i]] = value;
    }
    return found;
  }

  function isEmpty(object) {
    for (var key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) return false;
    }
    return true;
  }

  /** True when a resolved URL points at the app. */
  function isAppUrl(url) {
    return APP_HOSTS.indexOf(url.hostname.toLowerCase()) !== -1;
  }

  /**
   * The same href carrying [params], or the href untouched.
   *
   * Untouched when: it is not an app link, there is nothing to forward, or the
   * link already carries every parameter. A parameter already on the link wins —
   * a hand-written CTA is an explicit choice and must not be overwritten — and
   * the link's own unrelated query parameters are preserved either way.
   *
   * Returns the ORIGINAL string when nothing changed, rather than a re-serialised
   * equivalent, so an untracked visit leaves the markup byte-identical.
   */
  function withForwardedParams(href, params, base) {
    if (!href || isEmpty(params)) return href;

    var url;
    try {
      url = new URL(href, base);
    } catch (error) {
      return href; // mailto:, tel:, a malformed href — not ours to touch
    }
    if (!isAppUrl(url)) return href;

    var changed = false;
    for (var i = 0; i < UTM_KEYS.length; i++) {
      var key = UTM_KEYS[i];
      if (params[key] && !url.searchParams.has(key)) {
        url.searchParams.set(key, params[key]);
        changed = true;
      }
    }
    return changed ? url.toString() : href;
  }

  /** sessionStorage, or null when the browser denies it (private mode, etc). */
  function safeStorage(win) {
    try {
      var storage = win.sessionStorage;
      storage.getItem(STORAGE_KEY);
      return storage;
    } catch (error) {
      // Storage blocked. Forwarding still works on the landing page itself; it
      // just cannot survive navigation to another marketing page.
      return null;
    }
  }

  function recall(storage) {
    if (!storage) return {};
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      // Re-filter on read: a hand-edited entry must not smuggle in keys the app
      // does not read.
      var clean = {};
      for (var i = 0; i < UTM_KEYS.length; i++) {
        var value = parsed[UTM_KEYS[i]];
        if (typeof value === 'string' && value.trim()) {
          clean[UTM_KEYS[i]] = value.trim();
        }
      }
      return clean;
    } catch (error) {
      return {};
    }
  }

  function remember(storage, params) {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(params));
    } catch (error) {
      // Quota or a denied write — forwarding degrades to this page only.
    }
  }

  /**
   * What to forward on this page view: whatever was first seen this session,
   * otherwise whatever this URL carries (which is then remembered).
   */
  function resolveParams(search, storage) {
    var stored = recall(storage);
    if (!isEmpty(stored)) return stored;

    var incoming = readParams(search);
    if (!isEmpty(incoming)) remember(storage, incoming);
    return incoming;
  }

  /** Rewrites every app-bound anchor currently in the document. */
  function rewriteAll(doc, params, base) {
    var anchors = doc.querySelectorAll('a[href]');
    var rewritten = 0;
    for (var i = 0; i < anchors.length; i++) {
      var current = anchors[i].getAttribute('href');
      var next = withForwardedParams(current, params, base);
      if (next !== current) {
        anchors[i].setAttribute('href', next);
        rewritten++;
      }
    }
    return rewritten;
  }

  /**
   * Rewrites the links and keeps doing so for anchors added later.
   *
   * The sweep covers the ordinary case and also means a middle-clicked or
   * copied link carries the channel. The capture-phase listener is the safety
   * net for anchors injected after this ran — cheaper and less fragile than
   * observing the whole DOM for mutations.
   */
  function install(win) {
    var doc = win.document;
    var params = resolveParams(win.location.search, safeStorage(win));
    if (isEmpty(params)) return { forwarded: {}, rewritten: 0 }; // untracked visit

    var rewritten = rewriteAll(doc, params, win.location.href);

    var onActivate = function (event) {
      var target = event.target;
      var anchor = target && target.closest ? target.closest('a[href]') : null;
      if (!anchor) return;
      var current = anchor.getAttribute('href');
      var next = withForwardedParams(current, params, win.location.href);
      if (next !== current) anchor.setAttribute('href', next);
    };
    doc.addEventListener('click', onActivate, true);
    doc.addEventListener('auxclick', onActivate, true);

    return { forwarded: params, rewritten: rewritten };
  }

  function autoInstall(win) {
    var doc = win.document;
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', function () {
        install(win);
      });
    } else {
      install(win);
    }
  }

  return {
    UTM_KEYS: UTM_KEYS,
    APP_HOSTS: APP_HOSTS,
    STORAGE_KEY: STORAGE_KEY,
    readParams: readParams,
    isAppUrl: isAppUrl,
    withForwardedParams: withForwardedParams,
    resolveParams: resolveParams,
    rewriteAll: rewriteAll,
    install: install,
    autoInstall: autoInstall,
  };
});
