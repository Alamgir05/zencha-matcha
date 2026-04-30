/**
 * MATON — Vanilla JS Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Includes:
 *  1. MatchaSequence  — scroll-driven canvas image sequence (30 frames)
 *  2. Sticky nav + active link tracking
 *  3. Scroll reveal (IntersectionObserver)
 *  4. Cart counter
 *  5. Hamburger menu
 *  6. Product card hover tilt
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   1. MATCHA SEQUENCE — Canvas scroll animation
   ─────────────────────────────────────────────────────────
   Architecture:
   • #hero-scroll-zone is 300vh tall → gives 200vh of scroll travel
   • #hero-sticky is position:sticky top:0; height:100vh → stays pinned
   • We read scrollY relative to #hero-scroll-zone's offsetTop
   • Map that scroll distance → frame index → draw to <canvas>
   • requestAnimationFrame used as a gate: only one draw per frame
   ─────────────────────────────────────────────────────────
   Scroll feel: "heavy, deliberate, ritualistic"
   • 200vh of travel for 30 frames = ~6.7vh per frame
   • No easing on the index itself — linear mapping
   • rAF prevents frame queue buildup on fast scroll
════════════════════════════════════════════════════════════ */

(function MatchaSequence() {

  const TOTAL_FRAMES    = 30;
  const FRAME_DIR       = '/frames/';       // relative to index.html
  const SCROLL_ZONE_VH  = 300;                 // must match CSS height: 300vh

  // ── Elements ────────────────────────────────────────────
  const canvas     = document.getElementById('matcha-canvas');
  const scrollZone = document.getElementById('hero-scroll-zone');
  const loader     = document.getElementById('seq-loader');
  const loaderFill = document.getElementById('seq-loader-fill');
  const loaderLabel = document.getElementById('seq-loader-label');
  const scrollCue  = document.getElementById('scroll-cue');

  if (!canvas || !scrollZone) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ── State ────────────────────────────────────────────────
  const frames       = new Array(TOTAL_FRAMES);
  let loadedCount    = 0;
  let allLoaded      = false;
  let currentFrame   = 0;
  let rafPending     = false;
  let canvasW        = 0;
  let canvasH        = 0;

  // Reduced-motion: skip animation, always show frame 0
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Build frame URLs ─────────────────────────────────────
  function frameUrl(i) {
    // i is 0-indexed; files are ezgif-frame-001.jpg … ezgif-frame-030.jpg
    const n = String(i + 1).padStart(3, '0');
    return `${FRAME_DIR}ezgif-frame-${n}.jpg`;
  }

  // ── Preload all frames ───────────────────────────────────
  function preloadFrames() {
    // Failsafe: force remove loading screen after 5 seconds if getting stuck
    const fallbackTimeout = setTimeout(function() {
      if (!allLoaded) {
        console.warn("Loading timeout reached: forcing site render.");
        allLoaded = true;
        onAllLoaded();
      }
    }, 5000);

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();

      img.onload = function() {
        if (allLoaded) return; // Prevent double trigger
        frames[i] = img;
        loadedCount++;

        // Update loader UI
        const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderFill)  loaderFill.style.width  = pct + '%';
        if (loaderLabel) loaderLabel.textContent  = 'Preparing ceremony… ' + pct + '%';

        if (loadedCount === TOTAL_FRAMES) {
          clearTimeout(fallbackTimeout);
          allLoaded = true;
          onAllLoaded();
        }
      };

      img.onerror = function() {
        if (allLoaded) return; // Prevent double trigger
        // Count failures the same as success so we don't hang forever
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          clearTimeout(fallbackTimeout);
          allLoaded = true;
          onAllLoaded();
        }
      };
      
      // Set src AFTER event listeners to avoid race conditions with browser cache
      img.src = frameUrl(i);
    }
  }

  // ── Called once all frames (or errors) are done ──────────
  function onAllLoaded() {
    // Draw frame 0 immediately
    resizeCanvas();
    drawFrame(0);

    // Fade out loader
    if (loader) {
      loader.style.transition = 'opacity 0.8s ease';
      loader.style.opacity    = '0';
      setTimeout(function() { loader.style.display = 'none'; }, 900);
    }

    // Show scroll cue
    if (scrollCue) {
      scrollCue.style.opacity = '1';
    }
  }

  // ── Canvas resize — matches display size at device pixel ratio ──
  function resizeCanvas() {
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Only reallocate if size changed
    const neededW = Math.round(rect.width  * dpr);
    const neededH = Math.round(rect.height * dpr);

    if (canvas.width !== neededW || canvas.height !== neededH) {
      canvas.width  = neededW;
      canvas.height = neededH;
      canvasW = rect.width;
      canvasH = rect.height;

      // Re-draw current frame after resize
      if (allLoaded) drawFrame(currentFrame);
    }
  }

  // ── Draw a single frame to canvas, cover-fit ────────────
  function drawFrame(idx) {
    const img = frames[idx];
    if (!img || !img.complete || !img.naturalWidth) return;

    const dpr = window.devicePixelRatio || 1;
    const w   = canvas.width  / dpr;
    const h   = canvas.height / dpr;

    // cover-fit: crop proportionally
    const imgAR    = img.naturalWidth  / img.naturalHeight;
    const canvasAR = w / h;

    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

    if (imgAR > canvasAR) {
      // Image wider → crop sides
      sw = img.naturalHeight * canvasAR;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      // Image taller → crop top/bottom
      sh = img.naturalWidth / canvasAR;
      sy = (img.naturalHeight - sh) / 2;
    }

    // Scale context for DPR
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    ctx.restore();
  }

  // ── Schedule a draw via rAF — prevents queueing > 60fps ─
  function scheduleDraw(idx) {
    if (rafPending) return;           // already a draw queued
    rafPending = true;
    requestAnimationFrame(function() {
      drawFrame(idx);
      rafPending = false;
    });
  }

  // ── Scroll → frame index ─────────────────────────────────
  function onScroll() {
    if (!allLoaded || reducedMotion) return;

    // Distance from top of scroll zone to viewport top
    const zoneTop    = scrollZone.getBoundingClientRect().top + window.scrollY;
    const scrolled   = window.scrollY - zoneTop;         // px scrolled past zone start
    const maxScroll  = scrollZone.offsetHeight - window.innerHeight; // total travel px

    // Clamp progress [0, 1]
    const progress = Math.min(Math.max(scrolled / maxScroll, 0), 1);

    // Map to frame index
    const rawIdx = progress * (TOTAL_FRAMES - 1);
    const idx    = Math.min(Math.max(Math.round(rawIdx), 0), TOTAL_FRAMES - 1);

    if (idx !== currentFrame) {
      currentFrame = idx;
      scheduleDraw(idx);
    }
  }

  // ── Resize handler ───────────────────────────────────────
  function onResize() {
    // Reset canvas backing store so DPR is recalculated
    canvas.width  = 0;
    canvas.height = 0;
    resizeCanvas();
  }

  // ── Boot ─────────────────────────────────────────────────
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  // Initial size
  resizeCanvas();

  // Start preloading
  preloadFrames();

  // If reduced motion, skip loader immediately and show frame 0 on load
  if (reducedMotion && loader) {
    loader.style.display = 'none';
  }

})(); // end MatchaSequence IIFE


