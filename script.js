(function () {
  'use strict';

  /* ---------- config ---------- */
  // Paste Udith's LinkedIn profile URL here (e.g. 'https://www.linkedin.com/in/your-handle').
  // While this is empty, the button opens a LinkedIn people search for his name instead.
  var LINKEDIN_URL = '';
  var TOTAL_FROGS = 5;
  var STORE_THEME = 'udith-theme';
  var STORE_FROGS = 'udith-frogs';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function load(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function save(key, val) { try { window.localStorage.setItem(key, val); } catch (e) { /* storage unavailable */ } }

  /* ---------- toast ---------- */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth; // restart animation
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- soil speckle texture ---------- */
  (function speckle() {
    var c = document.createElement('canvas');
    c.width = c.height = 48;
    var ctx = c.getContext('2d');
    for (var y = 0; y < 48; y++) {
      for (var x = 0; x < 48; x++) {
        var r = Math.random();
        if (r < 0.07) { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x, y, 1, 1); }
        else if (r < 0.16) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, y, 1, 1); }
      }
    }
    root.style.setProperty('--speckle', 'url(' + c.toDataURL('image/png') + ')');
  })();

  /* ---------- stars (visible at night) ---------- */
  (function stars() {
    var host = $('.stars');
    if (!host) return;
    for (var i = 0; i < 46; i++) {
      var s = document.createElement('i');
      s.style.left = (Math.random() * 100).toFixed(1) + '%';
      s.style.top = (Math.random() * 70).toFixed(1) + '%';
      s.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
      if (Math.random() < 0.25) s.className = 'big';
      host.appendChild(s);
    }
  })();

  /* ---------- language meters ---------- */
  $$('.meter').forEach(function (m) {
    var lvl = parseInt(m.getAttribute('data-level'), 10) || 0;
    for (var i = 0; i < 5; i++) {
      var b = document.createElement('i');
      if (i < lvl) b.className = 'on';
      m.appendChild(b);
    }
  });

  /* ---------- theme ---------- */
  var toggle = $('#themeToggle');
  var themeColor = $('meta[name="theme-color"]');
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var night = theme === 'night';
    if (toggle) {
      toggle.setAttribute('aria-pressed', night ? 'true' : 'false');
      var lab = $('.toggle-label', toggle);
      if (lab) lab.textContent = night ? 'NIGHT' : 'DAY';
    }
    if (themeColor) themeColor.setAttribute('content', night ? '#141a3d' : '#8fd3f4');
    window.Sprites.renderAll(document, night);
  }
  var saved = load(STORE_THEME);
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved ? saved : (prefersDark ? 'night' : 'day'));
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'night' ? 'day' : 'night';
      applyTheme(next);
      save(STORE_THEME, next);
    });
  }

  /* ---------- depth meter ---------- */
  var depthEl = $('#depth');
  var ticking = false;
  function updateDepth() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (depthEl) depthEl.textContent = 'DEPTH ' + Math.round(pct * 120) + 'm';
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateDepth); }
  }, { passive: true });
  updateDepth();

  /* ---------- hidden frogs ---------- */
  var frogs = $$('.hidden-frog');
  var found = [];
  var raw = load(STORE_FROGS);
  if (raw) { try { found = JSON.parse(raw) || []; } catch (e) { found = []; } }
  var countEl = $('#frogCount');
  var statEl = $('#statFrogs');

  frogs.forEach(function (btn) {
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.setAttribute('data-sprite', 'frog');
    cv.setAttribute('data-pal', btn.getAttribute('data-pal') || 'green');
    cv.setAttribute('data-scale', btn.getAttribute('data-scale') || '3');
    btn.appendChild(cv);
    window.Sprites.paint(cv, 'frog', btn.getAttribute('data-pal'), parseFloat(btn.getAttribute('data-scale')) || 3);
  });

  function refreshCount() {
    if (countEl) countEl.textContent = 'FROGS ' + found.length + '/' + TOTAL_FROGS;
    if (statEl) statEl.textContent = found.length + '/' + TOTAL_FROGS;
    root.classList.toggle('all-frogs', found.length >= TOTAL_FROGS);
  }

  function markFound(btn, silent) {
    btn.classList.add('found');
    btn.setAttribute('aria-label', 'Frog found');
    if (!silent) { btn.classList.add('hop'); }
  }

  frogs.forEach(function (btn) {
    var id = btn.getAttribute('data-frog');
    if (found.indexOf(id) !== -1) markFound(btn, true);
    btn.addEventListener('click', function () {
      if (found.indexOf(id) !== -1) { toast('RIBBIT! You already found this one.'); return; }
      found.push(id);
      save(STORE_FROGS, JSON.stringify(found));
      markFound(btn, false);
      refreshCount();
      if (found.length >= TOTAL_FROGS) {
        toast('ALL 5 FROGS FOUND! Sharp eyes, field herpetologist.');
        confetti();
      } else {
        toast('RIBBIT! Frog ' + found.length + ' of ' + TOTAL_FROGS + ' found.');
      }
    });
  });
  refreshCount();

  function confetti() {
    if (reduceMotion) return;
    var colors = ['#4caf3a', '#f08a24', '#3b82d6', '#f2cf2c', '#ff4d4d'];
    for (var i = 0; i < 40; i++) {
      var p = document.createElement('i');
      p.className = 'confetti';
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      p.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
      document.body.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 3600); })(p);
    }
  }

  /* ---------- copy email ---------- */
  var emailEl = $('#emailText');
  var statusEl = $('#copyStatus');

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  $$('.js-copy-email').forEach(function (btn) {
    var original = btn.textContent;
    btn.addEventListener('click', function () {
      var email = (emailEl ? emailEl.textContent : '').trim();
      copyText(email).then(function (ok) {
        if (ok) {
          btn.textContent = 'Copied!';
          btn.classList.add('is-copied');
          if (statusEl) statusEl.textContent = 'Copied ' + email + ' to your clipboard.';
          toast('Email copied to clipboard!');
          setTimeout(function () { btn.textContent = original; btn.classList.remove('is-copied'); }, 2000);
        } else {
          if (statusEl) statusEl.textContent = 'Could not copy automatically. Select the address above and press Ctrl+C.';
          if (emailEl) {
            var range = document.createRange();
            range.selectNodeContents(emailEl);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
          toast('Select the address and press Ctrl+C');
        }
      });
    });
  });

  /* ---------- linkedin ---------- */
  var li = $('#linkedinLink');
  if (li && LINKEDIN_URL) li.setAttribute('href', LINKEDIN_URL);
})();
