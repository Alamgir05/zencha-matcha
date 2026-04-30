/**
 * shared.js — common utilities used across all pages
 * Cart count loading, sticky nav, auth state restore
 */

'use strict';

const API = 'http://localhost:5000';

/* ── Auth helpers ──────────────────────────────────────── */
function getToken()  { return localStorage.getItem('zenchaToken'); }
function getUser()   {
  try { return JSON.parse(localStorage.getItem('zenchaUser')); } catch(e) { return null; }
}
function isLoggedIn() { return !!getToken(); }

/* ── Cart count badge ──────────────────────────────────── */
async function loadCartBadge() {
  const token = getToken();
  const countEl = document.getElementById('cart-count');
  if (!countEl || !token) return;

  try {
    const res = await fetch(API + '/api/cart', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    const data = await res.json();
    const total = (data.items || []).reduce((s, i) => s + i.quantity, 0);
    countEl.textContent = total;
  } catch (err) {
    // backend might be down, just skip
  }
}

/* ── Restore nav auth state ────────────────────────────── */
function restoreAuthNav() {
  const user = getUser();
  const signInLink = document.getElementById('sign-in-link');
  if (!user || !signInLink) return;

  const firstName = user.name.split(' ')[0];
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-user';
  wrapper.innerHTML = `
    <span class="nav-util" id="nav-username">Hi, ${firstName}</span>
    <button class="nav-logout" id="logout-btn">Logout</button>
  `;
  signInLink.replaceWith(wrapper);

  document.getElementById('logout-btn').addEventListener('click', function() {
    localStorage.removeItem('zenchaToken');
    localStorage.removeItem('zenchaUser');
    location.href = '/';
  });
}

/* ── Sticky nav ────────────────────────────────────────── */
function initStickyNav() {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', function() {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ── Run on every page ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  restoreAuthNav();
  loadCartBadge();
  initStickyNav();
});

export { API, getToken, getUser, isLoggedIn, loadCartBadge };