/* ═══════════════════════════════════════════════════════════
   2. STICKY NAV — scrolled class + active link
════════════════════════════════════════════════════════════ */
(function StickyNav() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const SECTIONS = ['hero', 'products', 'testimonials'];

  function update() {
    // Scrolled state
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Active link
    let current = '';
    SECTIONS.forEach(function(id) {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.getBoundingClientRect().top <= 120) current = id;
    });

    document.querySelectorAll('.nav-link').forEach(function(link) {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ═══════════════════════════════════════════════════════════
   3. SCROLL REVEAL — IntersectionObserver
════════════════════════════════════════════════════════════ */
(function ScrollReveal() {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;

  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, i) {
      if (!entry.isIntersecting) return;

      // Stagger siblings
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('[data-animate]'));
      const idx      = siblings.indexOf(entry.target);
      const delay    = idx * 110;

      setTimeout(function() {
        entry.target.classList.add('visible');
      }, delay);

      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // Trigger hero elements immediately on load
  document.querySelectorAll('#hero-sticky [data-animate]').forEach(function(el) {
    setTimeout(function() { el.classList.add('visible'); }, 400);
  });

  // Observe everything else
  els.forEach(function(el) {
    if (!el.closest('#hero-sticky')) obs.observe(el);
  });
})();


/* ═══════════════════════════════════════════════════════════
   4. CART — Add to Cart with real backend API
════════════════════════════════════════════════════════════ */
(function Cart() {
  const API     = 'http://localhost:5000';
  const countEl = document.getElementById('cart-count');

  function setCountDisplay(n) {
    if (!countEl) return;
    countEl.textContent = n;
  }

  // Load cart count from server on page load
  async function loadCartCount() {
    const token = localStorage.getItem('zenchaToken');
    if (!token) return;
    try {
      const res = await fetch(API + '/api/cart', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return;
      const data = await res.json();
      const total = (data.items || []).reduce(function(sum, item) {
        return sum + item.quantity;
      }, 0);
      setCountDisplay(total);
    } catch (err) {
      console.log('Could not load cart count:', err.message);
    }
  }

  // Handle Add to Cart button click
  async function handleAddToCart(e) {
    e.preventDefault();
    const btn       = e.currentTarget;
    const productId = btn.dataset.productId;
    const token     = localStorage.getItem('zenchaToken');

    console.log('Add to cart:', productId, 'logged in:', !!token);

    // Not logged in → open the sign in modal
    if (!token) {
      var signIn = document.getElementById('sign-in-link');
      if (signIn) signIn.click();
      return;
    }

    if (!productId) {
      console.warn('Button has no data-product-id:', btn);
      return;
    }

    if (!btn.dataset.origText) btn.dataset.origText = btn.textContent.trim();
    btn.textContent   = 'Adding...';
    btn.style.opacity = '0.7';
    btn.disabled      = true;

    try {
      const res = await fetch(API + '/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ productId: productId, quantity: 1 })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Cart error:', data.message);
        btn.textContent   = btn.dataset.origText;
        btn.style.opacity = '';
        btn.disabled      = false;
        return;
      }

      console.log('Cart updated:', data);

      // Update badge count
      const total = (data.items || []).reduce(function(sum, item) {
        return sum + item.quantity;
      }, 0);
      setCountDisplay(total);

      if (countEl) {
        countEl.style.transform  = 'scale(1.6)';
        countEl.style.background = '#fff';
        setTimeout(function() {
          countEl.style.transform  = '';
          countEl.style.background = '';
        }, 300);
      }

      btn.textContent      = '\u2713 Added!';
      btn.style.background = '#2d5a3d';
      btn.style.color      = '#fff';
      btn.style.opacity    = '1';

      setTimeout(function() {
        btn.textContent      = btn.dataset.origText;
        btn.style.background = '';
        btn.style.color      = '';
        btn.disabled         = false;
      }, 1800);

    } catch (err) {
      console.error('Cart fetch error:', err.message);
      btn.textContent   = btn.dataset.origText;
      btn.style.opacity = '';
      btn.disabled      = false;
    }
  }

  // Wire all add-to-cart buttons
  document.querySelectorAll('.add-to-cart').forEach(function(btn) {
    btn.addEventListener('click', handleAddToCart);
  });

  // Cart icon — now a real link to /cart.html, no need to prevent default
  // (just kept for badge load reference)


  // Load count from server on startup
  loadCartCount();

})();


/* ═══════════════════════════════════════════════════════════
   5. HAMBURGER MENU
════════════════════════════════════════════════════════════ */
(function HamburgerMenu() {
  const btn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('main-nav');
  if (!btn || !nav) return;

  let open = false;

  btn.addEventListener('click', function() {
    open = !open;
    nav.classList.toggle('is-open', open);
    btn.classList.toggle('is-active', open);
  });

  // Close on link click (mobile)
  nav.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() { 
      open = false; 
      nav.classList.remove('is-open'); 
      btn.classList.remove('is-active');
    });
  });
})();


