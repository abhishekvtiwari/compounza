/* ═══════════════════════════════════════
   COMPOUNZA — Shared JS
   ═══════════════════════════════════════ */

/* ── Theme ── */
(function () {
  const saved = localStorage.getItem('cz-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeUI(saved);
})();

function updateThemeUI(theme) {
  const icon = document.querySelector('.theme-icon');
  const label = document.querySelector('.theme-label');
  if (icon) icon.textContent = theme === 'dark' ? '☀' : '☾';
  if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cz-theme', next);
  updateThemeUI(next);
  if (typeof onThemeChange === 'function') onThemeChange();
}

/* ── Mobile menu ── */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
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

function fmtPct(v) { return v.toFixed(2) + '%'; }

/* ── CSS variable reader ── */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ── Chart theme ── */
function chartTheme() {
  const dk = document.documentElement.getAttribute('data-theme') === 'dark';
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
function gn(id) { return parseFloat(document.getElementById(id).value) || 0; }

/* ── Set text ── */
function st(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

/* ── Sync number → range ── */
function syncNR(nId, rId, lo, hi) {
  const v = parseFloat(document.getElementById(nId).value) || 0;
  document.getElementById(rId).value = Math.max(lo, Math.min(hi, v));
}
/* ── Sync range → number ── */
function syncRN(rId, nId) {
  document.getElementById(nId).value = document.getElementById(rId).value;
}

/* ── Unified chart factory ── */
const _charts = {};
function mkChart(id, labels, datasets) {
  if (_charts[id]) { _charts[id].destroy(); }
  const t = chartTheme();
  _charts[id] = new Chart(document.getElementById(id), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: t.bg, borderColor: t.bc, borderWidth: 1,
          titleColor: t.tc, bodyColor: t.tx, padding: 12, cornerRadius: 10,
          callbacks: {
            label: c => '  ' + c.dataset.label + ': ' + fmt(c.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { color: t.grid },
          ticks: {
            font: { family: "'Geist Mono', monospace", size: 10, weight: '500' },
            color: t.tick, autoSkip: true, maxTicksLimit: 10
          }
        },
        y: {
          grid: { color: t.grid },
          ticks: {
            font: { family: "'Geist Mono', monospace", size: 10, weight: '500' },
            color: t.tick, callback: v => fmtShort(v)
          }
        }
      }
    }
  });
}

/* ── Donut chart (native canvas) ── */
function drawDonut(id, segments) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const size = 140, cx = 70, cy = 70, R = 56, W = 18;
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  if (!total) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.arc(cx, cy, R - W, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    return;
  }
  const GAP = 0.012;
  let start = -Math.PI / 2;
  segments.forEach(seg => {
    const v = Math.max(0, seg.value);
    if (v < 0.001) return;
    const sweep = (v / total) * Math.PI * 2;
    if (sweep < 0.001) return;
    const end = start + sweep - GAP;
    ctx.beginPath();
    ctx.arc(cx, cy, R, start, end);
    ctx.arc(cx, cy, R - W, end, start, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    start += sweep;
  });
}
