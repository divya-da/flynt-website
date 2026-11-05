// src/lib/playbook.js
//
// FD-1110 — the free BD Playbook giveaway. The website promotes it and sends
// the visitor to the app's sign-up page; nothing downloads here. The app
// recognises the link by this exact tag (`utm_campaign=free_resource`, the
// ticket's wording), shows the playbook through sign-up and onboarding, and
// offers the PDF before the plan picker.
//
// ⚠️ Only the campaign tag, no `utm_source`: the sign-up stays Direct for
// attribution and keeps the campaign, so the admin's Campaign filter reports
// the giveaway without changing partner attribution. A partner's own tags on
// the visitor's landing URL are still forwarded by utm-forwarding.js — a tag
// already on the link wins, so this one is never overwritten.

export const PLAYBOOK_CAMPAIGN = 'free_resource';

export const PLAYBOOK_SIGNUP_URL =
  `https://app.tryflynt.ai/signup?utm_campaign=${PLAYBOOK_CAMPAIGN}`;

export const PLAYBOOK_TITLE = 'The Business Development Tree';

export const PLAYBOOK_ONE_LINER =
  'You need eleven clients, not a thousand leads. Get the numbers behind that, ' +
  'the four ways to find them, and real data on what actually gets a reply.';

export const PLAYBOOK_COVER_TAGLINE =
  'Eleven clients, four triggers, two channels — and the data on what gets a reply.';