/* ═══════════════════════════════════════════════════════════
   6. CARD TILT (mini-cards, testimonials, acc-cards)
════════════════════════════════════════════════════════════ */
(function CardTilt() {
  // Only run on non-touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const CARDS = '.mini-card, .testimonial-card, .acc-card';

  document.querySelectorAll(CARDS).forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      const rect  = card.getBoundingClientRect();
      const x     = e.clientX - rect.left;
      const y     = e.clientY - rect.top;
      const cx    = rect.width  / 2;
      const cy    = rect.height / 2;
      const tiltX = ((y - cy) / cy) * 4;
      const tiltY = ((cx - x) / cx) * 4;
      card.style.transform   = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
      card.style.boxShadow   = `${-tiltY * 1.5}px ${tiltX * 1.5}px 30px rgba(0,0,0,0.13)`;
      card.style.transition  = 'none'; // Remove transition during active tilt for precision
    });

    card.addEventListener('mouseleave', function() {
      card.style.transform  = '';
      card.style.boxShadow  = '';
      card.style.transition = ''; // Restore CSS transition
    });
  });
})();


/* ═══════════════════════════════════════════════════════════
   7. AUTH — Signup / Login modal
   Talks to Express backend at localhost:5000
════════════════════════════════════════════════════════════ */
(function Auth() {

  const API = 'http://localhost:5000';

  // ── Elements ─────────────────────────────────────────────
  const overlay    = document.getElementById('auth-overlay');
  const signInLink = document.getElementById('sign-in-link');
  const closeBtn   = document.getElementById('auth-close');
  const tabLogin   = document.getElementById('tab-login');
  const tabSignup  = document.getElementById('tab-signup');
  const form       = document.getElementById('auth-form');
  const fieldName  = document.getElementById('field-name');
  const nameInput  = document.getElementById('auth-name');
  const emailInput = document.getElementById('auth-email');
  const passInput  = document.getElementById('auth-password');
  const errorBox   = document.getElementById('auth-error');
  const submitBtn  = document.getElementById('auth-submit');
  const titleEl    = document.getElementById('auth-title');
  const subtitleEl = document.getElementById('auth-subtitle');
  const switchText = document.getElementById('auth-switch-text');
  const switchBtn  = document.getElementById('auth-switch-btn');

  if (!overlay || !signInLink) return;

  let mode = 'login'; // 'login' | 'signup'

  // ── Restore session ───────────────────────────────────────
  const stored = localStorage.getItem('zenchaUser');
  if (stored) {
    try { updateNavForUser(JSON.parse(stored)); } catch(e) {}
  }

  // ── Open / Close ─────────────────────────────────────────
  function openModal() {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    emailInput.focus();
  }

  function closeModal() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    clearError();
    form.reset();
  }

  signInLink.addEventListener('click', function(e) {
    e.preventDefault();
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.style.display !== 'none') closeModal();
  });

  // ── Tab switching ─────────────────────────────────────────
  function setMode(m) {
    mode = m;
    clearError();

    if (mode === 'login') {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      fieldName.style.display = 'none';
      titleEl.textContent     = 'Welcome back';
      subtitleEl.textContent  = 'Sign in to your account';
      submitBtn.textContent   = 'Sign In';
      switchText.textContent  = "Don't have an account?";
      switchBtn.textContent   = 'Sign up';
    } else {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      fieldName.style.display = '';
      titleEl.textContent     = 'Create account';
      subtitleEl.textContent  = 'Join the matcha ritual';
      submitBtn.textContent   = 'Create Account';
      switchText.textContent  = 'Already have an account?';
      switchBtn.textContent   = 'Sign in';
    }
  }

  tabLogin.addEventListener('click', function() { setMode('login'); });
  tabSignup.addEventListener('click', function() { setMode('signup'); });
  switchBtn.addEventListener('click', function() {
    setMode(mode === 'login' ? 'signup' : 'login');
  });

  // ── Error helper ─────────────────────────────────────────
  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = '';
  }

  function clearError() {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }

  // ── Form submit → API call ────────────────────────────────
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearError();

    const email    = emailInput.value.trim();
    const password = passInput.value;
    const name     = nameInput ? nameInput.value.trim() : '';

    if (!email || !password) {
      showError('Email and password are required');
      return;
    }

    if (mode === 'signup' && !name) {
      showError('Name is required');
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Please wait...';

    console.log('Auth request:', mode, email);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body     = mode === 'login'
        ? { email, password }
        : { name, email, password };

      const res  = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.message || 'Something went wrong');
        return;
      }

      console.log('Auth success:', data.name, data.email);

      // Save token + user info
      localStorage.setItem('zenchaToken', data.token);
      localStorage.setItem('zenchaUser', JSON.stringify({
        name: data.name,
        email: data.email,
        isAdmin: data.isAdmin
      }));

      updateNavForUser(data);
      closeModal();

    } catch (err) {
      console.error('Auth fetch error:', err.message);
      showError('Cannot connect to server. Is the backend running?');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
    }
  });

  // ── Update nav after login ────────────────────────────────
  function updateNavForUser(user) {
    if (!signInLink) return;
    const firstName = user.name.split(' ')[0];

    // Replace the Sign In link with user name + logout
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
      location.reload();
    });
  }

})(); // end Auth
