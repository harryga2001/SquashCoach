import React, { useState, useEffect, useCallback, useRef } from "react";

const SB_URL = "https://ntninbfowpvoyifstbqx.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bmluYmZvd3B2b3lpZnN0YnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTY1NTUsImV4cCI6MjA5NjQ5MjU1NX0.ZCTjtzBBTtFp46uDr320R-hq2fQBRl5MUwC5m4LaCpA";
const ADMIN_EMAILS = ["harry.g.a2001@gmail.com", "fin.mcmanus@hotmail.com"];
const ADMIN_EMAIL = "harry.g.a2001@gmail.com"; // primary admin (hidden from coach list)
const DB = `${SB_URL}/rest/v1`;
const AH = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function authSignIn(email, password) {
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { "apikey": SB_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.message || "Invalid email or password.");
  return d;
}
async function authSignUp(email, password) {
  const r = await fetch(`${SB_URL}/auth/v1/signup`, { method: "POST", headers: { "apikey": SB_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.message || "Signup failed.");
  return d;
}
async function authSignOut(token) { await fetch(`${SB_URL}/auth/v1/logout`, { method: "POST", headers: { "apikey": SB_KEY, "Authorization": `Bearer ${token}` } }); }
async function authResetPassword(email) { await fetch(`${SB_URL}/auth/v1/recover`, { method: "POST", headers: { "apikey": SB_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); }
async function authInviteUser(email, token) {
  const r = await fetch(`${SB_URL}/auth/v1/invite`, { method: "POST", headers: { "apikey": SB_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.message || "Invite failed.");
  return d;
}
async function dbGet(table, query = "") { const r = await fetch(`${DB}/${table}?${query}`, { headers: AH }); if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.status); } return r.json(); }
async function dbInsert(table, body) { const r = await fetch(`${DB}/${table}`, { method: "POST", headers: { ...AH, "Prefer": "return=representation" }, body: JSON.stringify(body) }); if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.status); } const d = await r.json(); return Array.isArray(d) ? d[0] : d; }
async function dbUpdate(table, query, body) { const r = await fetch(`${DB}/${table}?${query}`, { method: "PATCH", headers: { ...AH, "Prefer": "return=representation" }, body: JSON.stringify(body) }); if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.status); } return r.json(); }
async function dbDelete(table, query) { await fetch(`${DB}/${table}?${query}`, { method: "DELETE", headers: AH }); }

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
  .btn-acc:hover { opacity: 0.88; } .btn-acc:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost { width: 100%; background: none; border: 1px solid var(--border); border-radius: var(--r); padding: 11px; font-family: 'Barlow', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.15s; margin-top: 8px; }
  .btn-ghost:hover { border-color: var(--muted); color: var(--text); }
  .msg-err { background: var(--red-dim); border: 1px solid rgba(255,68,85,0.25); border-radius: var(--r); padding: 10px 13px; font-size: 13px; color: #ff7788; margin-bottom: 16px; }
  .msg-ok { background: var(--green-dim); border: 1px solid rgba(0,232,154,0.25); border-radius: var(--r); padding: 10px 13px; font-size: 13px; color: var(--green); margin-bottom: 16px; line-height: 1.6; }
  .nav { background: var(--surf); border-bottom: 1px solid var(--border); height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; position: sticky; top: 0; z-index: 100; }
  .nav-logo { font-family: 'Barlow Condensed', sans-serif; font-size: 19px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: var(--acc); }
  .nav-logo em { color: var(--muted); font-style: normal; font-weight: 400; font-size: 15px; margin-left: 6px; }
  .nav-r { display: flex; align-items: center; gap: 12px; }
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
  .stats-3 { grid-template-columns: repeat(3,1fr); } .stats-4 { grid-template-columns: repeat(4,1fr); }
  .stat { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 22px; }
  .stat-n { font-family: 'Barlow Condensed', sans-serif; font-size: 40px; font-weight: 900; color: var(--acc); line-height: 1; }
  .stat-n.amber { color: var(--amber); }
  .stat-l { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 5px; }
  .tabs { display: flex; gap: 3px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--r); padding: 3px; width: fit-content; margin-bottom: 24px; flex-wrap: wrap; }
  .t { background: none; border: none; padding: 7px 14px; border-radius: 4px; font-family: 'Barlow', sans-serif; font-size: 13px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.15s; }
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
  .cl-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 12px; }
  .cl-name { font-family: 'Barlow Condensed', sans-serif; font-size: 38px; font-weight: 900; letter-spacing: 0.03em; text-transform: uppercase; line-height: 1; }
  .cl-sub { font-size: 13px; color: var(--muted); margin-top: 5px; }
  .badge-row { display: flex; gap: 6px; flex-wrap: wrap; }
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
  .btn-save:hover { opacity: 0.88; } .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
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
  .btn-send:hover { opacity: 0.88; } .btn-send:disabled { opacity: 0.4; cursor: not-allowed; }
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
  tr:last-child td { border-bottom: none; } tr:hover td { background: var(--surf2); }
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; overflow-y: auto; }
  .modal { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 32px; width: 100%; max-width: 480px; }
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
  .onboard-banner { background: var(--amber-dim); border: 1px solid rgba(255,170,0,0.25); border-radius: var(--rl); padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .onboard-text { font-size: 13px; color: var(--amber); line-height: 1.5; }
  .onboard-text b { display: block; font-size: 14px; margin-bottom: 2px; }
  .btn-onboard { background: var(--amber); color: #0a0a0c; border: none; border-radius: var(--r); padding: 9px 18px; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; white-space: nowrap; }
  .sch-list { display: flex; flex-direction: column; gap: 10px; }
  .sch-item { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 16px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .sch-type { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .sch-Holiday { background: rgba(212,240,0,0.1); color: var(--acc); border: 1px solid rgba(212,240,0,0.2); }
  .sch-Tournament { background: rgba(0,200,255,0.1); color: var(--gym); border: 1px solid rgba(0,200,255,0.2); }
  .sch-Work { background: rgba(255,170,0,0.1); color: var(--amber); border: 1px solid rgba(255,170,0,0.2); }
  .sch-Injury { background: rgba(255,68,85,0.1); color: var(--red); border: 1px solid rgba(255,68,85,0.2); }
  .sch-Other { background: var(--surf2); color: var(--muted); border: 1px solid var(--border); }
  .sch-dates { font-size: 13px; font-weight: 600; color: var(--text); flex-shrink: 0; }
  .sch-note { font-size: 13px; color: var(--muted); flex: 1; }
  .sch-delete { background: none; border: none; color: var(--dim); font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1; transition: color 0.15s; flex-shrink: 0; margin-left: auto; }
  .sch-delete:hover { color: var(--red); }
  .msg-thread { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; max-height: 400px; overflow-y: auto; padding: 4px; }
  .msg-bubble { max-width: 75%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.55; }
  .msg-bubble.mine { background: var(--acc-dim); border: 1px solid rgba(212,240,0,0.15); align-self: flex-end; color: var(--text); border-bottom-right-radius: 3px; }
  .msg-bubble.theirs { background: var(--surf2); border: 1px solid var(--border); align-self: flex-start; color: var(--text); border-bottom-left-radius: 3px; }
  .msg-meta { font-size: 10px; color: var(--dim); margin-top: 4px; }
  .msg-sender { font-weight: 700; color: var(--muted); }
  .msg-input-row { display: flex; gap: 10px; align-items: flex-end; }
  .msg-input { flex: 1; background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 10px 13px; color: var(--text); font-family: 'Barlow', sans-serif; font-size: 13px; outline: none; resize: none; min-height: 42px; max-height: 120px; line-height: 1.5; transition: border-color 0.15s; }
  .msg-input:focus { border-color: var(--acc); }
  .msg-input::placeholder { color: var(--dim); }
  .notes-area { width: 100%; background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; color: var(--text); font-family: 'Barlow', sans-serif; font-size: 13px; outline: none; resize: vertical; min-height: 160px; line-height: 1.7; transition: border-color 0.15s; }
  .notes-area:focus { border-color: var(--acc); }
  .notes-area::placeholder { color: var(--dim); }
  .notes-saved { font-size: 11px; color: var(--green); margin-top: 6px; }
  .match-item { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 18px 20px; }
  .match-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .match-result { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 900; letter-spacing: 0.03em; }
  .match-result.win { color: var(--green); } .match-result.loss { color: var(--red); } .match-result.draw { color: var(--amber); }
  .match-opp { font-size: 13px; color: var(--muted); }
  .match-note { font-size: 13px; color: var(--muted); margin-top: 6px; line-height: 1.5; }
  .match-date { font-size: 11px; color: var(--dim); }
  .prog-hist-item { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 18px 20px; cursor: pointer; transition: border-color 0.15s; }
  .prog-hist-item:hover { border-color: rgba(212,240,0,0.3); }
  .prog-hist-label { font-family: 'Barlow Condensed', sans-serif; font-size: 17px; font-weight: 800; }
  .prog-hist-focus { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .prog-hist-date { font-size: 11px; color: var(--dim); margin-top: 4px; }
  .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  .profile-item { background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; }
  .profile-item-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .profile-item-val { font-size: 14px; color: var(--text); }
  .scorecard { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); overflow: hidden; margin-bottom: 20px; }
  .scorecard-player { padding: 20px 24px; }
  .scorecard-player + .scorecard-player { border-top: 1px solid var(--border); }
  .scorecard-vs { background: var(--surf2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 8px 24px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dim); text-align: center; }
  .scorecard-name { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 0.03em; margin-bottom: 12px; }
  .scorecard-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .scorecard-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .scorecard-footer { padding: 16px 24px; background: var(--surf2); border-top: 1px solid var(--border); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .rating-display { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 20px 24px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
  .rating-big { font-family: 'Barlow Condensed', sans-serif; font-size: 52px; font-weight: 900; color: var(--acc); line-height: 1; }
  .rating-label { font-size: 10px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }
  .rating-edit-form { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
  .match-card { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 18px 20px; }
  .match-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .match-score-row { display: flex; align-items: center; gap: 16px; }
  .match-player-col { flex: 1; }
  .match-player-name { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 800; letter-spacing: 0.03em; }
  .match-player-rating { font-size: 12px; color: var(--muted); margin-top: 1px; }
  .match-games { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; font-weight: 900; line-height: 1; }
  .match-games.win { color: var(--green); } .match-games.loss { color: var(--red); }
  .match-divider { font-size: 18px; color: var(--dim); font-weight: 700; }
  .match-change { font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 800; margin-top: 6px; }
  .match-change.pos { color: var(--green); } .match-change.neg { color: var(--red); }
  .match-meta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }
  .match-comp { font-size: 11px; color: var(--muted); }
  .match-notes-text { font-size: 13px; color: var(--muted); margin-top: 6px; line-height: 1.5; }
  @media (max-width: 780px) {
    .two-col { grid-template-columns: 1fr; }
    .stats-3, .stats-4 { grid-template-columns: 1fr 1fr; }
    .row2, .profile-grid { grid-template-columns: 1fr; }
    .wrap { padding: 20px 14px; }
    .nav { padding: 0 14px; }
    .hero-wk-n { font-size: 40px; }
    .msg-bubble { max-width: 90%; }
  }
`;

function Spin() { return <span className="spin" />; }
function Loading() { return <div className="loading"><div className="loading-logo">SquashCoach</div><Spin /></div>; }

function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [f, setF] = useState({ email: "", password: "", name: "", bio: "" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [busy, setBusy] = useState(false); const [showReset, setShowReset] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const login = async () => {
    if (!f.email || !f.password) { setErr("Please fill in all fields."); return; }
    setBusy(true); setErr("");
    try { await onLogin(f.email.trim().toLowerCase(), f.password); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const signup = async () => {
    if (!f.name || !f.email || !f.password || !f.bio) { setErr("All fields required."); return; }
    if (f.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true); setErr("");
    try {
      const data = await authSignUp(f.email.trim().toLowerCase(), f.password);
      if (data.user?.id) { await dbInsert("coaches", { id: data.user.id, name: f.name.trim(), email: f.email.trim().toLowerCase(), bio: f.bio.trim(), status: "pending" }); }
      setOk("Application submitted! You'll receive an email to confirm your account, then access once approved.");
      setF({ email: "", password: "", name: "", bio: "" });
    } catch (e) { setErr(e.message || "Signup failed."); }
    setBusy(false);
  };
  const reset = async () => {
    if (!f.email) { setErr("Enter your email first."); return; }
    setBusy(true); setErr("");
    try { await authResetPassword(f.email.trim().toLowerCase()); setOk("Password reset email sent."); setShowReset(false); } catch (e) { setErr("Could not send reset email."); }
    setBusy(false);
  };
  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-logo">SquashCoach</div>
        <div className="auth-tagline">Performance coaching — personalised.</div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "login" ? "on" : ""}`} onClick={() => { setTab("login"); setErr(""); setOk(""); setShowReset(false); }}>Sign In</button>
          <button className={`auth-tab ${tab === "signup" ? "on" : ""}`} onClick={() => { setTab("signup"); setErr(""); setOk(""); }}>Apply as Coach</button>
        </div>
        {err && <div className="msg-err">{err}</div>}
        {ok && <div className="msg-ok">{ok}</div>}
        {tab === "login" && !ok && (<>
          <div className="fld"><label className="lbl">Email</label><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e => s("email", e.target.value)} onKeyDown={e => e.key === "Enter" && login()} /></div>
          <div className="fld"><label className="lbl">Password</label><input className="inp" type="password" placeholder="••••••••" value={f.password} onChange={e => s("password", e.target.value)} onKeyDown={e => e.key === "Enter" && login()} /></div>
          <button className="btn-acc" onClick={login} disabled={busy}>{busy ? <><Spin />Signing in...</> : "Sign In"}</button>
          {!showReset ? <button className="btn-ghost" onClick={() => setShowReset(true)}>Forgot password?</button>
            : <button className="btn-ghost" onClick={reset} disabled={busy}>Send reset email to {f.email || "your email"}</button>}
        </>)}
        {tab === "signup" && !ok && (<>
          <div className="fld"><label className="lbl">Full Name</label><input className="inp" placeholder="Your name" value={f.name} onChange={e => s("name", e.target.value)} /></div>
          <div className="fld"><label className="lbl">Email</label><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e => s("email", e.target.value)} /></div>
          <div className="fld"><label className="lbl">Password</label><input className="inp" type="password" placeholder="Min. 6 characters" value={f.password} onChange={e => s("password", e.target.value)} /></div>
          <div className="fld"><label className="lbl">Coaching Background</label><textarea className="inp ta" placeholder="Level, experience, specialism..." value={f.bio} onChange={e => s("bio", e.target.value)} /></div>
          <button className="btn-acc" onClick={signup} disabled={busy}>{busy ? <><Spin />Submitting...</> : "Submit Application"}</button>
        </>)}
      </div>
    </div>
  );
}

function PendingScreen({ onLogout }) {
  return <div className="pending-screen"><div className="pending-box"><div className="pending-icon">⏳</div><div className="pending-t">Application Pending</div><div className="pending-b">Your application has been received and will be reviewed shortly.</div><button className="nav-out" onClick={onLogout}>Sign out</button></div></div>;
}

function Nav({ name, email, role, onLogout, adminMode, onToggleAdmin }) {
  const isAdmin = ADMIN_EMAILS.includes(email) && role === "coach";
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

function AddClientModal({ coachId, token, onClose, onAdded }) {
  const [f, setF] = useState({ name: "", email: "", level: "", goal: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const submit = async () => {
    if (!f.name || !f.email) { setErr("Name and email are required."); return; }
    setBusy(true); setErr("");
    try {
      const invited = await authInviteUser(f.email.trim().toLowerCase(), token);
      const client = await dbInsert("clients", { id: invited.id, coach_id: coachId, name: f.name.trim(), email: f.email.trim().toLowerCase(), level: f.level.trim(), goal: f.goal.trim() });
      onAdded(client); onClose();
    } catch (e) { setErr(e.message || "Failed to add client."); }
    setBusy(false);
  };
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Add New Client</div>
        {err && <div className="flash-err">{err}</div>}
        <div className="msg-ok" style={{ marginBottom: 16 }}>They'll receive an email invite to set their password.</div>
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

function OnboardingModal({ client, onClose, onSaved }) {
  const [f, setF] = useState({ training_days: "", gym_access: "Yes", squashlevels_rating: "", peak_rating: "", squashlevels_url: "", injury_history: "", squash_background: "", additional_goals: "" });
  const [busy, setBusy] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      await dbInsert("client_profiles", { client_id: client.id, ...f });
      onSaved(f); onClose();
    } catch (e) { }
    setBusy(false);
  };
  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="modal-title">Complete Your Profile</div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, lineHeight: 1.6 }}>This helps your coach build the right programme for you. Takes 2 minutes.</p>
        <div className="row2">
          <div><label className="e-lbl">SquashLevels Rating</label><input className="e-inp" type="number" placeholder="e.g. 5240" value={f.squashlevels_rating} onChange={e => s("squashlevels_rating", e.target.value)} /></div>
          <div><label className="e-lbl">Peak Rating</label><input className="e-inp" type="number" placeholder="e.g. 6100" value={f.peak_rating} onChange={e => s("peak_rating", e.target.value)} /></div>
        </div>
        <div className="fld"><label className="e-lbl">SquashLevels Profile URL (optional)</label><input className="e-inp" placeholder="https://squashlevels.com/players/..." value={f.squashlevels_url} onChange={e => s("squashlevels_url", e.target.value)} /></div>
        <div className="row2">
          <div><label className="e-lbl">Training days per week</label><input className="e-inp" type="number" min="1" max="7" placeholder="e.g. 4" value={f.training_days} onChange={e => s("training_days", e.target.value)} /></div>
          <div><label className="e-lbl">Squash Conditioning access?</label>
            <select className="e-inp e-sel" value={f.gym_access} onChange={e => s("gym_access", e.target.value)}>
              <option>Yes</option><option>No</option><option>Limited</option>
            </select>
          </div>
        </div>
        <div className="fld"><label className="e-lbl">Injury history</label><textarea className="e-ta" style={{ minHeight: 65 }} placeholder="Any current or past injuries your coach should know about..." value={f.injury_history} onChange={e => s("injury_history", e.target.value)} /></div>
        <div className="fld"><label className="e-lbl">Squash background</label><textarea className="e-ta" style={{ minHeight: 65 }} placeholder="How long playing, competition history, current ranking..." value={f.squash_background} onChange={e => s("squash_background", e.target.value)} /></div>
        <div className="fld"><label className="e-lbl">Additional goals</label><textarea className="e-ta" style={{ minHeight: 65 }} placeholder="Anything else you want your coach to know or focus on..." value={f.additional_goals} onChange={e => s("additional_goals", e.target.value)} /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-save" onClick={save} disabled={busy}>{busy ? <><Spin />Saving...</> : "Save Profile"}</button>
          <button className="btn-cancel" onClick={onClose}>Do this later</button>
        </div>
      </div>
    </div>
  );
}

