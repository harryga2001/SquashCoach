import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SB_URL = "https://ntninbfowpvoyifstbqx.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bmluYmZvd3B2b3lpZnN0YnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTY1NTUsImV4cCI6MjA5NjQ5MjU1NX0.ZCTjtzBBTtFp46uDr320R-hq2fQBRl5MUwC5m4LaCpA";

// Auth API
async function authSignIn(email, password) {
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.message || "Invalid email or password.");
  return d; // { access_token, user }
}

async function authSignUp(email, password) {
  const r = await fetch(`${SB_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.message || "Signup failed.");
  return d;
}

async function authSignOut(token) {
  await fetch(`${SB_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${token}` },
  });
}

async function authResetPassword(email) {
  await fetch(`${SB_URL}/auth/v1/recover`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

async function authInviteUser(email, token) {
  const r = await fetch(`${SB_URL}/auth/v1/invite`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.message || "Invite failed.");
  return d;
}

// DB API — uses anon key (RLS disabled)
const DB = `${SB_URL}/rest/v1`;
const AH = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function dbGet(table, query = "") {
  const r = await fetch(`${DB}/${table}?${query}`, { headers: AH });
  if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.status); }
  return r.json();
}
async function dbInsert(table, body) {
  const r = await fetch(`${DB}/${table}`, { method: "POST", headers: { ...AH, "Prefer": "return=representation" }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.status); }
  const d = await r.json(); return Array.isArray(d) ? d[0] : d;
}
async function dbUpdate(table, query, body) {
  const r = await fetch(`${DB}/${table}?${query}`, { method: "PATCH", headers: { ...AH, "Prefer": "return=representation" }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.status); }
  return r.json();
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "harry.g.a2001@gmail.com";

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0c; --surf: #111116; --surf2: #17171e; --border: #21212a;
    --acc: #d4f000; --acc-dim: rgba(212,240,0,0.1); --acc-dim2: rgba(212,240,0,0.05);
    --text: #efefef; --muted: #72728a; --dim: #42424e;
    --squash: #d4f000; --gym: #00c8ff; --rest: #44444f;
    --red: #ff4455; --red-dim: rgba(255,68,85,0.1);
    --green: #00e89a; --green-dim: rgba(0,232,154,0.1);
    --amber: #ffaa00; --amber-dim: rgba(255,170,0,0.1);
    --r: 6px; --rl: 12px;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Barlow', sans-serif; font-size: 15px; line-height: 1.5; -webkit-font-smoothing: antialiased; min-height: 100vh; }

  .auth { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; }
  .auth::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 70% 20%, rgba(212,240,0,0.04) 0%, transparent 70%); pointer-events: none; }
  .auth-box { width: 100%; max-width: 380px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 44px 36px; position: relative; z-index: 1; }
  .auth-logo { font-family: 'Barlow Condensed', sans-serif; font-size: 30px; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; color: var(--acc); margin-bottom: 4px; }
  .auth-tagline { font-size: 12px; color: var(--muted); margin-bottom: 32px; letter-spacing: 0.04em; }
  .auth-tabs { display: flex; background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 3px; gap: 3px; margin-bottom: 28px; }
  .auth-tab { flex: 1; padding: 8px; border: none; background: none; border-radius: 4px; font-family: 'Barlow', sans-serif; font-size: 13px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.15s; }
  .auth-tab.on { background: var(--acc); color: #0a0a0c; font-weight: 700; }
  .fld { margin-bottom: 16px; }
  .lbl { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 7px; }
  .inp { width: 100%; background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 11px 13px; color: var(--text); font-family: 'Barlow', sans-serif; font-size: 14px; outline: none; transition: border-color 0.15s; }
  .inp:focus { border-color: var(--acc); }
  .inp::placeholder { color: var(--dim); }
  .ta { resize: vertical; min-height: 75px; line-height: 1.5; }
  .btn-acc { width: 100%; background: var(--acc); color: #0a0a0c; border: none; border-radius: var(--r); padding: 12px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; margin-top: 4px; }
  .btn-acc:hover { opacity: 0.88; }
  .btn-acc:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost { width: 100%; background: none; border: 1px solid var(--border); border-radius: var(--r); padding: 11px; font-family: 'Barlow', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.15s; margin-top: 8px; }
  .btn-ghost:hover { border-color: var(--muted); color: var(--text); }
  .msg-err { background: var(--red-dim); border: 1px solid rgba(255,68,85,0.25); border-radius: var(--r); padding: 10px 13px; font-size: 13px; color: #ff7788; margin-bottom: 16px; }
  .msg-ok { background: var(--green-dim); border: 1px solid rgba(0,232,154,0.25); border-radius: var(--r); padding: 10px 13px; font-size: 13px; color: var(--green); margin-bottom: 16px; line-height: 1.6; }

  .nav { background: var(--surf); border-bottom: 1px solid var(--border); height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; position: sticky; top: 0; z-index: 100; }
  .nav-logo { font-family: 'Barlow Condensed', sans-serif; font-size: 19px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: var(--acc); }
  .nav-logo em { color: var(--muted); font-style: normal; font-weight: 400; font-size: 15px; margin-left: 6px; }
  .nav-r { display: flex; align-items: center; gap: 16px; }
  .nav-name { font-size: 13px; color: var(--muted); }
  .nav-name b { color: var(--text); }
  .pill { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 8px; border-radius: 20px; margin-left: 6px; }
  .pill-admin { background: var(--amber-dim); color: var(--amber); border: 1px solid rgba(255,170,0,0.2); }
  .pill-coach { background: var(--acc-dim); color: var(--acc); border: 1px solid rgba(212,240,0,0.2); }
  .nav-out { background: none; border: 1px solid var(--border); border-radius: var(--r); padding: 5px 13px; color: var(--muted); font-family: 'Barlow', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; }
  .nav-out:hover { border-color: var(--muted); color: var(--text); }

  .wrap { max-width: 1080px; margin: 0 auto; padding: 32px 28px; }
  .pg-title { font-family: 'Barlow Condensed', sans-serif; font-size: 30px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 4px; }
  .pg-sub { font-size: 13px; color: var(--muted); margin-bottom: 28px; }
  .sec-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }

  .stats { display: grid; gap: 14px; margin-bottom: 32px; }
  .stats-3 { grid-template-columns: repeat(3,1fr); }
  .stats-4 { grid-template-columns: repeat(4,1fr); }
  .stat { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 22px; }
  .stat-n { font-family: 'Barlow Condensed', sans-serif; font-size: 40px; font-weight: 900; color: var(--acc); line-height: 1; }
  .stat-n.amber { color: var(--amber); }
  .stat-l { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 5px; }

  .tabs { display: flex; gap: 3px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--r); padding: 3px; width: fit-content; margin-bottom: 24px; }
  .t { background: none; border: none; padding: 7px 16px; border-radius: 4px; font-family: 'Barlow', sans-serif; font-size: 13px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.15s; }
  .t.on { background: var(--acc); color: #0a0a0c; font-weight: 700; }

  .grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 14px; }
  .card { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 22px; }
  .card.click { cursor: pointer; transition: border-color 0.15s, transform 0.12s; }
  .card.click:hover { border-color: rgba(212,240,0,0.35); transform: translateY(-1px); }
  .card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
  .card-name { font-family: 'Barlow Condensed', sans-serif; font-size: 19px; font-weight: 800; }
  .card-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .card-body { font-size: 13px; color: var(--muted); line-height: 1.55; margin-bottom: 14px; }
  .card-foot { display: flex; align-items: center; justify-content: space-between; }
  .card-meta { font-size: 11px; color: var(--dim); }

  .badge { font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
  .b-acc { background: var(--acc-dim); color: var(--acc); border: 1px solid rgba(212,240,0,0.2); }
  .b-green { background: var(--green-dim); color: var(--green); border: 1px solid rgba(0,232,154,0.2); }
  .b-amber { background: var(--amber-dim); color: var(--amber); border: 1px solid rgba(255,170,0,0.2); }
  .b-red { background: var(--red-dim); color: var(--red); border: 1px solid rgba(255,68,85,0.2); }
  .b-dim { background: var(--surf2); color: var(--dim); border: 1px solid var(--border); }

  .back { background: none; border: none; color: var(--muted); font-family: 'Barlow', sans-serif; font-size: 13px; cursor: pointer; padding: 0; margin-bottom: 24px; display: flex; align-items: center; gap: 7px; transition: color 0.15s; }
  .back:hover { color: var(--text); }

  .cl-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
  .cl-name { font-family: 'Barlow Condensed', sans-serif; font-size: 38px; font-weight: 900; letter-spacing: 0.03em; text-transform: uppercase; line-height: 1; }
  .cl-sub { font-size: 13px; color: var(--muted); margin-top: 5px; }

  .prog-head { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 22px 26px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
  .prog-fl { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .prog-focus { font-family: 'Barlow Condensed', sans-serif; font-size: 21px; font-weight: 800; }
  .prog-wk { font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; color: var(--acc); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; text-align: right; }
  .btn-edit { background: var(--acc-dim); border: 1px solid rgba(212,240,0,0.2); border-radius: var(--r); padding: 7px 14px; color: var(--acc); font-family: 'Barlow', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; letter-spacing: 0.06em; text-transform: uppercase; transition: all 0.15s; }
  .btn-edit:hover { background: rgba(212,240,0,0.18); }
  .days { display: flex; flex-direction: column; gap: 7px; }
  .day { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); overflow: hidden; }
  .day-h { display: flex; align-items: center; gap: 14px; padding: 14px 18px; cursor: pointer; transition: background 0.15s; }
  .day-h:hover { background: var(--surf2); }
  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .dot-Squash { background: var(--squash); } .dot-Squash-Conditioning { background: var(--gym); } .dot-Rest { background: var(--rest); }
  .day-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); width: 84px; flex-shrink: 0; }
  .day-title { font-size: 14px; font-weight: 500; flex: 1; }
  .type-pill { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 9px; border-radius: 20px; }
  .tp-Squash { background: rgba(212,240,0,0.1); color: var(--squash); }
  .tp-Squash-Conditioning { background: rgba(0,200,255,0.1); color: var(--gym); }
  .tp-Rest { background: rgba(68,68,79,0.3); color: var(--dim); }
  .chevron { color: var(--dim); font-size: 11px; margin-left: 8px; }
  .day-body { padding: 12px 18px 16px 18px; font-size: 13px; color: var(--muted); line-height: 1.7; border-top: 1px solid var(--border); }

  .editor { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 26px; }
  .editor-title { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 22px; }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .e-lbl { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 7px; }
  .e-inp { width: 100%; background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 9px 12px; color: var(--text); font-family: 'Barlow', sans-serif; font-size: 13px; outline: none; transition: border-color 0.15s; }
  .e-inp:focus { border-color: var(--acc); }
  .e-sel { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2372728a' stroke-width='1.5' fill='none'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; }
  .e-ta { width: 100%; background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 9px 12px; color: var(--text); font-family: 'Barlow', sans-serif; font-size: 13px; outline: none; resize: vertical; min-height: 75px; line-height: 1.6; transition: border-color 0.15s; grid-column: 1/-1; }
  .e-ta:focus { border-color: var(--acc); }
  .day-ed { background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; margin-bottom: 10px; }
  .day-ed-name { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--acc); margin-bottom: 12px; }
  .ed-actions { display: flex; gap: 10px; margin-top: 20px; }
  .btn-save { background: var(--acc); color: #0a0a0c; border: none; border-radius: var(--r); padding: 10px 22px; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; }
  .btn-save:hover { opacity: 0.88; }
  .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-cancel { background: none; border: 1px solid var(--border); border-radius: var(--r); padding: 10px 22px; color: var(--muted); font-family: 'Barlow', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.15s; }
  .btn-cancel:hover { border-color: var(--muted); color: var(--text); }

  .ck-list { display: flex; flex-direction: column; gap: 14px; }
  .ck { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 22px; }
  .ck-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .ck-wk { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
  .ck-date { font-size: 11px; color: var(--dim); margin-top: 2px; }
  .ck-rating { font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 900; color: var(--acc); text-align: right; line-height: 1; }
  .ck-rl { font-size: 9px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
  .ck-field { margin-bottom: 12px; }
  .ck-fl { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; }
  .ck-val { font-size: 13px; color: var(--text); line-height: 1.5; }
  .resp-box { background: var(--acc-dim2); border: 1px solid rgba(212,240,0,0.1); border-radius: var(--r); padding: 14px; margin-top: 14px; }
  .resp-lbl { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--acc); margin-bottom: 7px; }
  .resp-txt { font-size: 13px; color: var(--text); line-height: 1.65; }
  .no-resp { font-size: 12px; color: var(--dim); font-style: italic; margin-top: 10px; }
  .resp-form { margin-top: 14px; }
  .resp-ta { width: 100%; background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 11px 13px; color: var(--text); font-family: 'Barlow', sans-serif; font-size: 13px; line-height: 1.6; outline: none; resize: vertical; min-height: 90px; transition: border-color 0.15s; }
  .resp-ta:focus { border-color: var(--acc); }
  .resp-ta::placeholder { color: var(--dim); }
  .btn-send { margin-top: 8px; background: var(--acc); color: #0a0a0c; border: none; border-radius: var(--r); padding: 9px 18px; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; }
  .btn-send:hover { opacity: 0.88; }
  .btn-send:disabled { opacity: 0.4; cursor: not-allowed; }

  .hero { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 30px; margin-bottom: 22px; display: flex; align-items: center; justify-content: space-between; }
  .hero-greet { font-family: 'Barlow Condensed', sans-serif; font-size: 34px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; line-height: 1.1; }
  .hero-greet span { color: var(--acc); }
  .hero-goal { font-size: 13px; color: var(--muted); margin-top: 7px; max-width: 300px; line-height: 1.5; }
  .hero-wk { text-align: right; }
  .hero-wk-n { font-family: 'Barlow Condensed', sans-serif; font-size: 56px; font-weight: 900; color: var(--acc); line-height: 1; }
  .hero-wk-l { font-size: 10px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }
  .two-col { display: grid; grid-template-columns: 1fr 360px; gap: 18px; align-items: start; }
  .ck-form-card { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 22px; }
  .ck-form-title { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 18px; }
  .rating-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; }
  .r-btn { background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.12s; color: var(--muted); }
  .r-btn.on { background: var(--acc); border-color: var(--acc); color: #0a0a0c; }
  .r-btn:hover:not(.on) { border-color: var(--muted); color: var(--text); }

  .c-actions { display: flex; gap: 7px; margin-top: 14px; }
  .btn-approve { flex: 1; background: var(--green-dim); border: 1px solid rgba(0,232,154,0.2); border-radius: var(--r); padding: 8px; color: var(--green); font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
  .btn-approve:hover { background: rgba(0,232,154,0.18); }
  .btn-reject { flex: 1; background: var(--red-dim); border: 1px solid rgba(255,68,85,0.2); border-radius: var(--r); padding: 8px; color: var(--red); font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
  .btn-reject:hover { background: rgba(255,68,85,0.18); }
  .btn-revoke { background: none; border: 1px solid var(--border); border-radius: var(--r); padding: 6px 12px; color: var(--dim); font-family: 'Barlow', sans-serif; font-size: 11px; cursor: pointer; transition: all 0.15s; }
  .btn-revoke:hover { border-color: var(--red); color: var(--red); }

  .tbl-wrap { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); overflow: hidden; margin-bottom: 28px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); padding: 9px 14px; border-bottom: 1px solid var(--border); }
  td { padding: 13px 14px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surf2); }

  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
  .modal { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 32px; width: 100%; max-width: 420px; }
  .modal-title { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 20px; }

  .empty { text-align: center; padding: 44px 20px; color: var(--dim); font-size: 13px; }
  .empty-icon { font-size: 30px; margin-bottom: 10px; }
  .no-prog { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 36px; text-align: center; }
  .no-prog-t { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 6px; }
  .no-prog-s { font-size: 13px; color: var(--muted); }
  .flash-ok { background: var(--green-dim); border: 1px solid rgba(0,232,154,0.2); border-radius: var(--r); padding: 9px 13px; font-size: 12px; color: var(--green); margin-bottom: 14px; }
  .flash-err { background: var(--red-dim); border: 1px solid rgba(255,68,85,0.2); border-radius: var(--r); padding: 9px 13px; font-size: 12px; color: var(--red); margin-bottom: 14px; }
  .pending-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .pending-box { max-width: 400px; width: 100%; text-align: center; background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 48px 32px; }
  .pending-icon { font-size: 44px; margin-bottom: 16px; }
  .pending-t { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 10px; }
  .pending-b { font-size: 13px; color: var(--muted); line-height: 1.7; margin-bottom: 24px; }
  .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; }
  .loading-logo { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; color: var(--acc); }
  .spin { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--acc); border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px; vertical-align: middle; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* SCHEDULE */
  .sch-list { display: flex; flex-direction: column; gap: 10px; }
  .sch-item { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
  .sch-type { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .sch-Holiday { background: rgba(212,240,0,0.1); color: var(--acc); border: 1px solid rgba(212,240,0,0.2); }
  .sch-Tournament { background: rgba(0,200,255,0.1); color: var(--gym); border: 1px solid rgba(0,200,255,0.2); }
  .sch-Work { background: rgba(255,170,0,0.1); color: var(--amber); border: 1px solid rgba(255,170,0,0.2); }
  .sch-Injury { background: rgba(255,68,85,0.1); color: var(--red); border: 1px solid rgba(255,68,85,0.2); }
  .sch-Other { background: var(--surf2); color: var(--muted); border: 1px solid var(--border); }
  .sch-dates { font-size: 13px; font-weight: 600; color: var(--text); flex-shrink: 0; }
  .sch-note { font-size: 13px; color: var(--muted); flex: 1; }
  .sch-delete { background: none; border: none; color: var(--dim); font-size: 16px; cursor: pointer; padding: 0 4px; line-height: 1; transition: color 0.15s; flex-shrink: 0; }
  .sch-delete:hover { color: var(--red); }
  .sch-form { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 22px; margin-bottom: 20px; }
  .sch-form-title { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 16px; }
  .sch-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .sch-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }

  @media (max-width: 780px) {
    .two-col { grid-template-columns: 1fr; }
    .stats-3, .stats-4 { grid-template-columns: 1fr 1fr; }
    .row2 { grid-template-columns: 1fr; }
    .wrap { padding: 20px 14px; }
    .nav { padding: 0 14px; }
    .hero-wk-n { font-size: 40px; }
  }
`;

function Spin() { return <span className="spin" />; }

function Loading() {
  return (
    <div className="loading">
      <div className="loading-logo">SquashCoach</div>
      <Spin />
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [f, setF] = useState({ email: "", password: "", name: "", bio: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  const login = async () => {
    if (!f.email || !f.password) { setErr("Please fill in all fields."); return; }
    setBusy(true); setErr("");
    try { await onLogin(f.email.trim().toLowerCase(), f.password); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const signup = async () => {
    if (!f.name || !f.email || !f.password || !f.bio) { setErr("All fields required."); return; }
    if (f.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true); setErr("");
    try {
      const data = await authSignUp(f.email.trim().toLowerCase(), f.password);
      if (data.user?.id) {
        await dbInsert("coaches", { id: data.user.id, name: f.name.trim(), email: f.email.trim().toLowerCase(), bio: f.bio.trim(), status: "pending" });
        setOk("Application submitted! You'll receive an email to confirm your account, then access once approved.");
        setF({ email: "", password: "", name: "", bio: "" });
      } else {
        setOk("Application submitted! Check your email to confirm your account.");
      }
    } catch (e) { setErr(e.message || "Signup failed. That email may already be registered."); }
    setBusy(false);
  };

  const resetPassword = async () => {
    if (!f.email) { setErr("Enter your email address first."); return; }
    setBusy(true); setErr("");
    try {
      await authResetPassword(f.email.trim().toLowerCase());
      setOk("Password reset email sent. Check your inbox.");
      setShowReset(false);
    } catch (e) { setErr("Could not send reset email."); }
    setBusy(false);
  };

  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-logo">SquashCoach</div>
        <div className="auth-tagline">Performance coaching — personalised.</div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "login" ? "on" : ""}`} onClick={() => { setTab("login"); setErr(""); setOk(""); setShowReset(false); }}>Sign In</button>
          <button className={`auth-tab ${tab === "signup" ? "on" : ""}`} onClick={() => { setTab("signup"); setErr(""); setOk(""); setShowReset(false); }}>Apply as Coach</button>
        </div>
        {err && <div className="msg-err">{err}</div>}
        {ok && <div className="msg-ok">{ok}</div>}
        {tab === "login" && !ok && (
          <>
            <div className="fld"><label className="lbl">Email</label><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e => s("email", e.target.value)} onKeyDown={e => e.key === "Enter" && login()} /></div>
            <div className="fld"><label className="lbl">Password</label><input className="inp" type="password" placeholder="••••••••" value={f.password} onChange={e => s("password", e.target.value)} onKeyDown={e => e.key === "Enter" && login()} /></div>
            <button className="btn-acc" onClick={login} disabled={busy}>{busy ? <><Spin />Signing in...</> : "Sign In"}</button>
            {!showReset
              ? <button className="btn-ghost" onClick={() => setShowReset(true)}>Forgot password?</button>
              : <button className="btn-ghost" onClick={resetPassword} disabled={busy}>Send reset email to {f.email || "your email"}</button>
            }
          </>
        )}
        {tab === "signup" && !ok && (
          <>
            <div className="fld"><label className="lbl">Full Name</label><input className="inp" placeholder="Your name" value={f.name} onChange={e => s("name", e.target.value)} /></div>
            <div className="fld"><label className="lbl">Email</label><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e => s("email", e.target.value)} /></div>
            <div className="fld"><label className="lbl">Password</label><input className="inp" type="password" placeholder="Min. 6 characters" value={f.password} onChange={e => s("password", e.target.value)} /></div>
            <div className="fld"><label className="lbl">Coaching Background</label><textarea className="inp ta" placeholder="Level, experience, specialism..." value={f.bio} onChange={e => s("bio", e.target.value)} /></div>
            <button className="btn-acc" onClick={signup} disabled={busy}>{busy ? <><Spin />Submitting...</> : "Submit Application"}</button>
          </>
        )}
      </div>
    </div>
  );
}

function PendingScreen({ onLogout }) {
  return (
    <div className="pending-screen">
      <div className="pending-box">
        <div className="pending-icon">⏳</div>
        <div className="pending-t">Application Pending</div>
        <div className="pending-b">Your application has been received and will be reviewed shortly. If you've been waiting more than 24 hours, reach out directly.</div>
        <button className="nav-out" onClick={onLogout}>Sign out</button>
      </div>
    </div>
  );
}

function Nav({ name, email, role, onLogout, adminMode, onToggleAdmin }) {
  const isAdmin = email === ADMIN_EMAIL && role === "coach";
  return (
    <nav className="nav">
      <div className="nav-logo">SquashCoach<em>/ {isAdmin && adminMode ? "Admin" : role === "coach" ? "Coach" : "My Training"}</em></div>
      <div className="nav-r">
        <div className="nav-name"><b>{name}</b>{isAdmin && adminMode && <span className="pill pill-admin">Admin</span>}{role === "coach" && !adminMode && <span className="pill pill-coach">Coach</span>}</div>
        {isAdmin && <button className="nav-out" onClick={onToggleAdmin}>{adminMode ? "Switch to Coach" : "Switch to Admin"}</button>}
        <button className="nav-out" onClick={onLogout}>Sign out</button>
      </div>
    </nav>
  );
}

// ─── ADD CLIENT MODAL ─────────────────────────────────────────────────────────
function AddClientModal({ coachId, token, onClose, onAdded }) {
  const [f, setF] = useState({ name: "", email: "", level: "", goal: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name || !f.email) { setErr("Name and email are required."); return; }
    setBusy(true); setErr("");
    try {
      // Invite user via Supabase Auth — they get an email to set their password
      const invited = await authInviteUser(f.email.trim().toLowerCase(), token);
      const userId = invited.id;
      // Insert client row
      const client = await dbInsert("clients", { id: userId, coach_id: coachId, name: f.name.trim(), email: f.email.trim().toLowerCase(), level: f.level.trim(), goal: f.goal.trim() });
      onAdded(client);
      onClose();
    } catch (e) { setErr(e.message || "Failed to add client. Email may already be in use."); }
    setBusy(false);
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Add New Client</div>
        {err && <div className="flash-err">{err}</div>}
        <div className="msg-ok" style={{ marginBottom: 16 }}>They'll receive an email invite to set their password and access their programme.</div>
        <div className="fld"><label className="lbl">Full Name</label><input className="inp" placeholder="Client's name" value={f.name} onChange={e => s("name", e.target.value)} /></div>
        <div className="fld"><label className="lbl">Email</label><input className="inp" type="email" placeholder="client@example.com" value={f.email} onChange={e => s("email", e.target.value)} /></div>
        <div className="fld"><label className="lbl">Level</label><input className="inp" placeholder="e.g. Club 1st team, County Junior" value={f.level} onChange={e => s("level", e.target.value)} /></div>
        <div className="fld"><label className="lbl">Goal</label><input className="inp" placeholder="e.g. Improve movement and court coverage" value={f.goal} onChange={e => s("goal", e.target.value)} /></div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn-save" onClick={submit} disabled={busy}>{busy ? <><Spin />Adding...</> : "Add & Send Invite"}</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── DAY CARD ─────────────────────────────────────────────────────────────────
function DayCard({ day }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="day" style={{ borderColor: open ? "rgba(212,240,0,0.25)" : undefined }}>
      <div className="day-h" onClick={() => setOpen(o => !o)}>
        <div className={`dot dot-${day.type.replace(/ /g, "-")}`} />
        <div className="day-lbl">{day.day}</div>
        <div className="day-title">{day.title || <span style={{ color: "var(--dim)" }}>No session set</span>}</div>
        <div className={`type-pill tp-${day.type.replace(/ /g, "-")}`}>{day.type}</div>
        <div className="chevron">{open ? "▲" : "▼"}</div>
      </div>
      {open && <div className="day-body">{day.details || <em>No details added yet.</em>}</div>}
    </div>
  );
}

function ProgView({ prog, isCoach, onEdit }) {
  if (!prog) return (
    <div className="no-prog">
      <div className="no-prog-t">No programme yet</div>
      <div className="no-prog-s">{isCoach ? "Click below to create one." : "Your coach hasn't set your programme yet — check back soon."}</div>
      {isCoach && <button className="btn-edit" style={{ marginTop: 14 }} onClick={onEdit}>Create Programme</button>}
    </div>
  );
  return (
    <div>
      <div className="prog-head">
        <div><div className="prog-fl">Current Block Focus</div><div className="prog-focus">{prog.focus}</div></div>
        <div><div className="prog-wk">{prog.week_label}</div>{isCoach && <button className="btn-edit" onClick={onEdit}>Edit Programme</button>}</div>
      </div>
      <div className="days">{(prog.days || []).map(d => <DayCard key={d.day} day={d} />)}</div>
    </div>
  );
}

const BLANK = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => ({ day, type: "Rest", title: "", details: "" }));

function ProgEditor({ prog, clientId, coachId, onSave, onCancel }) {
  const [d, setD] = useState(prog
    ? { week_label: prog.week_label, focus: prog.focus, days: JSON.parse(JSON.stringify(prog.days)) }
    : { week_label: "Week 1 of 4", focus: "", days: JSON.parse(JSON.stringify(BLANK)) }
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const upDay = (i, k, v) => { const days = [...d.days]; days[i] = { ...days[i], [k]: v }; setD(p => ({ ...p, days })); };

  const save = async () => {
    if (!d.focus) { setErr("Please add a block focus."); return; }
    setBusy(true); setErr("");
    try {
      if (prog?.id) {
        await dbUpdate("programmes", `id=eq.${prog.id}`, { week_label: d.week_label, focus: d.focus, days: d.days, updated_at: new Date().toISOString() });
        onSave({ ...prog, ...d });
      } else {
        await dbUpdate("programmes", `client_id=eq.${clientId}&is_active=eq.true`, { is_active: false });
        const np = await dbInsert("programmes", { client_id: clientId, coach_id: coachId, week_label: d.week_label, focus: d.focus, days: d.days });
        onSave(np);
      }
    } catch (e) { setErr("Save failed. Please try again."); }
    setBusy(false);
  };

  return (
    <div className="editor">
      <div className="editor-title">{prog ? "Edit Programme" : "Create Programme"}</div>
      {err && <div className="flash-err">{err}</div>}
      <div className="row2">
        <div><label className="e-lbl">Week Label</label><input className="e-inp" placeholder="e.g. Week 1 of 4" value={d.week_label} onChange={e => setD(p => ({ ...p, week_label: e.target.value }))} /></div>
        <div><label className="e-lbl">Block Focus</label><input className="e-inp" placeholder="e.g. Court Movement & Conditioning" value={d.focus} onChange={e => setD(p => ({ ...p, focus: e.target.value }))} /></div>
      </div>
      {d.days.map((day, i) => (
        <div className="day-ed" key={day.day}>
          <div className="day-ed-name">{day.day}</div>
          <div className="row2">
            <div><label className="e-lbl">Type</label>
              <select className="e-inp e-sel" value={day.type} onChange={e => upDay(i, "type", e.target.value)}>
                <option>Squash</option><option>Squash Conditioning</option><option>Rest</option>
              </select>
            </div>
            <div><label className="e-lbl">Session Title</label><input className="e-inp" placeholder="e.g. Solo Drilling" value={day.title} onChange={e => upDay(i, "title", e.target.value)} /></div>
            <textarea className="e-ta" placeholder="Session details, sets, reps, notes..." value={day.details} onChange={e => upDay(i, "details", e.target.value)} />
          </div>
        </div>
      ))}
      <div className="ed-actions">
        <button className="btn-save" onClick={save} disabled={busy}>{busy ? <><Spin />Saving...</> : "Save Programme"}</button>
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function CkCard({ ck, isCoach, onRespond }) {
  const [resp, setResp] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await dbUpdate("checkins", `id=eq.${ck.id}`, { coach_response: resp.trim(), responded_at: new Date().toISOString() });
      onRespond(ck.id, resp.trim());
      setDone(true);
    } catch (e) { }
    setBusy(false);
  };

  return (
    <div className="ck">
      <div className="ck-top">
        <div><div className="ck-wk">{ck.week_label} Check-in</div><div className="ck-date">{ck.created_at?.slice(0, 10)}</div></div>
        <div><div className="ck-rating">{ck.session_rating}<span style={{ fontSize: 16, color: "var(--muted)" }}>/10</span></div><div className="ck-rl">Session rating</div></div>
      </div>
      <div className="ck-field"><div className="ck-fl">Hardest part of the week</div><div className="ck-val">{ck.hardest}</div></div>
      <div className="ck-field"><div className="ck-fl">Match / drill results</div><div className="ck-val">{ck.match_result}</div></div>
      {ck.coach_response
        ? <div className="resp-box"><div className="resp-lbl">Coach Response</div><div className="resp-txt">{ck.coach_response}</div></div>
        : isCoach
          ? done ? <div className="flash-ok">Response sent ✓</div> : (
            <div className="resp-form">
              <textarea className="resp-ta" placeholder="Write your response..." value={resp} onChange={e => setResp(e.target.value)} />
              <button className="btn-send" onClick={send} disabled={!resp.trim() || busy}>{busy ? <><Spin />Sending...</> : "Send Response"}</button>
            </div>
          )
          : <div className="no-resp">Awaiting coach response...</div>
      }
    </div>
  );
}

function ClientDetail({ client, coachId, onBack }) {
  const [tab, setTab] = useState("programme");
  const [prog, setProg] = useState(null);
  const [cks, setCks] = useState([]);
  const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const ps = await dbGet("programmes", `client_id=eq.${client.id}&is_active=eq.true&limit=1`);
        setProg(ps?.[0] || null);
        const cs = await dbGet("checkins", `client_id=eq.${client.id}&order=created_at.desc`);
        setCks(cs || []);
        const ev = await dbGet("schedule_events", `client_id=eq.${client.id}&order=start_date.asc`);
        setEvents(ev || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id]);

  const pending = cks.filter(c => !c.coach_response).length;
  const upcoming = events.filter(e => e.end_date >= new Date().toISOString().slice(0,10));

  return (
    <div>
      <button className="back" onClick={onBack}>← All Clients</button>
      <div className="cl-head">
        <div><div className="cl-name">{client.name}</div><div className="cl-sub">{client.level} · {client.goal}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          {pending > 0 && <span className="badge b-acc">{pending} awaiting response</span>}
          {upcoming.length > 0 && <span className="badge b-amber">{upcoming.length} upcoming event{upcoming.length > 1 ? "s" : ""}</span>}
        </div>
      </div>
      <div className="tabs">
        <button className={`t ${tab === "programme" ? "on" : ""}`} onClick={() => { setTab("programme"); setEditing(false); }}>Programme</button>
        <button className={`t ${tab === "checkins" ? "on" : ""}`} onClick={() => { setTab("checkins"); setEditing(false); }}>Check-ins {pending > 0 ? `(${pending})` : ""}</button>
        <button className={`t ${tab === "schedule" ? "on" : ""}`} onClick={() => { setTab("schedule"); setEditing(false); }}>Schedule {upcoming.length > 0 ? `(${upcoming.length})` : ""}</button>
      </div>
      {loading ? <div className="empty"><Spin /> Loading...</div> : (
        <>
          {tab === "programme" && (editing
            ? <ProgEditor prog={prog} clientId={client.id} coachId={coachId} onSave={p => { setProg(p); setEditing(false); }} onCancel={() => setEditing(false)} />
            : <ProgView prog={prog} isCoach onEdit={() => setEditing(true)} />
          )}
          {tab === "checkins" && (
            <div className="ck-list">
              {cks.length === 0
                ? <div className="empty"><div className="empty-icon">📋</div>No check-ins yet.</div>
                : cks.map(c => <CkCard key={c.id} ck={c} isCoach onRespond={(id, r) => setCks(cs => cs.map(x => x.id === id ? { ...x, coach_response: r } : x))} />)
              }
            </div>
          )}
          {tab === "schedule" && (
            <div>
              {events.length === 0
                ? <div className="empty"><div className="empty-icon">📅</div>{client.name.split(" ")[0]} hasn't added any schedule events yet.</div>
                : <div className="sch-list">
                  {events.map(ev => (
                    <div className="sch-item" key={ev.id}>
                      <div className={`sch-type sch-${ev.event_type.replace(/ .*/,"")}`}>{ev.event_type}</div>
                      <div className="sch-dates">{ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} → ${ev.end_date}`}</div>
                      {ev.note && <div className="sch-note">{ev.note}</div>}
                    </div>
                  ))}
                </div>
              }
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CoachDash({ coach, token }) {
  const [clients, setClients] = useState([]);
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setClients(await dbGet("clients", `coach_id=eq.${coach.id}&order=joined_date.desc`) || []); }
      catch (e) { }
      setLoading(false);
    })();
  }, [coach.id]);

  const selected = clients.find(c => c.id === sel);
  if (selected) return <ClientDetail client={selected} coachId={coach.id} onBack={() => setSel(null)} />;

  const pending = clients.filter(c => {
    // We'd need checkin data here — simplified for now
    return false;
  }).length;

  return (
    <div>
      {showAdd && <AddClientModal coachId={coach.id} token={token} onClose={() => setShowAdd(false)} onAdded={c => setClients(cs => [c, ...cs])} />}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
        <div className="pg-title">Dashboard</div>
        <button className="btn-edit" style={{ marginTop: 8 }} onClick={() => setShowAdd(true)}>+ Add Client</button>
      </div>
      <div className="pg-sub">Your clients and their programmes.</div>
      <div className="stats stats-3">
        <div className="stat"><div className="stat-n">{clients.length}</div><div className="stat-l">Active Clients</div></div>
        <div className="stat"><div className="stat-n">—</div><div className="stat-l">Pending Responses</div></div>
        <div className="stat"><div className="stat-n">—</div><div className="stat-l">Total Check-ins</div></div>
      </div>
      <div className="sec-lbl">Your Clients</div>
      {loading ? <div className="empty"><Spin /> Loading clients...</div>
        : clients.length === 0
          ? <div className="empty"><div className="empty-icon">👥</div>No clients yet. Click "+ Add Client" to get started.</div>
          : <div className="grid-2">{clients.map(c => (
            <div className="card click" key={c.id} onClick={() => setSel(c.id)}>
              <div className="card-top">
                <div><div className="card-name">{c.name}</div><div className="card-sub">{c.level}</div></div>
                <span className="badge b-dim">View →</span>
              </div>
              <div className="card-body">{c.goal}</div>
              <div className="card-foot"><div className="card-meta">Joined {c.joined_date}</div></div>
            </div>
          ))}</div>
      }
    </div>
  );
}

