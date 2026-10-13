'use strict';
/**
 * Microsoft hesabı ile giriş (device code akışı)
 * Microsoft -> Xbox Live -> XSTS -> Minecraft Services
 *
 * Gerekli: kullanıcının kendi Azure uygulama (client) kimliği.
 * Yenileme belirteci Electron safeStorage ile şifrelenerek saklanır.
 */
const { safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');

const TENANT = 'https://login.microsoftonline.com/consumers/oauth2/v2.0';
const SCOPE = 'XboxLive.signin offline_access';
const UA = 'ZeroLauncher/1.1';

let FILE = '';
let acct = null; // { name, uuid, refresh }
let pending = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function init(base) {
  FILE = path.join(base, 'account.json');
  try {
    const j = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    let refresh = null;
    if (j.refresh && safeStorage.isEncryptionAvailable()) {
      try { refresh = safeStorage.decryptString(Buffer.from(j.refresh, 'base64')); } catch {}
    }
    acct = { name: j.name, uuid: j.uuid, refresh };
  } catch { acct = null; }
}

function save() {
  if (!acct) { try { fs.unlinkSync(FILE); } catch {} return; }
  let enc = null;
  if (acct.refresh && safeStorage.isEncryptionAvailable()) {
    enc = safeStorage.encryptString(acct.refresh).toString('base64');
  }
  fs.writeFileSync(FILE, JSON.stringify({ name: acct.name, uuid: acct.uuid, refresh: enc }));
}

async function form(url, obj) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: new URLSearchParams(obj),
    signal: AbortSignal.timeout(20000)
  });
  return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
}

async function jpost(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': UA },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000)
  });
  return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
}

const XERR = {
  2148916233: 'This Microsoft account has no Xbox profile. Sign in once at xbox.com to create one.',
  2148916235: 'Xbox Live is not available in your country or region.',
  2148916236: 'This account needs adult verification on the Xbox site.',
  2148916237: 'This account needs adult verification on the Xbox site.',
  2148916238: 'This is a child account. Add it to a Microsoft family group to play.'
};

async function xboxChain(msToken) {
  const xbl = await jpost('https://user.auth.xboxlive.com/user/authenticate', {
    Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: 'd=' + msToken },
    RelyingParty: 'http://auth.xboxlive.com',
    TokenType: 'JWT'
  });
  if (!xbl.ok) throw new Error(`Xbox Live authentication failed (${xbl.status})`);

  const xsts = await jpost('https://xsts.auth.xboxlive.com/xsts/authorize', {
    Properties: { SandboxId: 'RETAIL', UserTokens: [xbl.j.Token] },
    RelyingParty: 'rp://api.minecraftservices.com/',
    TokenType: 'JWT'
  });
  if (!xsts.ok) throw new Error(XERR[xsts.j.XErr] || `XSTS authorization failed (${xsts.status})`);

  const uhs = xsts.j.DisplayClaims.xui[0].uhs;
  const mc = await jpost('https://api.minecraftservices.com/authentication/login_with_xbox', {
    identityToken: `XBL3.0 x=${uhs};${xsts.j.Token}`
  });
  if (!mc.ok) {
    throw new Error(
      `Minecraft login failed (${mc.status}). If it mentions an invalid app registration, your Azure app is not approved for the Minecraft API yet.`
    );
  }
  return mc.j.access_token;
}

async function profile(mcToken) {
  const r = await fetch('https://api.minecraftservices.com/minecraft/profile', {
    headers: { Authorization: 'Bearer ' + mcToken, 'User-Agent': UA },
    signal: AbortSignal.timeout(20000)
  });
  if (r.status === 404) { const e = new Error('NO_GAME'); e.code = 'NO_GAME'; throw e; }
  if (!r.ok) throw new Error(`Profile request failed (${r.status})`);
  return r.json(); // { id, name, ... }
}

async function login(clientId, onCode) {
  if (!clientId) { const e = new Error('NO_CLIENT_ID'); e.code = 'NO_CLIENT_ID'; throw e; }
  pending = { cancel: false };
  const my = pending;

  const dc = await form(TENANT + '/devicecode', { client_id: clientId, scope: SCOPE });
  if (!dc.ok) throw new Error(dc.j.error_description || 'Device code request failed');
  let interval = (dc.j.interval || 5) * 1000;
  onCode({ userCode: dc.j.user_code, uri: dc.j.verification_uri });

  const deadline = Date.now() + (dc.j.expires_in || 900) * 1000;
  while (Date.now() < deadline) {
    await sleep(interval);
    if (my.cancel) { const e = new Error('CANCELLED'); e.code = 'CANCELLED'; throw e; }
    const t = await form(TENANT + '/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: clientId,
      device_code: dc.j.device_code
    });
    if (t.ok) {
      const mcToken = await xboxChain(t.j.access_token);
      const p = await profile(mcToken);
      acct = { name: p.name, uuid: p.id, refresh: t.j.refresh_token };
      save();
      return { name: p.name, uuid: p.id };
    }
    const err = t.j.error;
    if (err === 'authorization_pending') continue;
    if (err === 'slow_down') { interval += 5000; continue; }
    throw new Error(t.j.error_description || err || 'Sign-in failed');
  }
  throw new Error('The sign-in code expired.');
}

function cancel() { if (pending) pending.cancel = true; }

// Oyunu başlatmadan önce oturumu yeniler, taze Minecraft belirteci döndürür
async function refresh(clientId) {
  if (!acct || !acct.refresh) { const e = new Error('Not signed in.'); e.code = 'NO_SESSION'; throw e; }
  const t = await form(TENANT + '/token', {
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: acct.refresh,
    scope: SCOPE
  });
  if (!t.ok) {
    const e = new Error(t.j.error_description || 'Could not refresh the Microsoft session. Please sign in again.');
    e.code = 'AUTH';
    throw e;
  }
  const mcToken = await xboxChain(t.j.access_token);
  const p = await profile(mcToken);
  acct = { name: p.name, uuid: p.id, refresh: t.j.refresh_token || acct.refresh };
  save();
  return { name: p.name, uuid: p.id, accessToken: mcToken };
}

function status() {
  return { loggedIn: !!acct, name: acct ? acct.name : null, uuid: acct ? acct.uuid : null, canRefresh: !!(acct && acct.refresh) };
}

function logout() { acct = null; save(); }

// Ağ hatası mı (internet yok) yoksa gerçek bir kimlik doğrulama hatası mı?
function isNetworkError(e) {
  return e && (e.name === 'TypeError' || e.name === 'TimeoutError' || e.name === 'AbortError' || /fetch failed|ENOTFOUND|ECONN|EAI_AGAIN/i.test(String(e.message)));
}

module.exports = { init, login, cancel, refresh, status, logout, isNetworkError };
