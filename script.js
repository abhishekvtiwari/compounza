/* ═══════════════════════════════════════
   COMPOUNZA — Shared JS
   All functions are defined first, then
   the init IIFE runs at bottom after DOM.
   ═══════════════════════════════════════ */

/* ── Theme ── */
function updateThemeUI(theme) {
  var icons  = document.querySelectorAll('.theme-icon');
  var labels = document.querySelectorAll('.theme-label');
  icons.forEach(function(el)  { el.textContent = theme === 'dark' ? '☀' : '☾'; });
  labels.forEach(function(el) { el.textContent = theme === 'dark' ? 'Light' : 'Dark'; });
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cz-theme', next);
  updateThemeUI(next);
  if (typeof onThemeChange === 'function') onThemeChange();
}

/* ── Mobile menu ── */
function toggleMobileMenu() {
  var menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

/* ── Format helpers ── */
function fmt(v) {
  v = Math.round(v);
  if (v >= 10000000) return '₹' + (v / 10000000).toFixed(2) + ' Cr';
  if (v >= 100000)   return '₹' + (v / 100000).toFixed(2) + ' L';
  return '₹' + v.toLocaleString('en-IN');
}

function fmtShort(v) {
  v = Math.round(v);
  if (v >= 10000000) return (v / 10000000).toFixed(1) + 'Cr';
  if (v >= 100000)   return (v / 100000).toFixed(1) + 'L';
  if (v >= 1000)     return (v / 1000).toFixed(1) + 'K';
  return String(v);
}

/* ── CSS variable reader ── */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ── Chart theme ── */
function chartTheme() {
  var dk = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    bg:   dk ? '#161d28' : '#ffffff',
    bc:   dk ? '#1e2733' : '#e2e8f0',
    tc:   dk ? '#6b7a8d' : '#6b7280',
    tx:   dk ? '#e8edf5' : '#0d1117',
    grid: dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    tick: dk ? '#4a5568' : '#9ca3af',
  };
}

/* ── Get number from input ── */
function gn(id) {
  var el = document.getElementById(id);
  return el ? (parseFloat(el.value) || 0) : 0;
}

/* ── Set text ── */
function st(id, v) {
  var e = document.getElementById(id);
  if (e) e.textContent = v;
}

/* ── Sync number → range ── */
function syncNR(nId, rId, lo, hi) {
  var el = document.getElementById(nId);
  if (!el) return;
  var v = parseFloat(el.value) || 0;
  var clamped = Math.max(lo, Math.min(hi, v));
  var r = document.getElementById(rId);
  if (r) r.value = clamped;
  updateSliderFill(rId);
}

/* ── Sync range → number ── */
function syncRN(rId, nId) {
  var r = document.getElementById(rId);
  var n = document.getElementById(nId);
  if (r && n) n.value = r.value;
  updateSliderFill(rId);
}

/* ── Slider fill ── */
function updateSliderFill(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var min = parseFloat(el.min) || 0;
  var max = parseFloat(el.max) || 100;
  var val = parseFloat(el.value) || 0;
  var pct = ((val - min) / (max - min)) * 100;
  el.style.setProperty('--fill', pct.toFixed(2) + '%');
}

/* ── Init all sliders ── */
function initSliders() {
  document.querySelectorAll('input[type="range"]').forEach(function(el) {
    updateSliderFill(el.id);
  });
}

/* ── Chart factory ── */
var _charts = {};
function mkChart(id, labels, datasets) {
  if (_charts[id]) { _charts[id].destroy(); }
  var t = chartTheme();
  var canvas = document.getElementById(id);
  if (!canvas) return;
  _charts[id] = new Chart(canvas, {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: t.bg, borderColor: t.bc, borderWidth: 1,
          titleColor: t.tc, bodyColor: t.tx, padding: 12, cornerRadius: 10,
          callbacks: {
            label: function(c) { return '  ' + c.dataset.label + ': ' + fmt(c.parsed.y); }
          }
        }
      },
      scales: {
        x: {
          grid: { color: t.grid },
          ticks: { font: { family: "'Geist Mono', monospace", size: 10, weight: '500' }, color: t.tick, autoSkip: true, maxTicksLimit: 10 }
        },
        y: {
          grid: { color: t.grid },
          ticks: { font: { family: "'Geist Mono', monospace", size: 10, weight: '500' }, color: t.tick, callback: function(v) { return fmtShort(v); } }
        }
      }
    }
  });
}

/* ── Donut chart ── */
function drawDonut(id, segments) {
  var canvas = document.getElementById(id);
  if (!canvas) return;
  var size = 140, cx = 70, cy = 70, R = 56, W = 18;
  canvas.width = size; canvas.height = size;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  var total = segments.reduce(function(s, seg) { return s + Math.max(0, seg.value); }, 0);
  if (!total) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.arc(cx, cy, R - W, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    return;
  }
  var GAP = 0.012;
  var start = -Math.PI / 2;
  segments.forEach(function(seg) {
    var v = Math.max(0, seg.value);
    if (v < 0.001) return;
    var sweep = (v / total) * Math.PI * 2;
    if (sweep < 0.001) return;
    var end = start + sweep - GAP;
    ctx.beginPath();
    ctx.arc(cx, cy, R, start, end);
    ctx.arc(cx, cy, R - W, end, start, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    start += sweep;
  });
}

/* ── INIT: runs after DOM is ready ── */
document.addEventListener('DOMContentLoaded', function() {
  /* Restore saved theme and update UI */
  var saved = localStorage.getItem('cz-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeUI(saved);

  /* Close mobile menu on link click */
  document.querySelectorAll('.mobile-link').forEach(function(l) {
    l.addEventListener('click', function() {
      var menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.remove('open');
    });
  });
});