function AdminPanel({ token }) {
  const [coaches, setCoaches] = useState([]);
  const [clients, setClients] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cs, cls] = await Promise.all([dbGet("coaches", "order=joined_date.desc"), dbGet("clients", "order=joined_date.desc")]);
      setCoaches((cs || []).filter(c => c.email !== ADMIN_EMAIL));
      setClients(cls || []);
    } catch (e) { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    await dbUpdate("coaches", `id=eq.${id}`, { status });
    setCoaches(cs => cs.map(c => c.id === id ? { ...c, status } : c));
  };

  const pending = coaches.filter(c => c.status === "pending");
  const approved = coaches.filter(c => c.status === "approved");
  const rejected = coaches.filter(c => c.status === "rejected");

  return (
    <div>
      <div className="pg-title">Admin Panel</div>
      <div className="pg-sub">Manage coaches and platform overview.</div>
      <div className="stats stats-4">
        <div className="stat"><div className="stat-n">{approved.length}</div><div className="stat-l">Active Coaches</div></div>
        <div className="stat"><div className={`stat-n ${pending.length > 0 ? "amber" : ""}`}>{pending.length}</div><div className="stat-l">Pending Approval</div></div>
        <div className="stat"><div className="stat-n">{clients.length}</div><div className="stat-l">Total Clients</div></div>
        <div className="stat"><div className="stat-n">—</div><div className="stat-l">Total Check-ins</div></div>
      </div>
      <div className="tabs">
        <button className={`t ${tab === "pending" ? "on" : ""}`} onClick={() => setTab("pending")}>Pending {pending.length > 0 ? `(${pending.length})` : ""}</button>
        <button className={`t ${tab === "approved" ? "on" : ""}`} onClick={() => setTab("approved")}>Approved</button>
        <button className={`t ${tab === "rejected" ? "on" : ""}`} onClick={() => setTab("rejected")}>Rejected</button>
        <button className={`t ${tab === "clients" ? "on" : ""}`} onClick={() => setTab("clients")}>All Clients</button>
      </div>
      {loading ? <div className="empty"><Spin /> Loading...</div> : (
        <>
          {tab === "pending" && (pending.length === 0
            ? <div className="empty"><div className="empty-icon">✅</div>No pending applications.</div>
            : <div className="grid-2">{pending.map(c => (
              <div className="card" key={c.id}>
                <div className="card-top"><div><div className="card-name">{c.name}</div><div className="card-sub">{c.email}</div></div><span className="badge b-amber">Pending</span></div>
                <div className="card-body">{c.bio}</div>
                <div className="card-meta">Applied {c.joined_date}</div>
                <div className="c-actions"><button className="btn-approve" onClick={() => setStatus(c.id, "approved")}>Approve</button><button className="btn-reject" onClick={() => setStatus(c.id, "rejected")}>Reject</button></div>
              </div>
            ))}</div>
          )}
          {tab === "approved" && (
            <div className="tbl-wrap"><table>
              <thead><tr><th>Name</th><th>Email</th><th>Clients</th><th>Joined</th><th></th></tr></thead>
              <tbody>{approved.map(c => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td style={{ color: "var(--muted)" }}>{c.email}</td>
                  <td><span style={{ color: "var(--acc)", fontWeight: 700 }}>{clients.filter(cl => cl.coach_id === c.id).length}</span></td>
                  <td style={{ color: "var(--muted)" }}>{c.joined_date}</td>
                  <td><button className="btn-revoke" onClick={() => setStatus(c.id, "pending")}>Revoke</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
          {tab === "rejected" && (rejected.length === 0
            ? <div className="empty"><div className="empty-icon">📭</div>No rejected applications.</div>
            : <div className="grid-2">{rejected.map(c => (
              <div className="card" key={c.id}>
                <div className="card-top"><div><div className="card-name">{c.name}</div><div className="card-sub">{c.email}</div></div><span className="badge b-red">Rejected</span></div>
                <div className="card-body">{c.bio}</div>
                <div className="c-actions"><button className="btn-approve" onClick={() => setStatus(c.id, "approved")}>Approve Instead</button></div>
              </div>
            ))}</div>
          )}
          {tab === "clients" && (
            <div className="tbl-wrap"><table>
              <thead><tr><th>Client</th><th>Email</th><th>Coach</th><th>Level</th><th>Joined</th></tr></thead>
              <tbody>{clients.map(c => {
                const coach = coaches.find(co => co.id === c.coach_id);
                return (
                  <tr key={c.id}>
                    <td><b>{c.name}</b></td>
                    <td style={{ color: "var(--muted)" }}>{c.email}</td>
                    <td style={{ color: "var(--acc)" }}>{coach?.name || "Harry Anderson"}</td>
                    <td style={{ color: "var(--muted)" }}>{c.level}</td>
                    <td style={{ color: "var(--muted)" }}>{c.joined_date}</td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          )}
        </>
      )}
    </div>
  );
}

const EVENT_TYPES = ["Holiday", "Tournament", "Work Trip", "Injury / Illness", "Other"];

function ScheduleTab({ client }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ type: "Holiday", customType: "", startDate: "", endDate: "", note: "" });
  const [busy, setBusy] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const ev = await dbGet("schedule_events", `client_id=eq.${client.id}&order=start_date.asc`);
        setEvents(ev || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id]);

  const addEvent = async () => {
    if (!f.startDate || !f.endDate) return;
    if (f.endDate < f.startDate) return;
    setBusy(true);
    try {
      const eventType = f.type === "Other" && f.customType.trim() ? f.customType.trim() : f.type;
      const ne = await dbInsert("schedule_events", { client_id: client.id, coach_id: client.coach_id, event_type: eventType, start_date: f.startDate, end_date: f.endDate, note: f.note.trim() || null });
      setEvents(ev => [...ev, ne].sort((a,b) => a.start_date.localeCompare(b.start_date)));
      setShowForm(false);
      setF({ type: "Holiday", customType: "", startDate: "", endDate: "", note: "" });
    } catch (e) { }
    setBusy(false);
  };

  const deleteEvent = async (id) => {
    try {
      await fetch(`${SB_URL}/rest/v1/schedule_events?id=eq.${id}`, { method: "DELETE", headers: AH });
      setEvents(ev => ev.filter(e => e.id !== id));
    } catch (e) { }
  };

  const today = new Date().toISOString().slice(0,10);
  const upcoming = events.filter(e => e.end_date >= today);
  const past = events.filter(e => e.end_date < today);

  if (loading) return <div className="empty"><Spin /> Loading...</div>;

  return (
    <div>
      {!showForm && <button className="btn-edit" style={{ marginBottom: 20 }} onClick={() => setShowForm(true)}>+ Add Event</button>}
      {showForm && (
        <div className="sch-form">
          <div className="sch-form-title">Add Schedule Event</div>
          <div className="sch-row">
            <div>
              <label className="e-lbl">Event Type</label>
              <select className="e-inp e-sel" value={f.type} onChange={e => s("type", e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {f.type === "Other" && (
              <div>
                <label className="e-lbl">Specify</label>
                <input className="e-inp" placeholder="e.g. Birthday, Family visit..." value={f.customType} onChange={e => s("customType", e.target.value)} />
              </div>
            )}
          </div>
          <div className="sch-row">
            <div>
              <label className="e-lbl">Start Date</label>
              <input className="e-inp" type="date" value={f.startDate} onChange={e => { s("startDate", e.target.value); if (!f.endDate) s("endDate", e.target.value); }} />
            </div>
            <div>
              <label className="e-lbl">End Date</label>
              <input className="e-inp" type="date" value={f.endDate} min={f.startDate} onChange={e => s("endDate", e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="e-lbl">Note (optional)</label>
            <input className="e-inp" placeholder="Any extra info for your coach..." value={f.note} onChange={e => s("note", e.target.value)} />
          </div>
          <div className="ed-actions">
            <button className="btn-save" onClick={addEvent} disabled={!f.startDate || !f.endDate || busy}>{busy ? <><Spin />Saving...</> : "Add Event"}</button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && !showForm && (
        <div className="empty"><div className="empty-icon">📅</div>No events yet. Add holidays, tournaments, or anything your coach should plan around.</div>
      )}
      {upcoming.length > 0 && (
        <>
          <div className="sec-lbl">Upcoming</div>
          <div className="sch-list" style={{ marginBottom: 24 }}>
            {upcoming.map(ev => (
              <div className="sch-item" key={ev.id}>
                <div className={`sch-type sch-${ev.event_type.split(" ")[0].replace("/","")}`}>{ev.event_type}</div>
                <div className="sch-dates">{ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} → ${ev.end_date}`}</div>
                {ev.note && <div className="sch-note">{ev.note}</div>}
                <button className="sch-delete" onClick={() => deleteEvent(ev.id)} title="Remove">×</button>
              </div>
            ))}
          </div>
        </>
      )}
      {past.length > 0 && (
        <>
          <div className="sec-lbl" style={{ opacity: 0.5 }}>Past</div>
          <div className="sch-list" style={{ opacity: 0.5 }}>
            {past.map(ev => (
              <div className="sch-item" key={ev.id}>
                <div className={`sch-type sch-${ev.event_type.split(" ")[0].replace("/","")}`}>{ev.event_type}</div>
                <div className="sch-dates">{ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} → ${ev.end_date}`}</div>
                {ev.note && <div className="sch-note">{ev.note}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ClientPortal({ client }) {
  const [tab, setTab] = useState("programme");
  const [prog, setProg] = useState(null);
  const [cks, setCks] = useState([]);
  const [form, setForm] = useState({ rating: null, hardest: "", matchResult: "" });
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const ps = await dbGet("programmes", `client_id=eq.${client.id}&is_active=eq.true&limit=1`);
        setProg(ps?.[0] || null);
        const cs = await dbGet("checkins", `client_id=eq.${client.id}&order=created_at.desc`);
        setCks(cs || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id]);

  const weekNum = prog?.week_label?.match(/\d+/)?.[0] || "—";

  const submit = async () => {
    if (!form.rating || !form.hardest || !form.matchResult) return;
    setBusy(true);
    try {
      const nck = await dbInsert("checkins", { client_id: client.id, coach_id: client.coach_id, programme_id: prog?.id || null, week_label: prog?.week_label || "—", session_rating: form.rating, hardest: form.hardest, match_result: form.matchResult });
      setCks(cs => [nck, ...cs]);
      setSubmitted(true);
      setForm({ rating: null, hardest: "", matchResult: "" });
    } catch (e) { }
    setBusy(false);
  };

  if (loading) return <div className="empty" style={{ marginTop: 60 }}><Spin /> Loading your programme...</div>;

  return (
    <div>
      <div className="hero">
        <div>
          <div className="hero-greet">Welcome back,<br /><span>{client.name.split(" ")[0]}.</span></div>
          <div className="hero-goal">{client.goal}</div>
        </div>
        <div className="hero-wk">
          <div className="hero-wk-n">{weekNum}</div>
          <div className="hero-wk-l">Current week</div>
        </div>
      </div>
      <div className="tabs">
        <button className={`t ${tab === "programme" ? "on" : ""}`} onClick={() => setTab("programme")}>My Programme</button>
        <button className={`t ${tab === "checkins" ? "on" : ""}`} onClick={() => setTab("checkins")}>Check-ins</button>
        <button className={`t ${tab === "schedule" ? "on" : ""}`} onClick={() => setTab("schedule")}>My Schedule</button>
      </div>
      {tab === "programme" && (
        <div className="two-col">
          <ProgView prog={prog} isCoach={false} />
          <div className="ck-form-card">
            <div className="ck-form-title">Weekly Check-in</div>
            {submitted && <div className="flash-ok">Submitted ✓ Your coach will respond shortly.</div>}
            <div className="fld">
              <label className="lbl">Session rating this week</label>
              <div className="rating-row">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} className={`r-btn ${form.rating === n ? "on" : ""}`} onClick={() => setForm(f => ({ ...f, rating: n }))}>{n}</button>
                ))}
              </div>
            </div>
            <div className="fld">
              <label className="lbl">Hardest part of the week</label>
              <textarea className="inp ta" style={{ minHeight: 65 }} placeholder="What felt most difficult?" value={form.hardest} onChange={e => setForm(f => ({ ...f, hardest: e.target.value }))} />
            </div>
            <div className="fld">
              <label className="lbl">Match / drill results</label>
              <textarea className="inp ta" style={{ minHeight: 65 }} placeholder="Scores, opponents, tactical notes..." value={form.matchResult} onChange={e => setForm(f => ({ ...f, matchResult: e.target.value }))} />
            </div>
            <button className="btn-acc" onClick={submit} disabled={!form.rating || !form.hardest || !form.matchResult || busy}>{busy ? <><Spin />Submitting...</> : "Submit Check-in"}</button>
          </div>
        </div>
      )}
      {tab === "checkins" && (
        <div className="ck-list">
          {cks.length === 0
            ? <div className="empty"><div className="empty-icon">📋</div>No check-ins yet. Submit your first from the Programme tab.</div>
            : cks.map(c => <CkCard key={c.id} ck={c} isCoach={false} onRespond={() => {}} />)
          }
        </div>
      )}
      {tab === "schedule" && <ScheduleTab client={client} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [booting, setBooting] = useState(true);
  const [adminMode, setAdminMode] = useState(true);

  // On mount, check for existing session
  useEffect(() => {
    const stored = localStorage.getItem("sc_session");
    if (stored) {
      try {
        const s = JSON.parse(stored);
        setSession(s.session);
        setProfile(s.profile);
        setRole(s.role);
      } catch (e) { localStorage.removeItem("sc_session"); }
    }
    setBooting(false);
  }, []);

  const login = async (email, password) => {
    const data = await authSignIn(email, password);
    const token = data.access_token;
    const userId = data.user.id;

    // Check coaches table first
    const coaches = await dbGet("coaches", `id=eq.${userId}`);
    if (coaches?.length) {
      const prof = { ...coaches[0] };
      const s = { session: { token, userId, email }, profile: prof, role: "coach" };
      localStorage.setItem("sc_session", JSON.stringify(s));
      setSession({ token, userId, email });
      setProfile(prof);
      setRole("coach");
      return;
    }

    // Check clients table
    const clients = await dbGet("clients", `id=eq.${userId}`);
    if (clients?.length) {
      const prof = { ...clients[0] };
      const s = { session: { token, userId, email }, profile: prof, role: "client" };
      localStorage.setItem("sc_session", JSON.stringify(s));
      setSession({ token, userId, email });
      setProfile(prof);
      setRole("client");
      return;
    }

    throw new Error("No profile found for this account.");
  };

  const logout = async () => {
    if (session?.token) await authSignOut(session.token).catch(() => {});
    localStorage.removeItem("sc_session");
    setSession(null); setProfile(null); setRole(null);
  };

  if (booting) return <><style>{css}</style><Loading /></>;
  if (!session || !role) return <><style>{css}</style><AuthScreen onLogin={login} /></>;
  if (role === "coach" && profile?.status === "pending") return (
    <><style>{css}</style>
    <Nav name={profile.name} email={session.email} role="coach" onLogout={logout} />
    <PendingScreen onLogout={logout} /></>
  );

  const isAdmin = session.email === ADMIN_EMAIL && role === "coach";

  return (
    <><style>{css}</style>
    <Nav name={profile.name} email={session.email} role={role} onLogout={logout} adminMode={adminMode} onToggleAdmin={() => setAdminMode(m => !m)} />
    <div className="wrap">
      {isAdmin && adminMode && <AdminPanel token={session.token} />}
      {role === "coach" && (!isAdmin || !adminMode) && <CoachDash coach={profile} token={session.token} />}
      {role === "client" && <ClientPortal client={profile} />}
    </div></>
  );
}
