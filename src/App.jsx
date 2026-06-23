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
async function authRefresh(refreshToken) {
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { "apikey": SB_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refreshToken }) });
  const d = await r.json();
  if (!r.ok) throw new Error("Session expired.");
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
  .tabs { display: flex; gap: 3px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--r); padding: 3px; width: 100%; margin-bottom: 24px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
  .tabs::-webkit-scrollbar { display: none; }
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
  .cal-empty { text-align: center; padding: 20px; color: var(--dim); font-size: 13px; }
  /* HOME SCREEN */
  .home-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
  .home-left { display: flex; flex-direction: column; gap: 18px; }
  .home-right { display: flex; flex-direction: column; gap: 18px; }
  .home-section { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 20px; }
  .home-section-title { font-family: "Barlow Condensed", sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
  .glance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .glance-item { background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; }
  .glance-val { font-family: "Barlow Condensed", sans-serif; font-size: 28px; font-weight: 900; color: var(--acc); line-height: 1; }
  .glance-lbl { font-size: 10px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px; }
  .today-session { background: var(--acc-dim); border: 1px solid rgba(212,240,0,0.2); border-radius: var(--r); padding: 14px 16px; }
  .today-session-type { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--acc); margin-bottom: 4px; }
  .today-session-title { font-size: 15px; font-weight: 600; color: var(--text); }
  .today-session-none { font-size: 13px; color: var(--dim); font-style: italic; }
  .feed-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .feed-item:last-child { border-bottom: none; padding-bottom: 0; }
  .feed-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .feed-body { flex: 1; }
  .feed-text { font-size: 13px; color: var(--text); line-height: 1.5; }
  .feed-time { font-size: 11px; color: var(--dim); margin-top: 2px; }
  .news-item { padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; text-decoration: none; display: block; }
  .news-item:last-child { border-bottom: none; padding-bottom: 0; }
  .news-title { font-size: 13px; color: var(--text); line-height: 1.5; font-weight: 500; transition: color 0.15s; }
  .news-item:hover .news-title { color: var(--acc); }
  .news-meta { font-size: 11px; color: var(--dim); margin-top: 3px; }
  .resource-cat { margin-bottom: 16px; }
  .resource-cat-title { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .resource-link { display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); text-decoration: none; margin-bottom: 6px; transition: border-color 0.15s; }
  .resource-link:hover { border-color: rgba(212,240,0,0.3); }
  .resource-link-icon { font-size: 16px; flex-shrink: 0; }
  .resource-link-text { flex: 1; }
  .resource-link-title { font-size: 13px; color: var(--text); font-weight: 500; }
  .resource-link-url { font-size: 11px; color: var(--dim); margin-top: 1px; }
  .resource-link-arrow { color: var(--dim); font-size: 12px; }
  .add-resource-form { background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; margin-top: 12px; }
  /* SESSION RESOURCES */
  .sess-resource { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); text-decoration: none; margin-top: 8px; transition: border-color 0.15s; }
  .sess-resource:hover { border-color: rgba(212,240,0,0.3); }
  .sess-resource-title { font-size: 12px; color: var(--acc); flex: 1; }
  .sess-resource-del { background: none; border: none; color: var(--dim); cursor: pointer; font-size: 14px; padding: 0; }
  .sess-resource-del:hover { color: var(--red); }
  /* REMEMBER ME */
  .remember-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; margin-bottom: 4px; }
  .remember-check { width: 16px; height: 16px; accent-color: var(--acc); cursor: pointer; }
  .remember-label { font-size: 12px; color: var(--muted); cursor: pointer; }
  .discovery-wrap { max-width: 1080px; margin: 0 auto; padding: 32px 28px; }
  .discovery-hero { text-align: center; padding: 40px 20px 32px; }
  .discovery-logo { font-family: "Barlow Condensed", sans-serif; font-size: 36px; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; color: var(--acc); margin-bottom: 8px; }
  .discovery-sub { font-size: 14px; color: var(--muted); margin-bottom: 28px; }
  .discovery-search { max-width: 480px; margin: 0 auto 36px; }
  .coach-discover-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
  .coach-discover-card { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 22px; transition: border-color 0.15s, transform 0.12s; }
  .coach-discover-card:hover { border-color: rgba(212,240,0,0.3); transform: translateY(-1px); }
  .coach-disc-name { font-family: "Barlow Condensed", sans-serif; font-size: 21px; font-weight: 800; margin-bottom: 8px; }
  .coach-disc-bio { font-size: 13px; color: var(--muted); line-height: 1.55; margin-bottom: 14px; min-height: 40px; }
  .coach-disc-meta { font-size: 11px; color: var(--dim); margin-bottom: 14px; }
  .btn-request { width: 100%; background: var(--acc); color: #0a0a0c; border: none; border-radius: var(--r); padding: 10px; font-family: "Barlow Condensed", sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; }
  .btn-request:hover { opacity: 0.88; } .btn-request:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-request.sent { background: var(--green-dim); color: var(--green); border: 1px solid rgba(0,232,154,0.2); cursor: default; }
  .client-reg-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--bg); }

  /* COACH INBOX */
  .inbox-item { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 18px 20px; display: flex; gap: 16px; align-items: flex-start; transition: border-color 0.15s; cursor: pointer; }
  .inbox-item:hover { border-color: rgba(212,240,0,0.3); }
  .inbox-client { font-family: "Barlow Condensed", sans-serif; font-size: 16px; font-weight: 800; letter-spacing: 0.02em; }
  .inbox-week { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .inbox-preview { font-size: 13px; color: var(--muted); margin-top: 6px; line-height: 1.5; }
  .inbox-rating { font-family: "Barlow Condensed", sans-serif; font-size: 28px; font-weight: 900; color: var(--acc); line-height: 1; text-align: right; flex-shrink: 0; }
  .inbox-rating-lbl { font-size: 9px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }

  /* LEVEL TREND */
  .level-chart-wrap { background: var(--surf2); border-radius: var(--r); padding: 16px; margin-bottom: 16px; }
  .level-chart-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
  .level-chart { position: relative; height: 100px; }
  .level-snapshot-form { display: flex; gap: 10px; align-items: flex-end; margin-top: 12px; }
  .level-big { font-family: "Barlow Condensed", sans-serif; font-size: 48px; font-weight: 900; color: var(--acc); line-height: 1; }
  .level-lbl { font-size: 10px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }

  /* WORKOUTS LIBRARY */
  .workout-card { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 18px 20px; }
  .workout-card-name { font-family: "Barlow Condensed", sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 4px; }
  .workout-card-desc { font-size: 13px; color: var(--muted); margin-bottom: 12px; }
  .workout-exercise-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .workout-exercise-row:last-child { border-bottom: none; }
  .workout-ex-name { font-size: 13px; font-weight: 500; flex: 1; }
  .workout-ex-sets { font-size: 12px; color: var(--muted); }
  .workout-actions { display: flex; gap: 8px; margin-top: 14px; }

  /* CALENDAR MONTH NAV */
  .cal-month-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .cal-month-title { font-family: "Barlow Condensed", sans-serif; font-size: 22px; font-weight: 800; letter-spacing: 0.03em; }
  .cal-month-summary { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
  .cal-summary-pill { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
  .cal-nav-btn { background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 6px 14px; color: var(--muted); font-family: "Barlow Condensed", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
  .cal-nav-btn:hover { border-color: var(--muted); color: var(--text); }
  .cal-today-btn { background: var(--acc-dim); border: 1px solid rgba(212,240,0,0.2); border-radius: var(--r); padding: 6px 14px; color: var(--acc); font-family: "Barlow Condensed", sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; letter-spacing: 0.05em; text-transform: uppercase; }

  /* CHECKIN HOME CARD */
  .checkin-home-card { background: var(--surf); border: 1px solid var(--border); border-radius: var(--rl); padding: 20px; margin-bottom: 18px; }
  .checkin-home-submitted { background: var(--green-dim); border: 1px solid rgba(0,232,154,0.2); border-radius: var(--r); padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
  .checkin-home-submitted-icon { font-size: 20px; }
  .checkin-home-submitted-text { font-size: 13px; color: var(--green); }

  /* MATCH STATS */
  .match-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
  .match-stat-card { background: var(--surf2); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; text-align: center; }
  .match-stat-n { font-family: "Barlow Condensed", sans-serif; font-size: 32px; font-weight: 900; color: var(--acc); line-height: 1; }
  .match-stat-l { font-size: 10px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px; }

  /* CLIENT INFO (merged profile+notes) */
  .client-info-section { margin-bottom: 24px; }
  .client-info-section-title { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  @media (max-width: 780px) { .coach-discover-grid { grid-template-columns: 1fr; } .discovery-wrap { padding: 20px 14px; } }
  @media (max-width: 780px) {
    .home-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 780px) {
    .cal-grid { grid-template-columns: repeat(7, 1fr) !important; }
  }
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
function Loading() { return <div className="loading"><div className="loading-logo">VolleyReady</div><Spin /></div>; }

function AuthScreen({ onLogin, onPlayerRegister }) {
  const [tab, setTab] = useState("login");
  const [f, setF] = useState({ email: "", password: "", name: "", bio: "" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [busy, setBusy] = useState(false); const [showReset, setShowReset] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const login = async () => {
    if (!f.email || !f.password) { setErr("Please fill in all fields."); return; }
    setBusy(true); setErr("");
    try { await onLogin(f.email.trim().toLowerCase(), f.password, f.remember); } catch (e) { setErr(e.message); }
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
        <div className="auth-logo">VolleyReady</div>
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
  const firstName = name?.split(" ")[0] || name;
  return (
    <nav className="nav">
      <div className="nav-logo">VolleyReady<em>/ {isAdmin && adminMode ? "Admin" : role === "coach" ? "Coach" : "Player"}</em><span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(212,240,0,0.15)", color: "var(--acc)", border: "1px solid rgba(212,240,0,0.25)", borderRadius: 20, padding: "2px 6px", marginLeft: 8, verticalAlign: "middle" }}>Beta</span></div>
      <div className="nav-r">
        <div className="nav-name"><b>{firstName}</b>{isAdmin && adminMode && <span className="pill pill-admin">Admin</span>}{role === "coach" && !adminMode && <span className="pill pill-coach">Coach</span>}</div>
        {isAdmin && <button className="nav-out" onClick={onToggleAdmin}>{adminMode ? "→ Coach" : "→ Admin"}</button>}
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
  const [err, setErr] = useState("");
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true); setErr("");
    try {
      await dbInsert("client_profiles", { client_id: client.id, ...f });
      onSaved(f);
      onClose();
    } catch (e) { setErr("Save failed — please try again."); }
    setBusy(false);
  };
  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="modal-title">Complete Your Profile</div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, lineHeight: 1.6 }}>This helps your coach build the right programme for you. Takes 2 minutes.</p>
        {err && <div className="flash-err">{err}</div>}
        <div className="row2">
          <div><label className="e-lbl">Squash Level</label><input className="e-inp" type="number" placeholder="e.g. 5240" value={f.squashlevels_rating} onChange={e => s("squashlevels_rating", e.target.value)} /></div>
          <div><label className="e-lbl">Peak Rating</label><input className="e-inp" type="number" placeholder="e.g. 6100" value={f.peak_rating} onChange={e => s("peak_rating", e.target.value)} /></div>
        </div>
        <div className="fld"><label className="e-lbl">Squash Level Profile URL (optional) (optional)</label><input className="e-inp" placeholder="https://squashlevels.com/players/..." value={f.squashlevels_url} onChange={e => s("squashlevels_url", e.target.value)} /></div>
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
      <div className="no-prog-s" style={{ lineHeight: 1.7 }}>{isCoach ? "Click below to create a programme for this client." : "Your coach hasn't added your programme yet — you'll get a notification when it's ready. In the meantime, fill in your profile so they know what to build."}</div>
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
      {upcoming.length > 0 && (<><div className="sec-lbl">Upcoming</div><div className="sch-list" style={{ marginBottom: 24 }}>{upcoming.map(ev => (<div className="sch-item" key={ev.id}><div className={`sch-type sch-${ev.event_type.split(" ")[0].replace("/","")}`}>{ev.event_type}</div><div className="sch-dates">{ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} → ${ev.end_date}`}</div>{ev.note && <div className="sch-note">{ev.note}</div>}{!isCoach && <button className="sch-delete" onClick={async () => { if (window.confirm(`Remove "${ev.event_type}" event?`)) { await dbDelete("schedule_events", `id=eq.${ev.id}`); setEvents(e => e.filter(x => x.id !== ev.id)); } }}>×</button>}</div>))}</div></>)}
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
  // Poll for new messages every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const latest = await dbGet("messages", `client_id=eq.${client.id}&order=created_at.asc`);
        if (latest?.length !== msgs.length) setMsgs(latest || []);
      } catch (e) { }
    }, 15000);
    return () => clearInterval(interval);
  }, [client.id, msgs.length]);
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
  // Level snapshots for trend
  const [levelSnaps, setLevelSnaps] = useState([]);
  useEffect(() => {
    (async () => { try { setLevelSnaps(await dbGet("level_snapshots", `client_id=eq.${client.id}&order=created_at.asc`) || []); } catch(e){} })();
  }, [client.id]);

  if (loading) return <div className="empty"><Spin /> Loading matches...</div>;
  return (
    <div>
      {matches.length > 0 && <MatchStats matches={matches} />}
      {levelSnaps.length > 1 && <LevelTrendChart snapshots={levelSnaps} />}
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
                <div><label className="e-lbl">Squash Level</label><input className="e-inp" type="number" placeholder="e.g. 5240" value={f.my_rating} onChange={e => s("my_rating", e.target.value)} /></div>
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
                <div><label className="e-lbl">Squash Level</label><input className="e-inp" type="number" placeholder="e.g. 4800" value={f.opponent_rating} onChange={e => s("opponent_rating", e.target.value)} /></div>
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
                  {m.my_rating && <div className="match-player-rating">Level: {parseInt(m.my_rating).toLocaleString()}</div>}
                  {hasChange && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, fontWeight: 600 }}>{m.my_rating_change}</div>}
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
                  {m.opponent_rating && <div className="match-player-rating">Level: {parseInt(m.opponent_rating).toLocaleString()}</div>}
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
          <div className="rating-label">Current Squash Level</div>
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


// ─── CALENDAR HELPERS ────────────────────────────────────────────────────────
function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function toDateStr(date) { return date.toISOString().slice(0,10); }
function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
function formatDateShort(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function isToday(dateStr) { return dateStr === toDateStr(new Date()); }
function isPast(dateStr) { return dateStr < toDateStr(new Date()); }

const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SESSION_TYPES = ["Squash","Squash Conditioning","Rest","Match","Recovery"];
const SESSION_COLORS = {
  "Squash": "var(--squash)",
  "Squash Conditioning": "var(--gym)",
  "Rest": "var(--rest)",
  "Match": "#ff9500",
  "Recovery": "#aa88ff",
};

// ─── DAY MODAL ────────────────────────────────────────────────────────────────
function DayModal({ dateStr, session, events, log, isCoach, clientName, onClose, onSaveSession, onSaveLog, onFlag }) {
  const past = isPast(dateStr) && !isToday(dateStr);
  const today = isToday(dateStr);
  const [view, setView] = useState(past || today ? (log ? "log" : isCoach ? "session" : "log") : "session");
  const [sessForm, setSessForm] = useState(session || { type: "Squash", title: "", details: "" });
  const [logForm, setLogForm] = useState(log || { what: "", feeling: null, note: "" });
  const [flagNote, setFlagNote] = useState("");
  const [showFlag, setShowFlag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const dayEvents = events.filter(e => e.start_date <= dateStr && e.end_date >= dateStr);

  const saveSession = async () => {
    setBusy(true);
    await onSaveSession(dateStr, sessForm);
    setSaved(true); setBusy(false);
    setTimeout(() => onClose(), 600);
  };

  const saveLog = async () => {
    if (!logForm.what) return;
    setBusy(true);
    await onSaveLog(dateStr, logForm);
    setSaved(true); setBusy(false);
    setTimeout(() => onClose(), 600);
  };

  const submitFlag = async () => {
    if (!flagNote.trim()) return;
    setBusy(true);
    await onFlag(dateStr, flagNote.trim());
    setBusy(false);
    setShowFlag(false);
    onClose();
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: "0.03em", textTransform: "uppercase" }}>{formatDate(dateStr)}</div>
            {today && <div style={{ fontSize: 11, color: "var(--acc)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today</div>}
          </div>
          <button style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }} onClick={onClose}>×</button>
        </div>

        {dayEvents.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {dayEvents.map(ev => (
              <div key={ev.id} style={{ background: "var(--amber-dim)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: "var(--r)", padding: "8px 12px", fontSize: 12, color: "var(--amber)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span>📅</span> {ev.event_type}{ev.note ? ` — ${ev.note}` : ""}
              </div>
            ))}
          </div>
        )}

        {!showFlag && (
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surf2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 3 }}>
            <button className={`t ${view === "session" ? "on" : ""}`} style={{ flex: 1 }} onClick={() => setView("session")}>Session Plan</button>
            {(past || today) && <button className={`t ${view === "log" ? "on" : ""}`} style={{ flex: 1 }} onClick={() => setView("log")}>{past ? "Log" : "Today's Log"}</button>}
          </div>
        )}

        {saved && <div className="flash-ok">Saved ✓</div>}

        {view === "session" && !showFlag && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label className="e-lbl">Session Type</label>
              <select className="e-inp e-sel" value={sessForm.type} onChange={e => setSessForm(f => ({ ...f, type: e.target.value }))}>
                {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="e-lbl">Session Title</label>
              <input className="e-inp" placeholder="e.g. Solo Drilling, Ghosting Sets..." value={sessForm.title} onChange={e => setSessForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="e-lbl">Details</label>
              <textarea className="e-ta" style={{ minHeight: 90 }} placeholder="Sets, reps, drills, focus points..." value={sessForm.details} onChange={e => setSessForm(f => ({ ...f, details: e.target.value }))} />
            </div>
            {isCoach && (
              <div style={{ marginBottom: 16 }}>
                <label className="e-lbl">Resource Link (optional)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="e-inp" placeholder="YouTube or any URL..." value={sessForm.resourceUrl || ""} onChange={e => setSessForm(f => ({ ...f, resourceUrl: e.target.value }))} style={{ flex: 1 }} />
                  <input className="e-inp" placeholder="Label" value={sessForm.resourceLabel || ""} onChange={e => setSessForm(f => ({ ...f, resourceLabel: e.target.value }))} style={{ width: 140 }} />
                </div>
              </div>
            )}
            {!isCoach && session?.resource_url && (
              <a href={session.resource_url} target="_blank" rel="noopener noreferrer" className="sess-resource">
                <span>{getIcon(session.resource_url)}</span>
                <span className="sess-resource-title">{session.resource_label || session.resource_url}</span>
                <span>→</span>
              </a>
            )}
            {isCoach ? (
              <div className="ed-actions">
                <button className="btn-save" onClick={saveSession} disabled={busy}>{busy ? <><Spin />Saving...</> : "Save Session"}</button>
                <button className="btn-cancel" onClick={onClose}>Cancel</button>
              </div>
            ) : (
              <div>
                {!past && <button className="btn-ghost" style={{ width: "auto", marginTop: 0 }} onClick={() => setShowFlag(true)}>🚩 Flag this session</button>}
              </div>
            )}
          </div>
        )}

        {view === "log" && !showFlag && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label className="e-lbl">What did you do?</label>
              <input className="e-inp" placeholder="e.g. Solo hit, 40 min ghosting, Rest day taken..." value={logForm.what} onChange={e => setLogForm(f => ({ ...f, what: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="e-lbl">How did it feel? (1–5)</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} className={`r-btn ${logForm.feeling === n ? "on" : ""}`} onClick={() => setLogForm(f => ({ ...f, feeling: n }))} style={{ width: 44, height: 44 }}>
                    {["😣","😕","😐","🙂","💪"][n-1]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="e-lbl">Note for coach (optional)</label>
              <textarea className="e-ta" style={{ minHeight: 65 }} placeholder="Anything worth flagging — energy levels, what felt hard, what went well..." value={logForm.note} onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="ed-actions">
              <button className="btn-save" onClick={saveLog} disabled={!logForm.what || busy}>{busy ? <><Spin />Saving...</> : "Save Log"}</button>
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {showFlag && (
          <div>
            <div style={{ marginBottom: 12, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>Tell your coach why you need to change this session. They'll adjust the programme accordingly.</div>
            <div style={{ marginBottom: 16 }}>
              <label className="e-lbl">What's the issue?</label>
              <textarea className="e-ta" style={{ minHeight: 80 }} placeholder="e.g. Away this day, legs too heavy, have a match instead..." value={flagNote} onChange={e => setFlagNote(e.target.value)} />
            </div>
            <div className="ed-actions">
              <button className="btn-save" onClick={submitFlag} disabled={!flagNote.trim() || busy}>{busy ? <><Spin />Sending...</> : "Send to Coach"}</button>
              <button className="btn-cancel" onClick={() => setShowFlag(false)}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CALENDAR TAB ─────────────────────────────────────────────────────────────
function CalendarTab({ client, isCoach, sessionUserId, sessionUserName }) {
  const today = toDateStr(new Date());
  const [viewMonth, setViewMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const monthStart = toDateStr(viewMonth);
  const monthEnd = toDateStr(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0));
  const isCurrentMonth = viewMonth.getMonth() === new Date().getMonth() && viewMonth.getFullYear() === new Date().getFullYear();

  // Build days for the month view (pad to full weeks)
  const firstDow = viewMonth.getDay() === 0 ? 6 : viewMonth.getDay() - 1; // Mon=0
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const calDays = [];
  for (let i = 0; i < firstDow; i++) {
    calDays.push(toDateStr(addDays(viewMonth, i - firstDow)));
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calDays.push(toDateStr(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i)));
  }
  while (calDays.length % 7 !== 0) calDays.push(toDateStr(addDays(new Date(calDays[calDays.length-1]), 1)));

  const [sessions, setSessions] = useState({});
  const [logs, setLogs] = useState({});
  const [events, setEvents] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(null);

  const padStart = calDays[0];
  const padEnd = calDays[calDays.length-1];

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [sessList, logsList, eventsList, flagsList] = await Promise.all([
          dbGet("calendar_sessions", `client_id=eq.${client.id}&date=gte.${padStart}&date=lte.${padEnd}`),
          dbGet("session_logs", `client_id=eq.${client.id}&date=gte.${padStart}&date=lte.${padEnd}`),
          dbGet("schedule_events", `client_id=eq.${client.id}&start_date=lte.${padEnd}&end_date=gte.${padStart}`),
          dbGet("session_flags", `client_id=eq.${client.id}&resolved=eq.false`),
        ]);
        const sessMap = {};
        (sessList || []).forEach(s => { sessMap[s.date] = s; });
        setSessions(sessMap);
        const logMap = {};
        (logsList || []).forEach(l => { logMap[l.date] = l; });
        setLogs(logMap);
        setEvents(eventsList || []);
        setFlags(flagsList || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id, viewMonth]);

  const saveSession = async (dateStr, form) => {
    try {
      const existing = sessions[dateStr];
      const payload = { type: form.type, title: form.title, details: form.details, resource_url: form.resourceUrl || null, resource_label: form.resourceLabel || null };
      if (existing) {
        await dbUpdate("calendar_sessions", `id=eq.${existing.id}`, payload);
        setSessions(s => ({ ...s, [dateStr]: { ...existing, ...form, ...payload } }));
      } else {
        const ns = await dbInsert("calendar_sessions", { client_id: client.id, coach_id: client.coach_id, date: dateStr, ...payload });
        setSessions(s => ({ ...s, [dateStr]: ns }));
      }
    } catch (e) { }
  };

  const saveLog = async (dateStr, form) => {
    try {
      const existing = logs[dateStr];
      if (existing) {
        await dbUpdate("session_logs", `id=eq.${existing.id}`, { what: form.what, feeling: form.feeling, note: form.note });
        setLogs(l => ({ ...l, [dateStr]: { ...existing, ...form } }));
      } else {
        const nl = await dbInsert("session_logs", { client_id: client.id, coach_id: client.coach_id, date: dateStr, what: form.what, feeling: form.feeling, note: form.note });
        setLogs(l => ({ ...l, [dateStr]: nl }));
      }
    } catch (e) { }
  };

  const saveFlag = async (dateStr, note) => {
    try {
      const nf = await dbInsert("session_flags", { client_id: client.id, coach_id: client.coach_id, date: dateStr, note, resolved: false });
      setFlags(f => [...f, nf]);
    } catch (e) { }
  };

  const resolveFlag = async (flagId) => {
    try {
      await dbUpdate("session_flags", `id=eq.${flagId}`, { resolved: true });
      setFlags(f => f.filter(x => x.id !== flagId));
    } catch (e) { }
  };

  if (loading) return <div className="empty"><Spin /> Loading calendar...</div>;

  const pendingFlags = flags.filter(f => !f.resolved);

  // Group into weeks
  const weeks = [];
  for (let i = 0; i < calDays.length; i += 7) weeks.push(calDays.slice(i, i+7));

  // Monthly summary
  const monthDays = calDays.filter(d => d >= monthStart && d <= monthEnd);
  const summary = monthDays.reduce((acc, d) => {
    const s = sessions[d];
    if (s) { acc[s.type] = (acc[s.type] || 0) + 1; acc.total++; }
    return acc;
  }, { total: 0 });
  const loggedCount = monthDays.filter(d => logs[d]).length;

  const SUMMARY_COLORS = { "Squash": "var(--squash)", "Squash Conditioning": "var(--gym)", "Rest": "var(--rest)", "Match": "#ff9500", "Recovery": "#aa88ff" };

  return (
    <div>
      {activeDay && (
        <DayModal
          dateStr={activeDay}
          session={sessions[activeDay]}
          events={events}
          log={logs[activeDay]}
          isCoach={isCoach}
          clientName={client.name}
          onClose={() => setActiveDay(null)}
          onSaveSession={saveSession}
          onSaveLog={saveLog}
          onFlag={saveFlag}
        />
      )}

      {/* Month navigation */}
      <div className="cal-month-nav">
        <button className="cal-nav-btn" onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}>← Prev</button>
        <div>
          <div className="cal-month-title">{viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
          {summary.total > 0 && (
            <div className="cal-month-summary">
              {Object.entries(summary).filter(([k]) => k !== "total").map(([type, count]) => (
                <span key={type} className="cal-summary-pill" style={{ background: `${SUMMARY_COLORS[type] || "var(--muted)"}22`, color: SUMMARY_COLORS[type] || "var(--muted)", border: `1px solid ${SUMMARY_COLORS[type] || "var(--muted)"}44` }}>{count} {type}</span>
              ))}
              {loggedCount > 0 && <span className="cal-summary-pill" style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,232,154,0.2)" }}>{loggedCount} logged</span>}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isCurrentMonth && <button className="cal-today-btn" onClick={() => setViewMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</button>}
          <button className="cal-nav-btn" onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}>Next →</button>
        </div>
      </div>

      {/* Pending flags banner for coach */}
      {isCoach && pendingFlags.length > 0 && (
        <div style={{ background: "var(--amber-dim)", border: "1px solid rgba(255,170,0,0.25)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber)", marginBottom: 10 }}>🚩 {pendingFlags.length} Session Flag{pendingFlags.length > 1 ? "s" : ""} Pending</div>
          {pendingFlags.map(fl => (
            <div key={fl.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, background: "rgba(0,0,0,0.2)", borderRadius: "var(--r)", padding: "10px 14px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)" }}>{formatDate(fl.date)}</div>
                <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2 }}>{fl.note}</div>
              </div>
              <button className="btn-edit" onClick={() => { setActiveDay(fl.date); }} style={{ marginRight: 6 }}>Adjust</button>
              <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "5px 10px", color: "var(--muted)", fontSize: 11, cursor: "pointer" }} onClick={() => resolveFlag(fl.id)}>Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? <div className="empty"><Spin /> Loading...</div> : weeks.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {week.map(dateStr => {
            const sess = sessions[dateStr];
            const log = logs[dateStr];
            const dayEvents = events.filter(e => e.start_date <= dateStr && e.end_date >= dateStr);
            const flag = flags.find(f => f.date === dateStr && !f.resolved);
            const past = isPast(dateStr) && !isToday(dateStr);
            const todayCell = isToday(dateStr);
            const sessColor = sess ? SESSION_COLORS[sess.type] : null;
            const isThisMonth = dateStr >= monthStart && dateStr <= monthEnd;

            return (
              <div
                key={dateStr}
                onClick={() => setActiveDay(dateStr)}
                style={{
                  background: todayCell ? "rgba(212,240,0,0.08)" : isThisMonth ? "var(--surf)" : "var(--bg)",
                  border: `1px solid ${todayCell ? "rgba(212,240,0,0.4)" : isThisMonth ? "var(--border)" : "var(--border)"}`,
                  borderRadius: "var(--r)",
                  padding: "8px 6px",
                  cursor: "pointer",
                  opacity: !isThisMonth ? 0.35 : past ? 0.7 : 1,
                  height: 80,
                  position: "relative",
                  transition: "border-color 0.15s, transform 0.1s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  overflow: "hidden",
                }}
                onMouseEnter={e => { if (isThisMonth) { e.currentTarget.style.borderColor = "rgba(212,240,0,0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor = todayCell ? "rgba(212,240,0,0.4)" : "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: todayCell ? "var(--acc)" : isThisMonth ? "var(--muted)" : "var(--dim)" }}>
                  {new Date(dateStr + "T12:00:00").getDate()}
                </div>
                {sess && isThisMonth && (
                  <div style={{ background: `${sessColor}22`, border: `1px solid ${sessColor}44`, borderRadius: 3, padding: "2px 5px", fontSize: 9, fontWeight: 700, color: sessColor, letterSpacing: "0.04em", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {sess.title ? sess.title.slice(0,12) + (sess.title.length > 12 ? "…" : "") : sess.type}
                  </div>
                )}
                {dayEvents.length > 0 && isThisMonth && (
                  <div style={{ background: "var(--amber-dim)", border: "1px solid rgba(255,170,0,0.3)", borderRadius: 3, padding: "2px 5px", fontSize: 9, fontWeight: 700, color: "var(--amber)", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {dayEvents[0].event_type.split(" ")[0].slice(0,8)}
                  </div>
                )}
                {log && isThisMonth && (
                  <div style={{ fontSize: 12, lineHeight: 1 }}>{["😣","😕","😐","🙂","💪"][(log.feeling||1) - 1]}</div>
                )}
                {flag && isThisMonth && <div style={{ position: "absolute", top: 4, right: 4, fontSize: 10 }}>🚩</div>}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ marginTop: 16, fontSize: 12, color: "var(--dim)", lineHeight: 1.7 }}>
        {isCoach ? "Click any day to add or edit a session. Past months are viewable for history." : "Click any day to see your session or log what you did."}
      </div>
    </div>
  );
}


// ─── RSS NEWS ──────────────────────────────────────────────────────────────
const RSS_FEEDS = [
  { name: "Squash Mad", url: "https://squashmad.com/feed" },
  { name: "World Squash", url: "https://worldsquash.org/feed" },
  { name: "The Squash Site", url: "https://thesquashsite.com/feed" },
];

function NewsSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = [];
        for (const feed of RSS_FEEDS) {
          try {
            const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=5`);
            const d = await r.json();
            if (d.status === "ok" && d.items) {
              d.items.forEach(item => all.push({ title: item.title, link: item.link, date: item.pubDate?.slice(0,10), source: feed.name }));
            }
          } catch (e) { }
        }
        all.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
        setArticles(all.slice(0, 8));
      } catch (e) { }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="home-section">
      <div className="home-section-title">Squash News</div>
      {loading ? <div style={{ fontSize: 13, color: "var(--dim)" }}><Spin /> Loading news...</div>
        : articles.length === 0 ? <div style={{ fontSize: 13, color: "var(--dim)" }}>No news available right now.</div>
        : articles.map((a, i) => (
          <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="news-item">
            <div className="news-title">{a.title}</div>
            <div className="news-meta">{a.source}{a.date ? ` · ${a.date}` : ""}</div>
          </a>
        ))
      }
    </div>
  );
}

// ─── RESOURCE LIBRARY ─────────────────────────────────────────────────────
const RESOURCE_CATS = ["Core", "Glutes & Hips", "Hamstrings & Knee", "Plyometrics & Power", "Hip Flexors & Mobility", "Recovery & Foam Rolling", "Nutrition", "Mental Game", "Match Play & Tactics", "Squash Technique", "General"];

function getIcon(url) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "▶️";
  if (url.includes("instagram.com")) return "📸";
  if (url.includes("pdf")) return "📄";
  return "🔗";
}

function ResourceLibrary({ isAdmin }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ title: "", url: "", category: "Conditioning", description: "" });
  const [busy, setBusy] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setResources(await dbGet("resources", "order=category.asc,title.asc") || []); }
      catch (e) { }
      setLoading(false);
    })();
  }, []);

  const add = async () => {
    if (!f.title || !f.url) return;
    setBusy(true);
    try {
      const nr = await dbInsert("resources", { title: f.title, url: f.url, category: f.category, description: f.description });
      setResources(rs => [...rs, nr].sort((a,b) => a.category.localeCompare(b.category)));
      setShowForm(false); setF({ title: "", url: "", category: "Conditioning", description: "" });
    } catch (e) { }
    setBusy(false);
  };

  const remove = async (id) => {
    await dbDelete("resources", `id=eq.${id}`);
    setResources(rs => rs.filter(r => r.id !== id));
  };

  const grouped = RESOURCE_CATS.reduce((acc, cat) => {
    const items = resources.filter(r => r.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const [openCats, setOpenCats] = useState({});
  const toggleCat = (cat) => setOpenCats(o => ({ ...o, [cat]: !o[cat] }));

  if (loading) return <div className="empty"><Spin /> Loading resources...</div>;

  return (
    <div>
      {isAdmin && !showForm && <button className="btn-edit" style={{ marginBottom: 20 }} onClick={() => setShowForm(true)}>+ Add Resource</button>}
      {isAdmin && showForm && (
        <div className="add-resource-form" style={{ marginBottom: 20 }}>
          <div className="row2">
            <div><label className="e-lbl">Title</label><input className="e-inp" placeholder="e.g. Copenhagen Plank Tutorial" value={f.title} onChange={e => s("title", e.target.value)} /></div>
            <div><label className="e-lbl">Category</label>
              <select className="e-inp e-sel" value={f.category} onChange={e => s("category", e.target.value)}>
                {RESOURCE_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}><label className="e-lbl">URL</label><input className="e-inp" placeholder="https://youtube.com/..." value={f.url} onChange={e => s("url", e.target.value)} /></div>
          <div style={{ marginBottom: 14 }}><label className="e-lbl">Description (optional)</label><input className="e-inp" placeholder="Brief description..." value={f.description} onChange={e => s("description", e.target.value)} /></div>
          <div className="ed-actions">
            <button className="btn-save" onClick={add} disabled={!f.title || !f.url || busy}>{busy ? <><Spin />Saving...</> : "Add Resource"}</button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {Object.keys(grouped).length === 0 && <div className="empty"><div className="empty-icon">📚</div>No resources yet.</div>}
      {Object.entries(grouped).map(([cat, items]) => (
        <div className="resource-cat" key={cat} style={{ marginBottom: 6 }}>
          <button onClick={() => toggleCat(cat)} style={{ width: "100%", background: "var(--surf2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: openCats[cat] ? 8 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>{cat}</span>
              <span style={{ fontSize: 10, color: "var(--dim)", background: "var(--border)", borderRadius: 20, padding: "2px 7px" }}>{items.length}</span>
            </div>
            <span style={{ color: "var(--dim)", fontSize: 12 }}>{openCats[cat] ? "▲" : "▼"}</span>
          </button>
          {openCats[cat] && items.map(r => (
            <div key={r.id} style={{ position: "relative", marginBottom: 6 }}>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                <div className="resource-link-icon">{getIcon(r.url)}</div>
                <div className="resource-link-text">
                  <div className="resource-link-title">{r.title}</div>
                  {r.description && <div className="resource-link-url">{r.description}</div>}
                </div>
                <div className="resource-link-arrow">→</div>
              </a>
              {isAdmin && <button style={{ position: "absolute", top: 8, right: 32, background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: 14 }} onClick={() => remove(r.id)}>×</button>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── CLIENT HOME SCREEN ────────────────────────────────────────────────────
function ClientHome({ client }) {
  const [prog, setProg] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0,10);
  const blockStart = (() => { const d = new Date(); const day = d.getDay(); const diff = day === 0 ? -6 : 1-day; d.setDate(d.getDate()+diff); return d.toISOString().slice(0,10); })();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [sess, cks, ev, prof, msgs] = await Promise.all([
          dbGet("calendar_sessions", `client_id=eq.${client.id}&date=eq.${today}`),
          dbGet("checkins", `client_id=eq.${client.id}&order=created_at.desc&limit=3`),
          dbGet("schedule_events", `client_id=eq.${client.id}&end_date=gte.${today}&order=start_date.asc&limit=3`),
          dbGet("client_profiles", `client_id=eq.${client.id}&limit=1`),
          dbGet("messages", `client_id=eq.${client.id}&order=created_at.desc&limit=5`),
        ]);
        setProg(sess?.[0] || null);
        setCheckins(cks || []);
        setEvents(ev || []);
        setProfile(prof?.[0] || null);
        setMessages(msgs || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id]);

  // Build activity feed
  const rawFeed = [];
  checkins.forEach(c => {
    const wk = c.week_label && c.week_label !== "—" ? c.week_label : "recent";
    if (c.coach_response) rawFeed.push({ id: `ck-resp-${c.id}`, icon: "💬", text: `Coach responded to your ${wk} check-in`, time: c.responded_at?.slice(0,10) || c.created_at?.slice(0,10) });
    else rawFeed.push({ id: `ck-sub-${c.id}`, icon: "📋", text: `You submitted your ${wk} check-in`, time: c.created_at?.slice(0,10) });
  });
  messages.slice(0,3).forEach(m => {
    rawFeed.push({ id: `msg-${m.id}`, icon: "✉️", text: `${m.sender_name}: ${m.body.slice(0,60)}${m.body.length > 60 ? "..." : ""}`, time: m.created_at?.slice(0,10) });
  });
  rawFeed.sort((a,b) => (b.time || "").localeCompare(a.time || ""));
  const dismissKey = `vr_dismissed_${client.id}`;
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(dismissKey) || "[]"); } catch { return []; }
  });
  const dismiss = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    try { localStorage.setItem(dismissKey, JSON.stringify(updated)); } catch {}
  };
  const feed = rawFeed.filter(f => !dismissed.includes(f.id));

  if (loading) return <div className="empty" style={{ marginTop: 60 }}><Spin /> Loading...</div>;

  return (
    <div>
      <div className="hero">
        <div>
          <div className="hero-greet">Welcome back,<br /><span>{client.name.split(" ")[0]}.</span></div>
          <div className="hero-goal">{client.goal}</div>
        </div>
        <div className="hero-wk">
          <div className="hero-wk-n">{profile?.squashlevels_rating ? parseInt(profile.squashlevels_rating).toLocaleString() : "—"}</div>
          <div className="hero-wk-l">Squash Level</div>
        </div>
      </div>

      <div className="home-grid">
        <div className="home-left">
          {/* At a glance */}
          <div className="home-section">
            <div className="home-section-title">At a Glance</div>
            <div style={{ marginBottom: 12 }}>
              {prog ? (
                <div className="today-session">
                  <div className="today-session-type">Today · {prog.type}</div>
                  <div className="today-session-title">{prog.title || prog.type}</div>
                </div>
              ) : (
                <div className="today-session" style={{ background: "var(--surf2)", border: "1px solid var(--border)" }}>
                  <div className="today-session-type">Today</div>
                  <div className="today-session-none">No session scheduled — check your calendar.</div>
                </div>
              )}
            </div>
            <div className="glance-grid">
              {events.length > 0 && (
                <div className="glance-item" style={{ gridColumn: "1/-1", background: "var(--amber-dim)", borderColor: "rgba(255,170,0,0.2)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--amber)", marginBottom: 4 }}>📅 Upcoming</div>
                  {events.map(e => <div key={e.id} style={{ fontSize: 12, color: "var(--amber)", marginTop: 2 }}>{e.event_type} — {e.start_date}{e.start_date !== e.end_date ? ` → ${e.end_date}` : ""}</div>)}
                </div>
              )}
              {checkins[0] && (
                <div className="glance-item">
                  <div className="glance-val">{checkins[0].session_rating}<span style={{ fontSize: 16, color: "var(--muted)" }}>/10</span></div>
                  <div className="glance-lbl">Last Check-in Rating</div>
                </div>
              )}
              {profile?.squashlevels_rating && (
                <div className="glance-item">
                  <div className="glance-val">{parseInt(profile.squashlevels_rating).toLocaleString()}</div>
                  <div className="glance-lbl">Squash Level</div>
                </div>
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div className="home-section">
            <div className="home-section-title">Recent Activity</div>
            {feed.length === 0
              ? <div style={{ fontSize: 13, color: "var(--dim)" }}>No recent activity yet.</div>
              : feed.slice(0,8).map((item) => (
                <div className="feed-item" key={item.id} style={{ alignItems: "flex-start" }}>
                  <div className="feed-icon">{item.icon}</div>
                  <div className="feed-body">
                    <div className="feed-text">{item.text}</div>
                    {item.time && <div className="feed-time">{item.time}</div>}
                  </div>
                  <button onClick={() => dismiss(item.id)} style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: 14, padding: "0 0 0 8px", flexShrink: 0, lineHeight: 1, marginTop: 2 }} title="Dismiss">×</button>
                </div>
              ))
            }
          </div>

          {/* News */}
          <NewsSection />
        </div>

        <div className="home-right">
          {/* Resources */}
          <div className="home-section">
            <div className="home-section-title">Resources <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>— tap a category to expand</span></div>
            <ResourceLibrary isAdmin={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDetail({ client, coachId, coachId: myCoachId, onBack, sessionUserId, sessionUserName }) {
  const [tab, setTab] = useState("programme");
  const [cks, setCks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pendingFlags, setPendingFlags] = useState([]);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0,10);
        const [cs, ev, fl] = await Promise.all([
          dbGet("checkins", `client_id=eq.${client.id}&order=created_at.desc`),
          dbGet("schedule_events", `client_id=eq.${client.id}&end_date=gte.${today}&order=start_date.asc`),
          dbGet("session_flags", `client_id=eq.${client.id}&resolved=eq.false`),
        ]);
        setCks(cs || []); setUpcomingEvents(ev || []); setPendingFlags(fl || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id]);
  const pending = cks.filter(c => !c.coach_response).length;
  const upcoming = upcomingEvents.length;
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
      <div className="tabs" style={{ overflowX: "auto", flexWrap: "nowrap", paddingBottom: 2 }}>
        <button className={`t ${tab === "programme" ? "on" : ""}`} onClick={() => { setTab("programme"); }} style={{ whiteSpace: "nowrap" }}>Calendar</button>
        <button className={`t ${tab === "checkins" ? "on" : ""}`} onClick={() => { setTab("checkins"); setEditing(false); }} style={{ whiteSpace: "nowrap" }}>Check-ins{pending > 0 ? ` (${pending})` : ""}</button>
        <button className={`t ${tab === "schedule" ? "on" : ""}`} onClick={() => { setTab("schedule"); setEditing(false); }} style={{ whiteSpace: "nowrap" }}>Schedule{upcoming > 0 ? ` (${upcoming})` : ""}</button>
        <button className={`t ${tab === "matches" ? "on" : ""}`} onClick={() => { setTab("matches"); setEditing(false); }} style={{ whiteSpace: "nowrap" }}>Matches</button>
        <button className={`t ${tab === "messages" ? "on" : ""}`} onClick={() => { setTab("messages"); setEditing(false); }} style={{ whiteSpace: "nowrap" }}>Messages</button>
        <button className={`t ${tab === "history" ? "on" : ""}`} onClick={() => { setTab("history"); setEditing(false); }} style={{ whiteSpace: "nowrap" }}>History</button>
        <button className={`t ${tab === "profile" ? "on" : ""}`} onClick={() => { setTab("profile"); setEditing(false); }} style={{ whiteSpace: "nowrap" }}>Profile</button>
        <button className={`t ${tab === "notes" ? "on" : ""}`} onClick={() => { setTab("notes"); setEditing(false); }} style={{ whiteSpace: "nowrap" }}>Notes</button>
      </div>
      {loading ? <div className="empty"><Spin /> Loading...</div> : (<>
        {tab === "programme" && <CalendarTab client={client} isCoach sessionUserId={sessionUserId} sessionUserName={sessionUserName} />}
        {tab === "checkins" && <div className="ck-list">{cks.length === 0 ? <div className="empty"><div className="empty-icon">📋</div>No check-ins yet.</div> : cks.map(c => <CkCard key={c.id} ck={c} isCoach onRespond={(id, r) => setCks(cs => cs.map(x => x.id === id ? { ...x, coach_response: r } : x))} />)}</div>}
        {tab === "schedule" && <ScheduleTab client={client} isCoach />}
        {tab === "matches" && <MatchesTab client={client} isCoach clientName={client.name} />}
        {tab === "messages" && <MessagesTab client={client} currentUserId={sessionUserId} currentUserName={sessionUserName} />}
        {tab === "info" && <ClientInfoTab client={client} />}
      </>)}
    </div>
  );
}

function CoachDash({ coach, token, sessionUserId, sessionUserName }) {
  const [clients, setClients] = useState([]); const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true); const [showAdd, setShowAdd] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cls, cks] = await Promise.all([
          dbGet("clients", `coach_id=eq.${coach.id}&order=joined_date.desc`),
          dbGet("checkins", `coach_id=eq.${coach.id}`),
        ]);
        setClients(cls || []);
        const allCks = cks || [];
        setPendingCount(allCks.filter(c => !c.coach_response).length);
        setTotalCheckins(allCks.length);
      } catch (e) { }
      setLoading(false);
    })();
  }, [coach.id]);
  const [coachTab, setCoachTab] = useState("clients");
  const [pendingCount, setPendingCount] = useState(0);
  const [totalCheckins, setTotalCheckins] = useState(0);
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
      <div className="tabs">
        <button className={`t ${coachTab === "clients" ? "on" : ""}`} onClick={() => setCoachTab("clients")}>Clients</button>
        <button className={`t ${coachTab === "inbox" ? "on" : ""}`} onClick={() => setCoachTab("inbox")}>Inbox {pendingCount > 0 ? `(${pendingCount})` : ""}</button>
        <button className={`t ${coachTab === "workouts" ? "on" : ""}`} onClick={() => setCoachTab("workouts")}>Workouts</button>
        <button className={`t ${coachTab === "resources" ? "on" : ""}`} onClick={() => setCoachTab("resources")}>Resources</button>
        <button className={`t ${coachTab === "requests" ? "on" : ""}`} onClick={() => setCoachTab("requests")}>Requests</button>
      </div>
      {coachTab === "requests" && <CoachRequestsPanel coachId={coach.id} />}
      {coachTab === "inbox" && <CoachInbox coachId={coach.id} clients={clients} onSelectClient={(id) => setSel(id)} />}
      {coachTab === "workouts" && <WorkoutsLibrary coachId={coach.id} />}
      {coachTab === "resources" && <ResourceLibrary isAdmin={ADMIN_EMAILS.includes(coach.email)} />}
      {coachTab === "clients" && <><div className="stats stats-3">
        <div className="stat"><div className="stat-n">{clients.length}</div><div className="stat-l">Active Clients</div></div>
        <div className="stat"><div className={`stat-n ${pendingCount > 0 ? "amber" : ""}`}>{pendingCount}</div><div className="stat-l">Pending Responses</div></div>
        <div className="stat"><div className="stat-n">{totalCheckins}</div><div className="stat-l">Total Check-ins</div></div>
      </div>
      <div className="sec-lbl">Your Clients</div>
      {loading ? <div className="empty"><Spin /> Loading clients...</div> : clients.length === 0 ? <div className="empty"><div className="empty-icon">👥</div><div style={{ fontWeight: 600, marginBottom: 6 }}>No clients yet</div><div style={{ fontSize: 12 }}>Click "+ Add Client" to invite someone, or wait for a player to request you from the discovery page.</div></div> : (
        <div className="grid-2">{clients.map(c => (
          <div className="card click" key={c.id} onClick={() => setSel(c.id)}>
            <div className="card-top"><div><div className="card-name">{c.name}</div><div className="card-sub">{c.level}</div></div><span className="badge b-dim">View →</span></div>
            <div className="card-body">{c.goal}</div>
            <div className="card-foot"><div className="card-meta">Joined {c.joined_date}</div></div>
          </div>
        ))}</div>
      )}</>}
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
        <button className={`t ${tab === "resources" ? "on" : ""}`} onClick={() => setTab("resources")}>Resources</button>
        <button className={`t ${tab === "requests" ? "on" : ""}`} onClick={() => setTab("requests")}>Player Requests</button>
      </div>
      {loading ? <div className="empty"><Spin /> Loading...</div> : (<>
        {tab === "pending" && (pending.length === 0 ? <div className="empty"><div className="empty-icon">✅</div>No pending applications.</div> : <div className="grid-2">{pending.map(c => (<div className="card" key={c.id}><div className="card-top"><div><div className="card-name">{c.name}</div><div className="card-sub">{c.email}</div></div><span className="badge b-amber">Pending</span></div><div className="card-body">{c.bio}</div><div className="card-meta">Applied {c.joined_date}</div><div className="c-actions"><button className="btn-approve" onClick={() => setStatus(c.id, "approved")}>Approve</button><button className="btn-reject" onClick={() => setStatus(c.id, "rejected")}>Reject</button></div></div>))}</div>)}
        {tab === "approved" && <div className="tbl-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Clients</th><th>Joined</th><th></th></tr></thead><tbody>{approved.map(c => (<tr key={c.id}><td><b>{c.name}</b></td><td style={{ color: "var(--muted)" }}>{c.email}</td><td><span style={{ color: "var(--acc)", fontWeight: 700 }}>{clients.filter(cl => cl.coach_id === c.id).length}</span></td><td style={{ color: "var(--muted)" }}>{c.joined_date}</td><td><button className="btn-revoke" onClick={() => setStatus(c.id, "pending")}>Revoke</button></td></tr>))}</tbody></table></div>}
        {tab === "rejected" && (rejected.length === 0 ? <div className="empty"><div className="empty-icon">📭</div>No rejected applications.</div> : <div className="grid-2">{rejected.map(c => (<div className="card" key={c.id}><div className="card-top"><div><div className="card-name">{c.name}</div><div className="card-sub">{c.email}</div></div><span className="badge b-red">Rejected</span></div><div className="card-body">{c.bio}</div><div className="c-actions"><button className="btn-approve" onClick={() => setStatus(c.id, "approved")}>Approve Instead</button></div></div>))}</div>)}
        {tab === "clients" && <div className="tbl-wrap"><table><thead><tr><th>Client</th><th>Email</th><th>Coach</th><th>Level</th><th>Joined</th></tr></thead><tbody>{clients.map(c => { const coach = coaches.find(co => co.id === c.coach_id); return (<tr key={c.id}><td><b>{c.name}</b></td><td style={{ color: "var(--muted)" }}>{c.email}</td><td style={{ color: "var(--acc)" }}>{coach?.name || "Harry Anderson"}</td><td style={{ color: "var(--muted)" }}>{c.level}</td><td style={{ color: "var(--muted)" }}>{c.joined_date}</td></tr>); })}</tbody></table></div>}
        {tab === "resources" && <ResourceLibrary isAdmin />}
        {tab === "requests" && <CoachRequestsPanel />}
      </>)}
    </div>
  );
}

function ClientPortal({ client, sessionUserId, sessionUserName }) {
  const [tab, setTab] = useState("home");
  const [cks, setCks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ rating: null, hardest: "", matchResult: "" });
  const [busy, setBusy] = useState(false); const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true); const [showOnboard, setShowOnboard] = useState(false);
  const [thisWeekCheckin, setThisWeekCheckin] = useState(null);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const weekStart = (() => { const d = new Date(); const day = d.getDay(); const diff = day === 0 ? -6 : 1-day; d.setDate(d.getDate()+diff); return d.toISOString().slice(0,10); })();
        const [cs, prof] = await Promise.all([
          dbGet("checkins", `client_id=eq.${client.id}&order=created_at.desc`),
          dbGet("client_profiles", `client_id=eq.${client.id}&limit=1`),
        ]);
        setCks(cs || []);
        setHasProfile(prof?.length > 0);
        setProfile(prof?.[0] || null);
        const thisWeek = (cs || []).find(c => c.created_at?.slice(0,10) >= weekStart);
        setThisWeekCheckin(thisWeek || null);
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id]);
  const submit = async () => {
    if (!form.rating || !form.hardest || !form.matchResult) return;
    setBusy(true);
    try {
      const nck = await dbInsert("checkins", { client_id: client.id, coach_id: client.coach_id, programme_id: null, week_label: "—", session_rating: form.rating, hardest: form.hardest, match_result: form.matchResult });
      setCks(cs => [nck, ...cs]); setSubmitted(true); setForm({ rating: null, hardest: "", matchResult: "" });
    } catch (e) { }
    setBusy(false);
  };
  if (loading) return <div className="empty" style={{ marginTop: 60 }}><Spin /> Loading...</div>;
  return (
    <div>
      {showOnboard && <OnboardingModal client={client} onClose={() => setShowOnboard(false)} onSaved={() => setHasProfile(true)} />}
      {!hasProfile && (
        <div className="onboard-banner">
          <div className="onboard-text"><b>Complete your profile</b>Help your coach build a programme that fits your life — takes 2 minutes.</div>
          <button className="btn-onboard" onClick={() => setShowOnboard(true)}>Complete Now</button>
        </div>
      )}

      <div className="tabs" style={{ overflowX: "auto", flexWrap: "nowrap", paddingBottom: 2 }}>
        <button className={`t ${tab === "home" ? "on" : ""}`} onClick={() => setTab("home")} style={{ whiteSpace: "nowrap" }}>Home</button>
        <button className={`t ${tab === "programme" ? "on" : ""}`} onClick={() => setTab("programme")} style={{ whiteSpace: "nowrap" }}>Calendar</button>
        <button className={`t ${tab === "checkins" ? "on" : ""}`} onClick={() => setTab("checkins")} style={{ whiteSpace: "nowrap" }}>Check-ins</button>
        <button className={`t ${tab === "schedule" ? "on" : ""}`} onClick={() => setTab("schedule")} style={{ whiteSpace: "nowrap" }}>Schedule</button>
        <button className={`t ${tab === "matches" ? "on" : ""}`} onClick={() => setTab("matches")} style={{ whiteSpace: "nowrap" }}>Matches</button>
        <button className={`t ${tab === "messages" ? "on" : ""}`} onClick={() => setTab("messages")} style={{ whiteSpace: "nowrap" }}>Messages</button>
        <button className={`t ${tab === "history" ? "on" : ""}`} onClick={() => setTab("history")} style={{ whiteSpace: "nowrap" }}>History</button>
        <button className={`t ${tab === "profile" ? "on" : ""}`} onClick={() => setTab("profile")} style={{ whiteSpace: "nowrap" }}>Profile</button>
      </div>
      {tab === "programme" && <CalendarTab client={client} isCoach={false} sessionUserId={sessionUserId} sessionUserName={sessionUserName} />}
      {tab === "checkins" && <div className="ck-list">{cks.length === 0 ? <div className="empty"><div className="empty-icon">📋</div>No check-ins yet.</div> : cks.map(c => <CkCard key={c.id} ck={c} isCoach={false} onRespond={() => {}} />)}</div>}
      {tab === "schedule" && <ScheduleTab client={client} isCoach={false} />}
      {tab === "matches" && <MatchesTab client={client} isCoach={false} clientName={client.name} />}
      {tab === "messages" && <MessagesTab client={client} currentUserId={sessionUserId} currentUserName={sessionUserName} />}
      {tab === "home" && <ClientHome client={client} />}
      {tab === "profile" && <ClientProfileTab client={client} />}
    </div>
  );
}