function DayCard({ day }) {
  const [open, setOpen] = useState(false);
  const typeKey = day.type.replace(/ /g, "-");
  return (
    <div className="day" style={{ borderColor: open ? "rgba(212,240,0,0.25)" : undefined }}>
      <div className="day-h" onClick={() => setOpen(o => !o)}>
        <div className={`dot dot-${typeKey}`} />
        <div className="day-lbl">{day.day}</div>
        <div className="day-title">{day.title || <span style={{ color: "var(--dim)" }}>No session set</span>}</div>
        <div className={`type-pill tp-${typeKey}`}>{day.type}</div>
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
  const [d, setD] = useState(prog ? { week_label: prog.week_label, focus: prog.focus, days: JSON.parse(JSON.stringify(prog.days)) } : { week_label: "Week 1 of 4", focus: "", days: JSON.parse(JSON.stringify(BLANK)) });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const upDay = (i, k, v) => { const days = [...d.days]; days[i] = { ...days[i], [k]: v }; setD(p => ({ ...p, days })); };
  const save = async () => {
    if (!d.focus) { setErr("Please add a block focus."); return; }
    setBusy(true); setErr("");
    try {
      if (prog?.id) { await dbUpdate("programmes", `id=eq.${prog.id}`, { week_label: d.week_label, focus: d.focus, days: d.days, updated_at: new Date().toISOString() }); onSave({ ...prog, ...d }); }
      else { await dbUpdate("programmes", `client_id=eq.${clientId}&is_active=eq.true`, { is_active: false }); const np = await dbInsert("programmes", { client_id: clientId, coach_id: coachId, week_label: d.week_label, focus: d.focus, days: d.days }); onSave(np); }
    } catch (e) { setErr("Save failed."); }
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
  const [resp, setResp] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const send = async () => {
    setBusy(true);
    try { await dbUpdate("checkins", `id=eq.${ck.id}`, { coach_response: resp.trim(), responded_at: new Date().toISOString() }); onRespond(ck.id, resp.trim()); setDone(true); } catch (e) { }
    setBusy(false);
  };
  return (
    <div className="ck">
      <div className="ck-top">
        <div><div className="ck-wk">{ck.week_label} Check-in</div><div className="ck-date">{ck.created_at?.slice(0,10)}</div></div>
        <div><div className="ck-rating">{ck.session_rating}<span style={{ fontSize: 16, color: "var(--muted)" }}>/10</span></div><div className="ck-rl">Session rating</div></div>
      </div>
      <div className="ck-field"><div className="ck-fl">Hardest part of the week</div><div className="ck-val">{ck.hardest}</div></div>
      <div className="ck-field"><div className="ck-fl">Match / drill results</div><div className="ck-val">{ck.match_result}</div></div>
      {ck.coach_response ? <div className="resp-box"><div className="resp-lbl">Coach Response</div><div className="resp-txt">{ck.coach_response}</div></div>
        : isCoach ? done ? <div className="flash-ok">Response sent ✓</div> : (
          <div className="resp-form"><textarea className="resp-ta" placeholder="Write your response..." value={resp} onChange={e => setResp(e.target.value)} /><button className="btn-send" onClick={send} disabled={!resp.trim() || busy}>{busy ? <><Spin />Sending...</> : "Send Response"}</button></div>
        ) : <div className="no-resp">Awaiting coach response...</div>}
    </div>
  );
}

const EVENT_TYPES = ["Holiday", "Tournament", "Work Trip", "Injury / Illness", "Other"];

function ScheduleTab({ client, isCoach }) {
  const [events, setEvents] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ type: "Holiday", customType: "", startDate: "", endDate: "", note: "" });
  const [busy, setBusy] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  useEffect(() => {
    (async () => { setLoading(true); try { setEvents(await dbGet("schedule_events", `client_id=eq.${client.id}&order=start_date.asc`) || []); } catch (e) { } setLoading(false); })();
  }, [client.id]);
  const addEvent = async () => {
    if (!f.startDate || !f.endDate) return;
    setBusy(true);
    try {
      const et = f.type === "Other" && f.customType.trim() ? f.customType.trim() : f.type;
      const ne = await dbInsert("schedule_events", { client_id: client.id, coach_id: client.coach_id, event_type: et, start_date: f.startDate, end_date: f.endDate, note: f.note.trim() || null });
      setEvents(ev => [...ev, ne].sort((a,b) => a.start_date.localeCompare(b.start_date)));
      setShowForm(false); setF({ type: "Holiday", customType: "", startDate: "", endDate: "", note: "" });
    } catch (e) { }
    setBusy(false);
  };
  const today = new Date().toISOString().slice(0,10);
  const upcoming = events.filter(e => e.end_date >= today);
  const past = events.filter(e => e.end_date < today);
  if (loading) return <div className="empty"><Spin /> Loading...</div>;
  return (
    <div>
      {!isCoach && !showForm && <button className="btn-edit" style={{ marginBottom: 20 }} onClick={() => setShowForm(true)}>+ Add Event</button>}
      {!isCoach && showForm && (
        <div className="editor" style={{ marginBottom: 20 }}>
          <div className="editor-title">Add Schedule Event</div>
          <div className="row2">
            <div><label className="e-lbl">Event Type</label><select className="e-inp e-sel" value={f.type} onChange={e => s("type", e.target.value)}>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            {f.type === "Other" && <div><label className="e-lbl">Specify</label><input className="e-inp" placeholder="e.g. Birthday, Family visit..." value={f.customType} onChange={e => s("customType", e.target.value)} /></div>}
          </div>
          <div className="row2">
            <div><label className="e-lbl">Start Date</label><input className="e-inp" type="date" value={f.startDate} onChange={e => { s("startDate", e.target.value); if (!f.endDate) s("endDate", e.target.value); }} /></div>
            <div><label className="e-lbl">End Date</label><input className="e-inp" type="date" value={f.endDate} min={f.startDate} onChange={e => s("endDate", e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label className="e-lbl">Note (optional)</label><input className="e-inp" placeholder="Any extra info for your coach..." value={f.note} onChange={e => s("note", e.target.value)} /></div>
          <div className="ed-actions">
            <button className="btn-save" onClick={addEvent} disabled={!f.startDate || !f.endDate || busy}>{busy ? <><Spin />Saving...</> : "Add Event"}</button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && !showForm && <div className="empty"><div className="empty-icon">📅</div>{isCoach ? `${client.name.split(" ")[0]} hasn't added any schedule events yet.` : "No events yet. Add holidays, tournaments, or anything your coach should plan around."}</div>}
      {upcoming.length > 0 && (<><div className="sec-lbl">Upcoming</div><div className="sch-list" style={{ marginBottom: 24 }}>{upcoming.map(ev => (<div className="sch-item" key={ev.id}><div className={`sch-type sch-${ev.event_type.split(" ")[0].replace("/","")}`}>{ev.event_type}</div><div className="sch-dates">{ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} → ${ev.end_date}`}</div>{ev.note && <div className="sch-note">{ev.note}</div>}{!isCoach && <button className="sch-delete" onClick={async () => { await dbDelete("schedule_events", `id=eq.${ev.id}`); setEvents(e => e.filter(x => x.id !== ev.id)); }}>×</button>}</div>))}</div></>)}
      {past.length > 0 && (<><div className="sec-lbl" style={{ opacity: 0.5 }}>Past</div><div className="sch-list" style={{ opacity: 0.5 }}>{past.map(ev => (<div className="sch-item" key={ev.id}><div className={`sch-type sch-${ev.event_type.split(" ")[0].replace("/","")}`}>{ev.event_type}</div><div className="sch-dates">{ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} → ${ev.end_date}`}</div>{ev.note && <div className="sch-note">{ev.note}</div>}</div>))}</div></>)}
    </div>
  );
}

function MessagesTab({ client, currentUserId, currentUserName }) {
  const [msgs, setMsgs] = useState([]); const [loading, setLoading] = useState(true);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => {
    (async () => { setLoading(true); try { setMsgs(await dbGet("messages", `client_id=eq.${client.id}&order=created_at.asc`) || []); } catch (e) { } setLoading(false); })();
  }, [client.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const nm = await dbInsert("messages", { client_id: client.id, coach_id: client.coach_id, sender_id: currentUserId, sender_name: currentUserName, body: text.trim() });
      setMsgs(m => [...m, nm]); setText("");
    } catch (e) { }
    setBusy(false);
  };
  if (loading) return <div className="empty"><Spin /> Loading messages...</div>;
  return (
    <div>
      <div className="msg-thread">
        {msgs.length === 0 && <div className="empty" style={{ padding: "20px 0" }}><div className="empty-icon">💬</div>No messages yet. Start the conversation.</div>}
        {msgs.map(m => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.sender_id === currentUserId ? "flex-end" : "flex-start" }}>
            <div className={`msg-bubble ${m.sender_id === currentUserId ? "mine" : "theirs"}`}>{m.body}</div>
            <div className="msg-meta"><span className="msg-sender">{m.sender_name}</span> · {m.created_at?.slice(0,10)}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="msg-input-row">
        <textarea className="msg-input" placeholder="Write a message..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} />
        <button className="btn-send" onClick={send} disabled={!text.trim() || busy}>{busy ? <Spin /> : "Send"}</button>
      </div>
    </div>
  );
}

function NotesTab({ client }) {
  const [notes, setNotes] = useState(""); const [loading, setLoading] = useState(true); const [saved, setSaved] = useState(false); const [timer, setTimer] = useState(null);
  useEffect(() => {
    (async () => { setLoading(true); try { const r = await dbGet("coach_notes", `client_id=eq.${client.id}&limit=1`); setNotes(r?.[0]?.content || ""); } catch (e) { } setLoading(false); })();
  }, [client.id]);
  const save = async (val) => {
    try {
      const existing = await dbGet("coach_notes", `client_id=eq.${client.id}&limit=1`);
      if (existing?.length) { await dbUpdate("coach_notes", `client_id=eq.${client.id}`, { content: val, updated_at: new Date().toISOString() }); }
      else { await dbInsert("coach_notes", { client_id: client.id, coach_id: client.coach_id, content: val }); }
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { }
  };
  const onChange = (val) => {
    setNotes(val);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => save(val), 1500));
  };
  if (loading) return <div className="empty"><Spin /> Loading notes...</div>;
  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>Private notes — only you can see this. Auto-saves as you type.</p>
      <textarea className="notes-area" placeholder={`Notes about ${client.name.split(" ")[0]}...\n\nStrengths, weaknesses, what they respond well to, things to avoid, patterns you've noticed...`} value={notes} onChange={e => onChange(e.target.value)} />
      {saved && <div className="notes-saved">✓ Saved</div>}
    </div>
  );
}

