#!/usr/bin/env node
// Driver for interview-tracker: launches dev server (if needed), logs in as the
// seeded admin, and screenshots/inspects routes. Uses playwright-core driving
// the system Chrome — no extra browser download. Installs playwright-core on
// first use into ./drv-node_modules/ alongside this file.
//
// Commands:
//   smoke                 Hit /, /login, /dashboard and screenshot each. Default.
//   ss <route> [--out f]  Screenshot a single route (logs in first).
//   open <route>          Print HTTP status + final URL for a route (curl-style).
//   eval '<js>' [--route /path]
//                         Evaluate JS in a page (logged in) and print the result.
//   setup                 Just install playwright-core. Idempotent.
//
// Env overrides:
//   APP_URL      default http://localhost:3000
//   LOGIN_EMAIL  default admin@company.com   (from prisma/seed.ts)
//   LOGIN_PASS   default password123          (from prisma/seed.ts)
//   SHOTS_DIR    default <skill-dir>/shots
//   CHROME       path to a Chrome binary; default = system "chrome" channel

import { spawnSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DRV_NM = resolve(HERE, 'drv-node_modules');
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const EMAIL = process.env.LOGIN_EMAIL || 'admin@company.com';
const PASS = process.env.LOGIN_PASS || 'password123';
const SHOTS = process.env.SHOTS_DIR || resolve(HERE, 'shots');

const PW_DIR = resolve(DRV_NM, 'node_modules', 'playwright-core');

function ensurePlaywright() {
  if (existsSync(resolve(PW_DIR, 'package.json'))) return;
  mkdirSync(DRV_NM, { recursive: true });
  console.error('[driver] installing playwright-core into', DRV_NM);
  const r = spawnSync(
    'npm',
    ['i', '--prefix', DRV_NM, '--no-audit', '--no-fund', '--silent', 'playwright-core@1.60.0'],
    { stdio: 'inherit' }
  );
  if (r.status !== 0) throw new Error('playwright-core install failed');
}

async function loadPw() {
  ensurePlaywright();
  const mod = await import(resolve(PW_DIR, 'index.js'));
  return (mod.default && mod.default.chromium) || mod.chromium;
}

async function waitForApp(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(APP_URL + '/login', { redirect: 'manual' });
      if (r.status < 500) return;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`app at ${APP_URL} did not respond within ${timeoutMs}ms`);
}

async function newBrowser() {
  const chromium = await loadPw();
  const opts = { channel: 'chrome' };
  if (process.env.CHROME) { delete opts.channel; opts.executablePath = process.env.CHROME; }
  const browser = await chromium.launch(opts);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  return { browser, ctx };
}

async function login(page) {
  await page.goto(APP_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASS);
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 60_000 }),
    page.click('button[type=submit]:has-text("Sign in")'),
  ]);
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
}

async function cmdSmoke() {
  await waitForApp();
  mkdirSync(SHOTS, { recursive: true });
  const { browser, ctx } = await newBrowser();
  try {
    const p1 = await ctx.newPage();
    await p1.goto(APP_URL + '/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await p1.screenshot({ path: resolve(SHOTS, 'landing.png') });
    console.log('shot:', resolve(SHOTS, 'landing.png'));

    const p2 = await ctx.newPage();
    await p2.goto(APP_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await p2.screenshot({ path: resolve(SHOTS, 'login.png') });
    console.log('shot:', resolve(SHOTS, 'login.png'));

    const p3 = await ctx.newPage();
    await login(p3);
    await p3.screenshot({ path: resolve(SHOTS, 'dashboard.png') });
    console.log('shot:', resolve(SHOTS, 'dashboard.png'), '(url:', p3.url() + ')');
  } finally {
    await browser.close();
  }
}

async function cmdSs(args) {
  const i = args.indexOf('--out');
  const out = i >= 0 ? args[i + 1] : null;
  const route = args.find(a => !a.startsWith('--') && a !== out) || '/dashboard';
  if (!route) throw new Error('usage: ss <route> [--out file]');
  await waitForApp();
  mkdirSync(SHOTS, { recursive: true });
  const safe = route.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'root';
  const outPath = out || resolve(SHOTS, `${safe}.png`);
  const { browser, ctx } = await newBrowser();
  try {
    const page = await ctx.newPage();
    const needsAuth = !['/', '/login', '/register'].includes(route);
    if (needsAuth) await login(page);
    await page.goto(APP_URL + route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.screenshot({ path: outPath });
    console.log('shot:', outPath, '(url:', page.url() + ')');
  } finally {
    await browser.close();
  }
}

async function cmdOpen(args) {
  const route = args[0] || '/';
  await waitForApp();
  const r = await fetch(APP_URL + route, { redirect: 'manual' });
  const loc = r.headers.get('location') || '';
  console.log(`${r.status} ${APP_URL}${route}${loc ? ' -> ' + loc : ''}`);
}

async function cmdEval(args) {
  const expr = args[0];
  if (!expr) throw new Error('usage: eval "<js>" [--route /path]');
  const i = args.indexOf('--route');
  const route = i >= 0 ? args[i + 1] : '/dashboard';
  await waitForApp();
  const { browser, ctx } = await newBrowser();
  try {
    const page = await ctx.newPage();
    const needsAuth = !['/', '/login', '/register'].includes(route);
    if (needsAuth) await login(page);
    await page.goto(APP_URL + route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const v = await page.evaluate(`(async () => { return (${expr}); })()`);
    console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
  } finally {
    await browser.close();
  }
}

const [, , cmd = 'smoke', ...rest] = process.argv;
const dispatch = {
  smoke: () => cmdSmoke(),
  ss: () => cmdSs(rest),
  open: () => cmdOpen(rest),
  eval: () => cmdEval(rest),
  setup: async () => { ensurePlaywright(); console.log('playwright-core ready in', DRV_NM); },
};
const fn = dispatch[cmd];
if (!fn) { console.error('unknown command:', cmd); process.exit(2); }
fn().catch(e => { console.error('FAIL:', e.message || e); process.exit(1); });