// ─── LEVEL TREND CHART ────────────────────────────────────────────────────────
function LevelTrendChart({ snapshots, currentLevel }) {
  if (snapshots.length < 2) return null;
  const vals = snapshots.map(s => s.level);
  const min = Math.min(...vals) * 0.98;
  const max = Math.max(...vals) * 1.02;
  const range = max - min || 1;
  const w = 100 / (snapshots.length - 1);
  const points = snapshots.map((s, i) => {
    const x = i * w;
    const y = 100 - ((s.level - min) / range * 100);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="level-chart-wrap">
      <div className="level-chart-title">Level over time</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 80, display: "block" }}>
        <polyline points={points} fill="none" stroke="var(--acc)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {snapshots.map((s, i) => {
          const x = i * w;
          const y = 100 - ((s.level - min) / range * 100);
          return <circle key={s.id} cx={x} cy={y} r="3" fill="var(--acc)" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--dim)", marginTop: 4 }}>
        <span>{snapshots[0]?.created_at?.slice(0,10)}</span>
        <span>{snapshots[snapshots.length-1]?.created_at?.slice(0,10)}</span>
      </div>
    </div>
  );
}

// ─── CLIENT INFO TAB (merged profile + notes) ────────────────────────────────
function ClientInfoTab({ client }) {
  const [profile, setProfile] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [editRating, setEditRating] = useState(false);
  const [newRating, setNewRating] = useState("");
  const [savingRating, setSavingRating] = useState(false);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [prof, snaps, noteData] = await Promise.all([
          dbGet("client_profiles", `client_id=eq.${client.id}&limit=1`),
          dbGet("level_snapshots", `client_id=eq.${client.id}&order=created_at.asc`),
          dbGet("coach_notes", `client_id=eq.${client.id}&limit=1`),
        ]);
        setProfile(prof?.[0] || null);
        setSnapshots(snaps || []);
        setNewRating(prof?.[0]?.squashlevels_rating || "");
        setNotes(noteData?.[0]?.content || "");
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id]);

  const saveNotes = async (val) => {
    try {
      const existing = await dbGet("coach_notes", `client_id=eq.${client.id}&limit=1`);
      if (existing?.length) await dbUpdate("coach_notes", `client_id=eq.${client.id}`, { content: val, updated_at: new Date().toISOString() });
      else await dbInsert("coach_notes", { client_id: client.id, coach_id: client.coach_id, content: val });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { }
  };

  const onNotesChange = (val) => {
    setNotes(val);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => saveNotes(val), 1500));
  };

  const updateRating = async () => {
    setSavingRating(true);
    try {
      if (profile) { await dbUpdate("client_profiles", `client_id=eq.${client.id}`, { squashlevels_rating: newRating, updated_at: new Date().toISOString() }); setProfile(p => ({ ...p, squashlevels_rating: newRating })); }
      else { const np = await dbInsert("client_profiles", { client_id: client.id, squashlevels_rating: newRating }); setProfile(np); }
      setEditRating(false);
    } catch (e) { }
    setSavingRating(false);
  };

  if (loading) return <div className="empty"><Spin /> Loading...</div>;

  const fields = profile ? [
    { label: "Training days/week", val: profile.training_days },
    { label: "Conditioning access", val: profile.gym_access },
    { label: "Injury history", val: profile.injury_history },
    { label: "Squash background", val: profile.squash_background },
    { label: "Additional goals", val: profile.additional_goals },
  ].filter(f => f.val) : [];

  return (
    <div>
      {/* Squash Level */}
      <div className="client-info-section">
        <div className="client-info-section-title">Squash Level</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div className="level-big">{profile?.squashlevels_rating ? parseInt(profile.squashlevels_rating).toLocaleString() : "—"}</div>
            <div className="level-lbl">Current Level</div>
          </div>
          {!editRating
            ? <button className="btn-edit" onClick={() => setEditRating(true)}>Override</button>
            : <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="e-inp" type="number" placeholder="e.g. 5240" value={newRating} onChange={e => setNewRating(e.target.value)} style={{ width: 120 }} />
                <button className="btn-save" style={{ padding: "9px 14px" }} onClick={updateRating} disabled={savingRating}>{savingRating ? <Spin /> : "Save"}</button>
                <button className="btn-cancel" style={{ padding: "9px 14px" }} onClick={() => setEditRating(false)}>✕</button>
              </div>
          }
        </div>
        <LevelTrendChart snapshots={snapshots} currentLevel={profile?.squashlevels_rating} />
      </div>

      {/* Profile fields */}
      {fields.length > 0 && (
        <div className="client-info-section">
          <div className="client-info-section-title">Player Profile</div>
          <div className="profile-grid">
            {fields.map(f => (
              <div className="profile-item" key={f.label}>
                <div className="profile-item-label">{f.label}</div>
                <div className="profile-item-val">{f.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach notes */}
      <div className="client-info-section">
        <div className="client-info-section-title">Private Notes — only you can see this</div>
        <textarea className="notes-area" placeholder={`Notes about ${client.name.split(" ")[0]}...

Strengths, weaknesses, what they respond well to, coaching observations...`} value={notes} onChange={e => onNotesChange(e.target.value)} />
        {saved && <div className="notes-saved">✓ Saved</div>}
      </div>
    </div>
  );
}

// ─── COACH INBOX ──────────────────────────────────────────────────────────────
function CoachInbox({ coachId, clients, onSelectClient }) {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const cks = await dbGet("checkins", `coach_id=eq.${coachId}&coach_response=is.null&order=created_at.desc`);
        setCheckins(cks || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [coachId]);

  if (loading) return <div className="empty"><Spin /> Loading inbox...</div>;
  if (checkins.length === 0) return <div className="empty"><div className="empty-icon">✅</div><div style={{ fontWeight: 600, marginBottom: 6 }}>All caught up</div><div style={{ fontSize: 12 }}>No unanswered check-ins.</div></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {checkins.map(ck => {
        const client = clients.find(c => c.id === ck.client_id);
        const wk = ck.week_label && ck.week_label !== "—" ? ck.week_label : "Recent";
        return (
          <div className="inbox-item" key={ck.id} onClick={() => client && onSelectClient(client.id)}>
            <div style={{ flex: 1 }}>
              <div className="inbox-client">{client?.name || "Unknown client"}</div>
              <div className="inbox-week">{wk} · {ck.created_at?.slice(0,10)}</div>
              <div className="inbox-preview">"{ck.hardest?.slice(0,80)}{ck.hardest?.length > 80 ? "..." : ""}"</div>
            </div>
            <div>
              <div className="inbox-rating">{ck.session_rating}<span style={{ fontSize: 14, color: "var(--muted)" }}>/10</span></div>
              <div className="inbox-rating-lbl">rating</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── WORKOUTS LIBRARY ─────────────────────────────────────────────────────────
function WorkoutsLibrary({ coachId, onSelectWorkout, compact }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ name: "", description: "" });
  const [exercises, setExercises] = useState([{ name: "", sets: "", reps: "", notes: "", resourceId: null }]);
  const [resources, setResources] = useState([]);
  const [busy, setBusy] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [ws, rs] = await Promise.all([
          dbGet("workouts", `coach_id=eq.${coachId}&order=created_at.desc`),
          dbGet("resources", "order=category.asc,title.asc"),
        ]);
        setWorkouts(ws || []);
        setResources(rs || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [coachId]);

  const addExercise = () => setExercises(ex => [...ex, { name: "", sets: "", reps: "", notes: "", resourceId: null }]);
  const upEx = (i, k, v) => { const ex = [...exercises]; ex[i] = { ...ex[i], [k]: v }; setExercises(ex); };
  const removeEx = (i) => setExercises(ex => ex.filter((_, j) => j !== i));

  const save = async () => {
    if (!f.name || exercises.every(e => !e.name)) return;
    setBusy(true);
    try {
      const w = await dbInsert("workouts", { coach_id: coachId, name: f.name.trim(), description: f.description.trim() });
      await Promise.all(exercises.filter(e => e.name).map((e, i) =>
        dbInsert("workout_exercises", { workout_id: w.id, exercise_name: e.name, sets: e.sets, reps: e.reps, notes: e.notes, resource_id: e.resourceId || null, sort_order: i })
      ));
      setWorkouts(ws => [w, ...ws]);
      setShowForm(false);
      setF({ name: "", description: "" });
      setExercises([{ name: "", sets: "", reps: "", notes: "", resourceId: null }]);
    } catch (e) { }
    setBusy(false);
  };

  const deleteWorkout = async (id) => {
    if (!window.confirm("Delete this workout?")) return;
    await dbDelete("workouts", `id=eq.${id}`);
    setWorkouts(ws => ws.filter(w => w.id !== id));
  };

  if (loading) return <div className="empty"><Spin /> Loading workouts...</div>;

  return (
    <div>
      {!compact && !showForm && <button className="btn-edit" style={{ marginBottom: 18 }} onClick={() => setShowForm(true)}>+ Create Workout</button>}

      {showForm && (
        <div className="editor" style={{ marginBottom: 20 }}>
          <div className="editor-title">Create Workout</div>
          <div className="row2">
            <div style={{ gridColumn: "1/-1" }}><label className="e-lbl">Workout Name</label><input className="e-inp" placeholder="e.g. Pre-season Lower Body" value={f.name} onChange={e => s("name", e.target.value)} /></div>
            <div style={{ gridColumn: "1/-1" }}><label className="e-lbl">Description (optional)</label><input className="e-inp" placeholder="Brief description..." value={f.description} onChange={e => s("description", e.target.value)} /></div>
          </div>
          <label className="e-lbl" style={{ marginBottom: 10, display: "block" }}>Exercises</label>
          {exercises.map((ex, i) => (
            <div key={i} className="day-ed" style={{ marginBottom: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8 }}>
                <input className="e-inp" placeholder="Exercise name" value={ex.name} onChange={e => upEx(i, "name", e.target.value)} />
                {exercises.length > 1 && <button style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: 16 }} onClick={() => removeEx(i)}>×</button>}
              </div>
              <div className="row2" style={{ marginBottom: 8 }}>
                <div><label className="e-lbl">Sets</label><input className="e-inp" placeholder="e.g. 3" value={ex.sets} onChange={e => upEx(i, "sets", e.target.value)} /></div>
                <div><label className="e-lbl">Reps / Duration</label><input className="e-inp" placeholder="e.g. 10 or 45s" value={ex.reps} onChange={e => upEx(i, "reps", e.target.value)} /></div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label className="e-lbl">Link to resource (optional)</label>
                <select className="e-inp e-sel" value={ex.resourceId || ""} onChange={e => upEx(i, "resourceId", e.target.value || null)}>
                  <option value="">No resource linked</option>
                  {resources.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>
              <div><label className="e-lbl">Notes</label><input className="e-inp" placeholder="Coaching cues, progressions..." value={ex.notes} onChange={e => upEx(i, "notes", e.target.value)} /></div>
            </div>
          ))}
          <button className="btn-ghost" style={{ marginTop: 8, width: "auto" }} onClick={addExercise}>+ Add Exercise</button>
          <div className="ed-actions" style={{ marginTop: 16 }}>
            <button className="btn-save" onClick={save} disabled={!f.name || busy}>{busy ? <><Spin />Saving...</> : "Save Workout"}</button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {workouts.length === 0 && !showForm && <div className="empty"><div className="empty-icon">💪</div>No workouts yet. Create one above.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {workouts.map(w => (
          <WorkoutCard key={w.id} workout={w} resources={resources} onSelect={onSelectWorkout} onDelete={deleteWorkout} compact={compact} />
        ))}
      </div>
    </div>
  );
}

function WorkoutCard({ workout, resources, onSelect, onDelete, compact }) {
  const [exercises, setExercises] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (exercises) return;
    try { setExercises(await dbGet("workout_exercises", `workout_id=eq.${workout.id}&order=sort_order.asc`) || []); }
    catch (e) { setExercises([]); }
  };

  return (
    <div className="workout-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <div className="workout-card-name">{workout.name}</div>
          {workout.description && <div className="workout-card-desc">{workout.description}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
          {onSelect && <button className="btn-edit" onClick={() => onSelect(workout)}>Use</button>}
          <button className="btn-edit" onClick={async () => { await load(); setOpen(o => !o); }}>{open ? "Hide" : "View"}</button>
          {!compact && onDelete && <button className="btn-cancel" style={{ padding: "7px 12px", fontSize: 11 }} onClick={() => onDelete(workout.id)}>Delete</button>}
        </div>
      </div>
      {open && exercises && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          {exercises.length === 0 ? <div style={{ fontSize: 13, color: "var(--dim)" }}>No exercises added.</div>
            : exercises.map(ex => {
              const res = resources?.find(r => r.id === ex.resource_id);
              return (
                <div className="workout-exercise-row" key={ex.id}>
                  <div className="workout-ex-name">
                    {res ? <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--acc)", textDecoration: "none" }}>{ex.exercise_name} ↗</a> : ex.exercise_name}
                  </div>
                  {ex.sets && ex.reps && <div className="workout-ex-sets">{ex.sets} × {ex.reps}</div>}
                  {ex.notes && <div style={{ fontSize: 11, color: "var(--dim)" }}>{ex.notes}</div>}
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

// ─── MATCH STATS ──────────────────────────────────────────────────────────────
function MatchStats({ matches }) {
  if (matches.length === 0) return null;
  const wins = matches.filter(m => m.result === "Win").length;
  const losses = matches.filter(m => m.result === "Loss").length;
  const winPct = matches.length > 0 ? Math.round(wins / matches.length * 100) : 0;
  const withLevels = matches.filter(m => m.my_rating && m.opponent_rating);
  const avgDiff = withLevels.length > 0
    ? Math.round(withLevels.reduce((a, m) => a + (parseInt(m.my_rating) - parseInt(m.opponent_rating)), 0) / withLevels.length)
    : null;
  return (
    <div className="match-stats-row">
      <div className="match-stat-card"><div className="match-stat-n" style={{ color: "var(--green)" }}>{wins}</div><div className="match-stat-l">Wins</div></div>
      <div className="match-stat-card"><div className="match-stat-n" style={{ color: "var(--red)" }}>{losses}</div><div className="match-stat-l">Losses</div></div>
      <div className="match-stat-card"><div className="match-stat-n">{winPct}%</div><div className="match-stat-l">Win Rate</div></div>
      {avgDiff !== null && <div className="match-stat-card" style={{ gridColumn: "1/-1" }}>
        <div className="match-stat-n" style={{ fontSize: 24 }}>{avgDiff > 0 ? "+" : ""}{avgDiff.toLocaleString()}</div>
        <div className="match-stat-l">Avg level difference vs opponents</div>
      </div>}
    </div>
  );
}

// ─── CLIENT PROFILE TAB (client's own view) ──────────────────────────────────
function ClientProfileTab({ client }) {
  const [profile, setProfile] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLevel, setNewLevel] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [prof, snaps] = await Promise.all([
          dbGet("client_profiles", `client_id=eq.${client.id}&limit=1`),
          dbGet("level_snapshots", `client_id=eq.${client.id}&order=created_at.asc`),
        ]);
        setProfile(prof?.[0] || null);
        setSnapshots(snaps || []);
        setNewLevel(prof?.[0]?.squashlevels_rating || "");
      } catch (e) { }
      setLoading(false);
    })();
  }, [client.id]);

  const updateLevel = async () => {
    if (!newLevel) return;
    setSaving(true);
    try {
      // Update profile rating
      if (profile) await dbUpdate("client_profiles", `client_id=eq.${client.id}`, { squashlevels_rating: newLevel, updated_at: new Date().toISOString() });
      else await dbInsert("client_profiles", { client_id: client.id, squashlevels_rating: newLevel });
      // Add snapshot
      const snap = await dbInsert("level_snapshots", { client_id: client.id, level: parseInt(newLevel), note: note.trim() || null });
      setSnapshots(s => [...s, snap]);
      setProfile(p => ({ ...(p || {}), squashlevels_rating: newLevel }));
      setSaved(true); setNote("");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { }
    setSaving(false);
  };

  if (loading) return <div className="empty"><Spin /> Loading...</div>;

  return (
    <div>
      {showOnboard && <OnboardingModal client={client} onClose={() => setShowOnboard(false)} onSaved={(f) => { setProfile(p => ({ ...(p||{}), ...f })); }} />}

      {/* Level tracker */}
      <div className="client-info-section">
        <div className="client-info-section-title">My Squash Level</div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 16 }}>
          <div>
            <div className="level-big">{profile?.squashlevels_rating ? parseInt(profile.squashlevels_rating).toLocaleString() : "—"}</div>
            <div className="level-lbl">Current Level</div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 10 }}>Update from SquashLevels after matches. Your coach can see these updates.</p>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label className="e-lbl">New level</label>
                <input className="e-inp" type="number" placeholder="e.g. 5240" value={newLevel} onChange={e => setNewLevel(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="e-lbl">Note (optional)</label>
                <input className="e-inp" placeholder="e.g. After county match" value={note} onChange={e => setNote(e.target.value)} />
              </div>
              <button className="btn-save" style={{ padding: "9px 14px", whiteSpace: "nowrap" }} onClick={updateLevel} disabled={!newLevel || saving}>{saving ? <Spin /> : saved ? "Saved ✓" : "Update"}</button>
            </div>
          </div>
        </div>
        <LevelTrendChart snapshots={snapshots} />
        {snapshots.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div className="sec-lbl">Level history</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...snapshots].reverse().slice(0,5).map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--surf2)", borderRadius: "var(--r)", fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{parseInt(s.level).toLocaleString()}</span>
                  {s.note && <span style={{ color: "var(--muted)" }}>{s.note}</span>}
                  <span style={{ color: "var(--dim)", fontSize: 11 }}>{s.created_at?.slice(0,10)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile completeness */}
      {!profile || !profile.squash_background ? (
        <div style={{ background: "var(--amber-dim)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: "var(--rl)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ fontSize: 13, color: "var(--amber)", lineHeight: 1.5 }}><b style={{ display: "block", marginBottom: 2 }}>Complete your profile</b>Help your coach build the right programme for you.</div>
          <button className="btn-onboard" onClick={() => setShowOnboard(true)}>Complete Now</button>
        </div>
      ) : (
        <div className="client-info-section">
          <div className="client-info-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            Player Profile
            <button className="btn-edit" style={{ fontSize: 10 }} onClick={() => setShowOnboard(true)}>Edit</button>
          </div>
          <div className="profile-grid">
            {[
              { label: "Training days/week", val: profile?.training_days },
              { label: "Conditioning access", val: profile?.gym_access },
              { label: "Injury history", val: profile?.injury_history },
              { label: "Squash background", val: profile?.squash_background },
              { label: "Additional goals", val: profile?.additional_goals },
            ].filter(f => f.val).map(f => (
              <div className="profile-item" key={f.label}>
                <div className="profile-item-label">{f.label}</div>
                <div className="profile-item-val">{f.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COACH DISCOVERY ─────────────────────────────────────────────────────────
function CoachDiscovery({ client }) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requested, setRequested] = useState({});
  const [busy, setBusy] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setCoaches((await dbGet("coaches", "status=eq.approved&order=name.asc") || []).filter(c => !ADMIN_EMAILS.includes(c.email))); }
      catch (e) { }
      setLoading(false);
    })();
  }, []);

  const sendRequest = async (coach) => {
    setBusy(b => ({ ...b, [coach.id]: true }));
    try {
      await dbInsert("coach_requests", { client_id: client.id, coach_id: coach.id, client_name: client.name, client_email: client.email, status: "pending" });
      setRequested(r => ({ ...r, [coach.id]: true }));
    } catch (e) { }
    setBusy(b => ({ ...b, [coach.id]: false }));
  };

  const filtered = coaches.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.bio || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="discovery-wrap">
      <div className="discovery-hero">
        <div className="discovery-logo">VolleyReady</div>
        <div className="discovery-sub">Find a coach and get a personalised squash programme built around your game.</div>
        <div className="discovery-search">
          <input className="inp" placeholder="Search by name or specialism..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {loading ? <div className="empty"><Spin /> Loading coaches...</div> : filtered.length === 0
        ? <div className="empty"><div className="empty-icon">👥</div>No coaches found{search ? ` matching "${search}"` : ""}.</div>
        : <div className="coach-discover-grid">{filtered.map(coach => (
          <div className="coach-discover-card" key={coach.id}>
            <div className="coach-disc-name">{coach.name}</div>
            <div className="coach-disc-bio">{coach.bio || "Qualified squash coach on VolleyReady."}</div>
            <div className="coach-disc-meta">Joined {coach.joined_date}</div>
            {requested[coach.id]
              ? <button className="btn-request sent" disabled>Request Sent ✓</button>
              : <button className="btn-request" onClick={() => sendRequest(coach)} disabled={busy[coach.id]}>{busy[coach.id] ? <><Spin />Sending...</> : "Request This Coach"}</button>
            }
          </div>
        ))}</div>
      }
    </div>
  );
}

// ─── CLIENT SELF-REGISTER ────────────────────────────────────────────────────
function ClientRegisterScreen({ onBack }) {
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [busy, setBusy] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const register = async () => {
    if (!f.name || !f.email || !f.password) { setErr("All fields required."); return; }
    if (f.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true); setErr("");
    try {
      const data = await authSignUp(f.email.trim().toLowerCase(), f.password);
      if (data.user?.id) {
        await dbInsert("clients", { id: data.user.id, coach_id: null, name: f.name.trim(), email: f.email.trim().toLowerCase(), level: "", goal: "" });
        setOk("Account created! Sign in to find your coach.");
      } else { setOk("Account created! Check your email, then sign in."); }
    } catch (e) { setErr(e.message || "Registration failed. Email may already be in use."); }
    setBusy(false);
  };
  return (
    <div className="client-reg-wrap">
      <div className="auth-box">
        <div className="auth-logo">VolleyReady</div>
        <div className="auth-tagline">Create your player account.</div>
        {err && <div className="msg-err">{err}</div>}
        {ok && <div className="msg-ok">{ok}</div>}
        {!ok && (<>
          <div className="fld"><label className="lbl">Full Name</label><input className="inp" placeholder="Your name" value={f.name} onChange={e => s("name", e.target.value)} /></div>
          <div className="fld"><label className="lbl">Email</label><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e => s("email", e.target.value)} /></div>
          <div className="fld"><label className="lbl">Password</label><input className="inp" type="password" placeholder="Min. 6 characters" value={f.password} onChange={e => s("password", e.target.value)} onKeyDown={e => e.key === "Enter" && register()} /></div>
          <button className="btn-acc" onClick={register} disabled={busy}>{busy ? <><Spin />Creating account...</> : "Create Account"}</button>
        </>)}
        <button className="btn-ghost" onClick={onBack}>← Back to sign in</button>
      </div>
    </div>
  );
}

// ─── COACH REQUESTS PANEL ────────────────────────────────────────────────────
function CoachRequestsPanel({ coachId }) {
  const [requests, setRequests] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = coachId ? `coach_id=eq.${coachId}&status=eq.pending&order=created_at.desc` : `status=eq.pending&order=created_at.desc`;
        setRequests(await dbGet("coach_requests", q) || []);
      } catch (e) { }
      setLoading(false);
    })();
  }, [coachId]);
  const respond = async (req, action) => {
    try {
      await dbUpdate("coach_requests", `id=eq.${req.id}`, { status: action });
      if (action === "approved") await dbUpdate("clients", `id=eq.${req.client_id}`, { coach_id: req.coach_id });
      setRequests(rs => rs.filter(r => r.id !== req.id));
    } catch (e) { }
  };
  if (loading) return <div className="empty"><Spin /> Loading...</div>;
  return requests.length === 0
    ? <div className="empty"><div className="empty-icon">✅</div>No pending player requests.</div>
    : <div className="grid-2">{requests.map(req => (
      <div className="card" key={req.id}>
        <div className="card-top"><div><div className="card-name">{req.client_name}</div><div className="card-sub">{req.client_email}</div></div><span className="badge b-amber">Pending</span></div>
        <div className="card-meta" style={{ marginBottom: 14 }}>Requested {req.created_at?.slice(0,10)}</div>
        <div className="c-actions">
          <button className="btn-approve" onClick={() => respond(req, "approved")}>Accept</button>
          <button className="btn-reject" onClick={() => respond(req, "rejected")}>Decline</button>
        </div>
      </div>
    ))}</div>;
}

export default function App() {
  const [session, setSession] = useState(null); const [profile, setProfile] = useState(null); const [role, setRole] = useState(null);
  const [booting, setBooting] = useState(true); const [adminMode, setAdminMode] = useState(true);
  const [showPlayerRegister, setShowPlayerRegister] = useState(false);
  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem("sc_session") || sessionStorage.getItem("sc_session");
      if (raw) {
        try {
          const s = JSON.parse(raw);
          // Try to refresh if we have a refresh token
          if (s.refreshToken) {
            try {
              const refreshed = await authRefresh(s.refreshToken);
              const newToken = refreshed.access_token;
              const updated = { ...s, session: { ...s.session, token: newToken }, refreshToken: refreshed.refresh_token };
              localStorage.setItem("sc_session", JSON.stringify(updated));
              setSession(updated.session); setProfile(s.profile); setRole(s.role);
            } catch (e) {
              localStorage.removeItem("sc_session");
            }
          } else {
            setSession(s.session); setProfile(s.profile); setRole(s.role);
          }
        } catch (e) { localStorage.removeItem("sc_session"); sessionStorage.removeItem("sc_session"); }
      }
      setBooting(false);
    })();
  }, []);
  const applySession = (data, role, prof, remember) => {
    const token = data.access_token; const userId = data.user.id; const email = data.user.email || prof.email;
    const s = { session: { token, userId, email }, profile: prof, role, refreshToken: remember ? data.refresh_token : null, remember: !!remember };
    if (remember) { localStorage.setItem("sc_session", JSON.stringify(s)); } else { sessionStorage.setItem("sc_session", JSON.stringify(s)); }
    setSession({ token, userId, email }); setProfile(prof); setRole(role);
  };
  const login = async (email, password, remember) => {
    const data = await authSignIn(email, password);
    const userId = data.user.id;
    const coaches = await dbGet("coaches", `id=eq.${userId}`);
    if (coaches?.length) { applySession(data, "coach", coaches[0], remember); return; }
    const clients = await dbGet("clients", `id=eq.${userId}`);
    if (clients?.length) { applySession(data, "client", clients[0], remember); return; }
    throw new Error("No profile found for this account.");
  };
  const logout = async () => { if (session?.token) await authSignOut(session.token).catch(() => {}); localStorage.removeItem("sc_session"); setSession(null); setProfile(null); setRole(null); };
  if (booting) return <><style>{css}</style><Loading /></>;
  if (showPlayerRegister) return <><style>{css}</style><ClientRegisterScreen onBack={() => setShowPlayerRegister(false)} /></>;
  if (!session || !role) return <><style>{css}</style><AuthScreen onLogin={login} onPlayerRegister={() => setShowPlayerRegister(true)} /></>;
  if (role === "coach" && profile?.status === "pending") return <><style>{css}</style><Nav name={profile.name} email={session.email} role="coach" onLogout={logout} adminMode={false} onToggleAdmin={() => {}} /><PendingScreen onLogout={logout} /></>;
  const isAdmin = ADMIN_EMAILS.includes(session.email) && role === "coach";
  return (
    <><style>{css}</style>
    <Nav name={profile.name} email={session.email} role={role} onLogout={logout} adminMode={adminMode} onToggleAdmin={() => setAdminMode(m => !m)} />
    <div className="wrap">
      {isAdmin && adminMode && <AdminPanel token={session.token} />}
      {role === "coach" && (!isAdmin || !adminMode) && <CoachDash coach={profile} token={session.token} sessionUserId={session.userId} sessionUserName={profile.name} />}
      {role === "client" && (!profile.coach_id
        ? <><Nav name={profile.name} email={session.email} role={role} onLogout={logout} adminMode={false} onToggleAdmin={() => {}} /><CoachDiscovery client={profile} /></>
        : <ClientPortal client={profile} sessionUserId={session.userId} sessionUserName={profile.name} />
      )}
    </div></>
  );
}