function MatchesTab({ client, isCoach, clientName }) {
  const [matches, setMatches] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ date: "", my_rating: "", my_games: "0", my_rating_change: "", opponent_name: "", opponent_rating: "", opp_games: "0", competition: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  useEffect(() => {
    (async () => { setLoading(true); try { setMatches(await dbGet("match_results", `client_id=eq.${client.id}&order=date.desc`) || []); } catch (e) { } setLoading(false); })();
  }, [client.id]);
  const myGames = parseInt(f.my_games) || 0;
  const oppGames = parseInt(f.opp_games) || 0;
  const result = myGames > oppGames ? "Win" : myGames < oppGames ? "Loss" : "Draw";
  const add = async () => {
    if (!f.date || !f.opponent_name) return;
    setBusy(true);
    try {
      const nm = await dbInsert("match_results", { client_id: client.id, coach_id: client.coach_id, date: f.date, my_rating: f.my_rating || null, my_games: f.my_games, my_rating_change: f.my_rating_change || null, opponent_name: f.opponent_name, opponent_rating: f.opponent_rating || null, opp_games: f.opp_games, result, competition: f.competition, notes: f.notes });
      setMatches(m => [nm, ...m]); setShowForm(false);
      setF({ date: "", my_rating: "", my_games: "0", my_rating_change: "", opponent_name: "", opponent_rating: "", opp_games: "0", competition: "", notes: "" });
    } catch (e) { }
    setBusy(false);
  };
  if (loading) return <div className="empty"><Spin /> Loading matches...</div>;
  return (
    <div>
      {!isCoach && !showForm && <button className="btn-edit" style={{ marginBottom: 20 }} onClick={() => setShowForm(true)}>+ Log Match</button>}
      {!isCoach && showForm && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label className="e-lbl">Date</label>
            <input className="e-inp" type="date" value={f.date} onChange={e => s("date", e.target.value)} />
          </div>
          <div className="scorecard">
            <div className="scorecard-player">
              <div className="scorecard-name">{clientName || "You"}</div>
              <div className="scorecard-row">
                <div><label className="e-lbl">SquashLevels Rating</label><input className="e-inp" type="number" placeholder="e.g. 5240" value={f.my_rating} onChange={e => s("my_rating", e.target.value)} /></div>
                <div><label className="e-lbl">Games Won</label>
                  <select className="e-inp e-sel" value={f.my_games} onChange={e => s("my_games", e.target.value)}>
                    {[0,1,2,3].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <label className="e-lbl">Rating Change</label>
                <input className="e-inp" placeholder="e.g. +2.3% or -1.4%" value={f.my_rating_change} onChange={e => s("my_rating_change", e.target.value)} />
              </div>
            </div>
            <div className="scorecard-vs">vs</div>
            <div className="scorecard-player">
              <div className="scorecard-name">Opponent</div>
              <div className="scorecard-row">
                <div><label className="e-lbl">Opponent Name</label><input className="e-inp" placeholder="Name" value={f.opponent_name} onChange={e => s("opponent_name", e.target.value)} /></div>
                <div><label className="e-lbl">SquashLevels Rating</label><input className="e-inp" type="number" placeholder="e.g. 4800" value={f.opponent_rating} onChange={e => s("opponent_rating", e.target.value)} /></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <label className="e-lbl">Games Won</label>
                <select className="e-inp e-sel" value={f.opp_games} onChange={e => s("opp_games", e.target.value)}>
                  {[0,1,2,3].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="scorecard-footer">
              <div><label className="e-lbl">Competition / Context</label><input className="e-inp" placeholder="e.g. County League, Club Night" value={f.competition} onChange={e => s("competition", e.target.value)} /></div>
              <div><label className="e-lbl">Result</label><div style={{ padding: "9px 0", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: result === "Win" ? "var(--green)" : result === "Loss" ? "var(--red)" : "var(--amber)" }}>{result} {myGames}–{oppGames}</div></div>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}><label className="e-lbl">Notes</label><textarea className="e-ta" style={{ minHeight: 65 }} placeholder="How did it go tactically? What worked, what didn't?" value={f.notes} onChange={e => s("notes", e.target.value)} /></div>
          <div className="ed-actions">
            <button className="btn-save" onClick={add} disabled={!f.date || !f.opponent_name || busy}>{busy ? <><Spin />Saving...</> : "Log Match"}</button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {matches.length === 0 && !showForm && <div className="empty"><div className="empty-icon">🎯</div>{isCoach ? `${client.name.split(" ")[0]} hasn't logged any matches yet.` : "No matches logged yet."}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {matches.map(m => {
          const myG = parseInt(m.my_games) || 0; const oppG = parseInt(m.opp_games) || 0;
          const isPos = m.my_rating_change && (m.my_rating_change.startsWith("+") || parseFloat(m.my_rating_change) > 0);
          const hasChange = m.my_rating_change && m.my_rating_change !== "";
          return (
            <div className="match-card" key={m.id}>
              <div className="match-header">
                <span className="badge b-dim">{m.date}</span>
                {m.competition && <span className="match-comp">{m.competition}</span>}
              </div>
              <div className="match-score-row">
                <div className="match-player-col">
                  <div className="match-player-name">{clientName || client.name.split(" ")[0]}</div>
                  {m.my_rating && <div className="match-player-rating">SL: {parseInt(m.my_rating).toLocaleString()}</div>}
                  {hasChange && <div className={`match-change ${isPos ? "pos" : "neg"}`}>{m.my_rating_change}</div>}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className={`match-games ${myG > oppG ? "win" : "loss"}`}>{myG}</div>
                    <div className="match-divider">–</div>
                    <div className={`match-games ${oppG > myG ? "win" : "loss"}`}>{oppG}</div>
                  </div>
                  <div style={{ fontSize: 10, color: m.result === "Win" ? "var(--green)" : m.result === "Loss" ? "var(--red)" : "var(--amber)", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>{m.result}</div>
                </div>
                <div className="match-player-col" style={{ textAlign: "right" }}>
                  <div className="match-player-name">{m.opponent_name}</div>
                  {m.opponent_rating && <div className="match-player-rating">SL: {parseInt(m.opponent_rating).toLocaleString()}</div>}
                  {m.my_rating && m.opponent_rating && <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>Diff: {(parseInt(m.my_rating) - parseInt(m.opponent_rating)).toLocaleString()}</div>}
                </div>
              </div>
              {m.notes && <div className="match-notes-text">{m.notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileTab({ client, isCoach }) {
  const [profile, setProfile] = useState(null); const [loading, setLoading] = useState(true);
  const [editRating, setEditRating] = useState(false); const [newRating, setNewRating] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => { setLoading(true); try { const r = await dbGet("client_profiles", `client_id=eq.${client.id}&limit=1`); setProfile(r?.[0] || null); setNewRating(r?.[0]?.squashlevels_rating || ""); } catch (e) { } setLoading(false); })();
  }, [client.id]);
  const updateRating = async () => {
    setSaving(true);
    try {
      if (profile) { await dbUpdate("client_profiles", `client_id=eq.${client.id}`, { squashlevels_rating: newRating, updated_at: new Date().toISOString() }); setProfile(p => ({ ...p, squashlevels_rating: newRating })); }
      else { const np = await dbInsert("client_profiles", { client_id: client.id, squashlevels_rating: newRating }); setProfile(np); }
      setEditRating(false);
    } catch (e) { }
    setSaving(false);
  };
  if (loading) return <div className="empty"><Spin /> Loading...</div>;
  if (!profile && !isCoach) return <div className="empty"><div className="empty-icon">📋</div>{client.name.split(" ")[0]} hasn't completed their profile yet.</div>;
  return (
    <div>
      <div className="rating-display">
        <div>
          <div className="rating-big">{profile?.squashlevels_rating ? parseInt(profile.squashlevels_rating).toLocaleString() : "—"}</div>
          <div className="rating-label">Current SquashLevels Rating</div>
          {profile?.peak_rating && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Peak: {parseInt(profile.peak_rating).toLocaleString()}</div>}
          {profile?.squashlevels_url && <a href={profile.squashlevels_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--acc)", marginTop: 4, display: "block" }}>View SquashLevels Profile →</a>}
        </div>
        <div>
          {!editRating ? (
            <button className="btn-edit" onClick={() => setEditRating(true)}>{isCoach ? "Override Rating" : "Update Rating"}</button>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="e-inp" type="number" placeholder="e.g. 5240" value={newRating} onChange={e => setNewRating(e.target.value)} style={{ width: 130 }} />
              <button className="btn-save" style={{ padding: "9px 14px" }} onClick={updateRating} disabled={saving}>{saving ? <Spin /> : "Save"}</button>
              <button className="btn-cancel" style={{ padding: "9px 14px" }} onClick={() => setEditRating(false)}>✕</button>
            </div>
          )}
        </div>
      </div>
      {profile && (() => {
        const fields = [
          { label: "Training days/week", val: profile.training_days },
          { label: "Conditioning access", val: profile.gym_access },
          { label: "Injury history", val: profile.injury_history },
          { label: "Squash background", val: profile.squash_background },
          { label: "Additional goals", val: profile.additional_goals },
        ].filter(f => f.val);
        return fields.length > 0 ? (
          <div className="profile-grid">
            {fields.map(f => (
              <div className="profile-item" key={f.label}>
                <div className="profile-item-label">{f.label}</div>
                <div className="profile-item-val">{f.val}</div>
              </div>
            ))}
          </div>
        ) : null;
      })()}
    </div>
  );
}

function ProgHistoryTab({ client }) {
  const [progs, setProgs] = useState([]); const [loading, setLoading] = useState(true); const [viewing, setViewing] = useState(null);
  useEffect(() => {
    (async () => { setLoading(true); try { setProgs(await dbGet("programmes", `client_id=eq.${client.id}&order=created_at.desc`) || []); } catch (e) { } setLoading(false); })();
  }, [client.id]);
  if (loading) return <div className="empty"><Spin /> Loading...</div>;
  if (viewing) return (
    <div>
      <button className="back" onClick={() => setViewing(null)}>← All Blocks</button>
      <ProgView prog={viewing} isCoach={false} />
    </div>
  );
  if (progs.length === 0) return <div className="empty"><div className="empty-icon">📚</div>No programme history yet.</div>;
  return (
    <div className="ck-list">
      {progs.map(p => (
        <div className="prog-hist-item" key={p.id} onClick={() => setViewing(p)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div className="prog-hist-label">{p.week_label}</div><div className="prog-hist-focus">{p.focus}</div><div className="prog-hist-date">{p.created_at?.slice(0,10)}{p.is_active ? " · " : ""}{p.is_active && <span style={{ color: "var(--acc)", fontWeight: 700 }}>Current</span>}</div></div>
            <span style={{ color: "var(--muted)", fontSize: 18 }}>→</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientDetail({ client, coachId, coachId: myCoachId, onBack, sessionUserId, sessionUserName }) {
  const [tab, setTab] = useState("programme");
  const [prog, setProg] = useState(null); const [cks, setCks] = useState([]); const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(false); const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [ps, cs, ev] = await Promise.all([
          dbGet("programmes", `client_id=eq.${client.id}&is_active=eq.true&limit=1`),
          dbGet("checkins", `client_id=eq.${client.id}&order=created_at.desc`),
          dbGet("schedule_events", `client_id=eq.${client.id}&end_date=gte.${new Date().toISOString().slice(0,10)}&order=start_date.asc`),
        ]);
        setProg(ps?.[0] || null); setCks(cs || []); setEvents(ev || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id]);
  const pending = cks.filter(c => !c.coach_response).length;
  const upcoming = events.length;
  return (
    <div>
      <button className="back" onClick={onBack}>← All Clients</button>
      <div className="cl-head">
        <div><div className="cl-name">{client.name}</div><div className="cl-sub">{client.level} · {client.goal}</div></div>
        <div className="badge-row">
          {pending > 0 && <span className="badge b-acc">{pending} awaiting response</span>}
          {upcoming > 0 && <span className="badge b-amber">{upcoming} upcoming event{upcoming > 1 ? "s" : ""}</span>}
        </div>
      </div>
      <div className="tabs">
        <button className={`t ${tab === "programme" ? "on" : ""}`} onClick={() => { setTab("programme"); setEditing(false); }}>Programme</button>
        <button className={`t ${tab === "history" ? "on" : ""}`} onClick={() => { setTab("history"); setEditing(false); }}>History</button>
        <button className={`t ${tab === "checkins" ? "on" : ""}`} onClick={() => { setTab("checkins"); setEditing(false); }}>Check-ins {pending > 0 ? `(${pending})` : ""}</button>
        <button className={`t ${tab === "schedule" ? "on" : ""}`} onClick={() => { setTab("schedule"); setEditing(false); }}>Schedule {upcoming > 0 ? `(${upcoming})` : ""}</button>
        <button className={`t ${tab === "matches" ? "on" : ""}`} onClick={() => { setTab("matches"); setEditing(false); }}>Matches</button>
        <button className={`t ${tab === "messages" ? "on" : ""}`} onClick={() => { setTab("messages"); setEditing(false); }}>Messages</button>
        <button className={`t ${tab === "profile" ? "on" : ""}`} onClick={() => { setTab("profile"); setEditing(false); }}>Profile</button>
        <button className={`t ${tab === "notes" ? "on" : ""}`} onClick={() => { setTab("notes"); setEditing(false); }}>Notes</button>
      </div>
      {loading ? <div className="empty"><Spin /> Loading...</div> : (<>
        {tab === "programme" && (editing ? <ProgEditor prog={prog} clientId={client.id} coachId={coachId} onSave={p => { setProg(p); setEditing(false); }} onCancel={() => setEditing(false)} /> : <ProgView prog={prog} isCoach onEdit={() => setEditing(true)} />)}
        {tab === "history" && <ProgHistoryTab client={client} />}
        {tab === "checkins" && <div className="ck-list">{cks.length === 0 ? <div className="empty"><div className="empty-icon">📋</div>No check-ins yet.</div> : cks.map(c => <CkCard key={c.id} ck={c} isCoach onRespond={(id, r) => setCks(cs => cs.map(x => x.id === id ? { ...x, coach_response: r } : x))} />)}</div>}
        {tab === "schedule" && <ScheduleTab client={client} isCoach />}
        {tab === "matches" && <MatchesTab client={client} isCoach clientName={client.name} />}
        {tab === "messages" && <MessagesTab client={client} currentUserId={sessionUserId} currentUserName={sessionUserName} />}
        {tab === "profile" && <ProfileTab client={client} isCoach />}
        {tab === "notes" && <NotesTab client={client} />}
      </>)}
    </div>
  );
}

function CoachDash({ coach, token, sessionUserId, sessionUserName }) {
  const [clients, setClients] = useState([]); const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true); const [showAdd, setShowAdd] = useState(false);
  useEffect(() => {
    (async () => { setLoading(true); try { setClients(await dbGet("clients", `coach_id=eq.${coach.id}&order=joined_date.desc`) || []); } catch (e) { } setLoading(false); })();
  }, [coach.id]);
  const selected = clients.find(c => c.id === sel);
  if (selected) return <ClientDetail client={selected} coachId={coach.id} onBack={() => setSel(null)} sessionUserId={sessionUserId} sessionUserName={sessionUserName} />;
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
      {loading ? <div className="empty"><Spin /> Loading clients...</div> : clients.length === 0 ? <div className="empty"><div className="empty-icon">👥</div>No clients yet.</div> : (
        <div className="grid-2">{clients.map(c => (
          <div className="card click" key={c.id} onClick={() => setSel(c.id)}>
            <div className="card-top"><div><div className="card-name">{c.name}</div><div className="card-sub">{c.level}</div></div><span className="badge b-dim">View →</span></div>
            <div className="card-body">{c.goal}</div>
            <div className="card-foot"><div className="card-meta">Joined {c.joined_date}</div></div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

function AdminPanel({ token }) {
  const [coaches, setCoaches] = useState([]); const [clients, setClients] = useState([]); const [tab, setTab] = useState("pending"); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { const [cs, cls] = await Promise.all([dbGet("coaches", "order=joined_date.desc"), dbGet("clients", "order=joined_date.desc")]); setCoaches((cs || []).filter(c => !ADMIN_EMAILS.includes(c.email))); setClients(cls || []); } catch (e) { } setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (id, status) => { await dbUpdate("coaches", `id=eq.${id}`, { status }); setCoaches(cs => cs.map(c => c.id === id ? { ...c, status } : c)); };
  const pending = coaches.filter(c => c.status === "pending"); const approved = coaches.filter(c => c.status === "approved"); const rejected = coaches.filter(c => c.status === "rejected");
  return (
    <div>
      <div className="pg-title">Admin Panel</div><div className="pg-sub">Manage coaches and platform overview.</div>
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
      {loading ? <div className="empty"><Spin /> Loading...</div> : (<>
        {tab === "pending" && (pending.length === 0 ? <div className="empty"><div className="empty-icon">✅</div>No pending applications.</div> : <div className="grid-2">{pending.map(c => (<div className="card" key={c.id}><div className="card-top"><div><div className="card-name">{c.name}</div><div className="card-sub">{c.email}</div></div><span className="badge b-amber">Pending</span></div><div className="card-body">{c.bio}</div><div className="card-meta">Applied {c.joined_date}</div><div className="c-actions"><button className="btn-approve" onClick={() => setStatus(c.id, "approved")}>Approve</button><button className="btn-reject" onClick={() => setStatus(c.id, "rejected")}>Reject</button></div></div>))}</div>)}
        {tab === "approved" && <div className="tbl-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Clients</th><th>Joined</th><th></th></tr></thead><tbody>{approved.map(c => (<tr key={c.id}><td><b>{c.name}</b></td><td style={{ color: "var(--muted)" }}>{c.email}</td><td><span style={{ color: "var(--acc)", fontWeight: 700 }}>{clients.filter(cl => cl.coach_id === c.id).length}</span></td><td style={{ color: "var(--muted)" }}>{c.joined_date}</td><td><button className="btn-revoke" onClick={() => setStatus(c.id, "pending")}>Revoke</button></td></tr>))}</tbody></table></div>}
        {tab === "rejected" && (rejected.length === 0 ? <div className="empty"><div className="empty-icon">📭</div>No rejected applications.</div> : <div className="grid-2">{rejected.map(c => (<div className="card" key={c.id}><div className="card-top"><div><div className="card-name">{c.name}</div><div className="card-sub">{c.email}</div></div><span className="badge b-red">Rejected</span></div><div className="card-body">{c.bio}</div><div className="c-actions"><button className="btn-approve" onClick={() => setStatus(c.id, "approved")}>Approve Instead</button></div></div>))}</div>)}
        {tab === "clients" && <div className="tbl-wrap"><table><thead><tr><th>Client</th><th>Email</th><th>Coach</th><th>Level</th><th>Joined</th></tr></thead><tbody>{clients.map(c => { const coach = coaches.find(co => co.id === c.coach_id); return (<tr key={c.id}><td><b>{c.name}</b></td><td style={{ color: "var(--muted)" }}>{c.email}</td><td style={{ color: "var(--acc)" }}>{coach?.name || "Harry Anderson"}</td><td style={{ color: "var(--muted)" }}>{c.level}</td><td style={{ color: "var(--muted)" }}>{c.joined_date}</td></tr>); })}</tbody></table></div>}
      </>)}
    </div>
  );
}

function ClientPortal({ client, sessionUserId, sessionUserName }) {
  const [tab, setTab] = useState("programme");
  const [prog, setProg] = useState(null); const [cks, setCks] = useState([]);
  const [form, setForm] = useState({ rating: null, hardest: "", matchResult: "" });
  const [busy, setBusy] = useState(false); const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true); const [showOnboard, setShowOnboard] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [ps, cs, prof] = await Promise.all([
          dbGet("programmes", `client_id=eq.${client.id}&is_active=eq.true&limit=1`),
          dbGet("checkins", `client_id=eq.${client.id}&order=created_at.desc`),
          dbGet("client_profiles", `client_id=eq.${client.id}&limit=1`),
        ]);
        setProg(ps?.[0] || null); setCks(cs || []);
        setHasProfile(prof?.length > 0);
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
      setCks(cs => [nck, ...cs]); setSubmitted(true); setForm({ rating: null, hardest: "", matchResult: "" });
    } catch (e) { }
    setBusy(false);
  };
  if (loading) return <div className="empty" style={{ marginTop: 60 }}><Spin /> Loading your programme...</div>;
  return (
    <div>
      {showOnboard && <OnboardingModal client={client} onClose={() => setShowOnboard(false)} onSaved={() => setHasProfile(true)} />}
      {!hasProfile && (
        <div className="onboard-banner">
          <div className="onboard-text"><b>Complete your profile</b>Help your coach build a programme that fits your life — takes 2 minutes.</div>
          <button className="btn-onboard" onClick={() => setShowOnboard(true)}>Complete Now</button>
        </div>
      )}
      <div className="hero">
        <div><div className="hero-greet">Welcome back,<br /><span>{client.name.split(" ")[0]}.</span></div><div className="hero-goal">{client.goal}</div></div>
        <div className="hero-wk"><div className="hero-wk-n">{weekNum}</div><div className="hero-wk-l">Current week</div></div>
      </div>
      <div className="tabs">
        <button className={`t ${tab === "programme" ? "on" : ""}`} onClick={() => setTab("programme")}>My Programme</button>
        <button className={`t ${tab === "history" ? "on" : ""}`} onClick={() => setTab("history")}>History</button>
        <button className={`t ${tab === "checkins" ? "on" : ""}`} onClick={() => setTab("checkins")}>Check-ins</button>
        <button className={`t ${tab === "schedule" ? "on" : ""}`} onClick={() => setTab("schedule")}>My Schedule</button>
        <button className={`t ${tab === "matches" ? "on" : ""}`} onClick={() => setTab("matches")}>Matches</button>
        <button className={`t ${tab === "messages" ? "on" : ""}`} onClick={() => setTab("messages")}>Messages</button>
        <button className={`t ${tab === "profile" ? "on" : ""}`} onClick={() => setTab("profile")}>My Profile</button>
      </div>
      {tab === "programme" && (
        <div className="two-col">
          <ProgView prog={prog} isCoach={false} />
          <div className="ck-form-card">
            <div className="ck-form-title">Weekly Check-in</div>
            {submitted && <div className="flash-ok">Submitted ✓ Your coach will respond shortly.</div>}
            <div className="fld"><label className="lbl">Session rating this week</label><div className="rating-row">{[1,2,3,4,5,6,7,8,9,10].map(n => (<button key={n} className={`r-btn ${form.rating === n ? "on" : ""}`} onClick={() => setForm(f => ({ ...f, rating: n }))}>{n}</button>))}</div></div>
            <div className="fld"><label className="lbl">Hardest part of the week</label><textarea className="inp ta" style={{ minHeight: 65 }} placeholder="What felt most difficult?" value={form.hardest} onChange={e => setForm(f => ({ ...f, hardest: e.target.value }))} /></div>
            <div className="fld"><label className="lbl">Match / drill results</label><textarea className="inp ta" style={{ minHeight: 65 }} placeholder="Scores, opponents, tactical notes..." value={form.matchResult} onChange={e => setForm(f => ({ ...f, matchResult: e.target.value }))} /></div>
            <button className="btn-acc" onClick={submit} disabled={!form.rating || !form.hardest || !form.matchResult || busy}>{busy ? <><Spin />Submitting...</> : "Submit Check-in"}</button>
          </div>
        </div>
      )}
      {tab === "history" && <ProgHistoryTab client={client} />}
      {tab === "checkins" && <div className="ck-list">{cks.length === 0 ? <div className="empty"><div className="empty-icon">📋</div>No check-ins yet.</div> : cks.map(c => <CkCard key={c.id} ck={c} isCoach={false} onRespond={() => {}} />)}</div>}
      {tab === "schedule" && <ScheduleTab client={client} isCoach={false} />}
      {tab === "matches" && <MatchesTab client={client} isCoach={false} clientName={client.name} />}
      {tab === "messages" && <MessagesTab client={client} currentUserId={sessionUserId} currentUserName={sessionUserName} />}
      {tab === "profile" && <ProfileTab client={client} isCoach={false} />}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null); const [profile, setProfile] = useState(null); const [role, setRole] = useState(null);
  const [booting, setBooting] = useState(true); const [adminMode, setAdminMode] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem("sc_session");
    if (stored) { try { const s = JSON.parse(stored); setSession(s.session); setProfile(s.profile); setRole(s.role); } catch (e) { localStorage.removeItem("sc_session"); } }
    setBooting(false);
  }, []);
  const login = async (email, password) => {
    const data = await authSignIn(email, password);
    const token = data.access_token; const userId = data.user.id;
    const coaches = await dbGet("coaches", `id=eq.${userId}`);
    if (coaches?.length) { const prof = { ...coaches[0] }; const s = { session: { token, userId, email }, profile: prof, role: "coach" }; localStorage.setItem("sc_session", JSON.stringify(s)); setSession({ token, userId, email }); setProfile(prof); setRole("coach"); return; }
    const clients = await dbGet("clients", `id=eq.${userId}`);
    if (clients?.length) { const prof = { ...clients[0] }; const s = { session: { token, userId, email }, profile: prof, role: "client" }; localStorage.setItem("sc_session", JSON.stringify(s)); setSession({ token, userId, email }); setProfile(prof); setRole("client"); return; }
    throw new Error("No profile found for this account.");
  };
  const logout = async () => { if (session?.token) await authSignOut(session.token).catch(() => {}); localStorage.removeItem("sc_session"); setSession(null); setProfile(null); setRole(null); };
  if (booting) return <><style>{css}</style><Loading /></>;
  if (!session || !role) return <><style>{css}</style><AuthScreen onLogin={login} /></>;
  if (role === "coach" && profile?.status === "pending") return <><style>{css}</style><Nav name={profile.name} email={session.email} role="coach" onLogout={logout} adminMode={false} onToggleAdmin={() => {}} /><PendingScreen onLogout={logout} /></>;
  const isAdmin = ADMIN_EMAILS.includes(session.email) && role === "coach";
  return (
    <><style>{css}</style>
    <Nav name={profile.name} email={session.email} role={role} onLogout={logout} adminMode={adminMode} onToggleAdmin={() => setAdminMode(m => !m)} />
    <div className="wrap">
      {isAdmin && adminMode && <AdminPanel token={session.token} />}
      {role === "coach" && (!isAdmin || !adminMode) && <CoachDash coach={profile} token={session.token} sessionUserId={session.userId} sessionUserName={profile.name} />}
      {role === "client" && <ClientPortal client={profile} sessionUserId={session.userId} sessionUserName={profile.name} />}
    </div></>
  );
}
