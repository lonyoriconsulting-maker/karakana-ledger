// ---------- Data layer (localStorage) ----------
const STORE_KEY = 'karakana_entries_v1';

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Load failed', e);
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORE_KEY, JSON.stringify(entries));
}

function addEntry(entry) {
  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);
}

// ---------- Categories ----------
const CATEGORIES = {
  in: ['Huduma ya Gari', 'Vipuri Vilivyouzwa', 'Nyingine'],
  out: ['Chakula', 'Maji', 'Taka', 'Wafanyakazi', 'Vifaa vya Karakana', 'Nyingine']
};

// ---------- Helpers ----------
function fmt(n) {
  n = Math.round(n);
  return n.toLocaleString('en-US');
}

function todayKey(ts) {
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}

function isToday(ts) {
  return todayKey(ts) === todayKey(Date.now());
}

// ---------- State ----------
let currentType = 'in'; // 'in' | 'out'
let selectedCategory = null;

// ---------- Navigation ----------
const views = {
  home: document.getElementById('view-home'),
  report: document.getElementById('view-report'),
  settings: document.getElementById('view-settings')
};
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[btn.dataset.view].classList.remove('hidden');
    if (btn.dataset.view === 'report') renderReport(currentRange);
  });
});

// ---------- Gauge + Home render ----------
const GAUGE_CIRC = 2 * Math.PI * 88; // ~553

function renderHome() {
  const entries = loadEntries().filter(e => isToday(e.ts));
  const income = entries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);
  const net = income - expense;

  document.getElementById('today-in').textContent = fmt(income);
  document.getElementById('today-out').textContent = fmt(expense);
  document.getElementById('gauge-amount').textContent = (net >= 0 ? '' : '-') + fmt(Math.abs(net));

  const arc = document.getElementById('gauge-arc');
  const total = income + expense;
  const ratio = total > 0 ? Math.min(income / total, 1) : 0;
  const offset = GAUGE_CIRC - ratio * GAUGE_CIRC;
  arc.style.strokeDashoffset = total > 0 ? offset : GAUGE_CIRC;
  arc.style.stroke = net >= 0 ? getComputedStyle(document.documentElement).getPropertyValue('--green') : getComputedStyle(document.documentElement).getPropertyValue('--rust');

  const list = document.getElementById('today-list');
  list.innerHTML = '';
  if (entries.length === 0) {
    list.innerHTML = '<li class="empty-state">Hakuna kumbukumbu leo bado.<br>Bofya kitufe hapo juu kuanza.</li>';
    return;
  }
  entries.slice().reverse().forEach(e => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="entry-main">
        <span class="entry-cat">${e.category}</span>
        ${e.note ? `<span class="entry-note">${escapeHtml(e.note)}</span>` : ''}
      </div>
      <span class="entry-amount ${e.type}">${e.type === 'in' ? '+' : '-'}${fmt(e.amount)}</span>
    `;
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Modal ----------
const modal = document.getElementById('entry-modal');
const modalTitle = document.getElementById('modal-title');
const categoryGrid = document.getElementById('category-grid');
const amountInput = document.getElementById('input-amount');
const noteInput = document.getElementById('input-note');

function openModal(type) {
  currentType = type;
  selectedCategory = null;
  modalTitle.textContent = type === 'in' ? 'Ongeza Mapato' : 'Ongeza Matumizi';
  amountInput.value = '';
  noteInput.value = '';
  categoryGrid.innerHTML = '';
  CATEGORIES[type].forEach(cat => {
    const chip = document.createElement('div');
    chip.className = 'category-chip';
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedCategory = cat;
    });
    categoryGrid.appendChild(chip);
  });
  modal.classList.remove('hidden');
  setTimeout(() => amountInput.focus(), 100);
}

function closeModal() {
  modal.classList.add('hidden');
}

document.getElementById('btn-add-in').addEventListener('click', () => openModal('in'));
document.getElementById('btn-add-out').addEventListener('click', () => openModal('out'));
document.getElementById('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.getElementById('btn-save-entry').addEventListener('click', () => {
  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    amountInput.style.borderColor = 'var(--rust)';
    amountInput.focus();
    return;
  }
  if (!selectedCategory) {
    categoryGrid.style.outline = '2px solid var(--rust)';
    setTimeout(() => categoryGrid.style.outline = 'none', 800);
    return;
  }
  addEntry({
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    type: currentType,
    category: selectedCategory,
    amount: amount,
    note: noteInput.value.trim(),
    ts: Date.now()
  });
  closeModal();
  renderHome();
});

// ---------- Report ----------
let currentRange = '7';
document.querySelectorAll('.range-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.range-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentRange = tab.dataset.range;
    renderReport(currentRange);
  });
});

function renderReport(range) {
  const all = loadEntries();
  let cutoff = 0;
  if (range === '7') cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  else if (range === '30') cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const entries = range === 'all' ? all : all.filter(e => e.ts >= cutoff);

  const income = entries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);
  document.getElementById('report-in').textContent = fmt(income);
  document.getElementById('report-out').textContent = fmt(expense);
  document.getElementById('report-net').textContent = fmt(income - expense);

  const byCat = {};
  entries.filter(e => e.type === 'out').forEach(e => {
    byCat[e.category] = (byCat[e.category] || 0) + e.amount;
  });
  const catList = document.getElementById('category-breakdown');
  catList.innerHTML = '';
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    catList.innerHTML = '<li class="empty-state">Hakuna matumizi kwa kipindi hiki.</li>';
  } else {
    sorted.forEach(([cat, amt]) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${cat}</span><span class="entry-amount out">${fmt(amt)}</span>`;
      catList.appendChild(li);
    });
  }

  const fullList = document.getElementById('full-list');
  fullList.innerHTML = '';
  if (entries.length === 0) {
    fullList.innerHTML = '<li class="empty-state">Hakuna kumbukumbu.</li>';
  } else {
    entries.slice().reverse().forEach(e => {
      const li = document.createElement('li');
      const d = new Date(e.ts);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      li.innerHTML = `
        <div class="entry-main">
          <span class="entry-cat">${e.category}</span>
          <span class="entry-note">${dateStr}${e.note ? ' · ' + escapeHtml(e.note) : ''}</span>
        </div>
        <span class="entry-amount ${e.type}">${e.type === 'in' ? '+' : '-'}${fmt(e.amount)}</span>
      `;
      fullList.appendChild(li);
    });
  }
}

// ---------- Settings ----------
document.getElementById('btn-export').addEventListener('click', () => {
  const entries = loadEntries();
  let csv = 'Tarehe,Aina,Jamii,Kiasi,Maelezo\n';
  entries.forEach(e => {
    const d = new Date(e.ts).toISOString().slice(0, 10);
    const typeLabel = e.type === 'in' ? 'Mapato' : 'Matumizi';
    csv += `${d},${typeLabel},"${e.category}",${e.amount},"${(e.note || '').replace(/"/g, "'")}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `karakana-ledger-${todayKey(Date.now())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-clear').addEventListener('click', () => {
  if (confirm('Una uhakika unataka kufuta data yote? Hatua hii haiwezi kurudishwa.')) {
    localStorage.removeItem(STORE_KEY);
    renderHome();
    renderReport(currentRange);
  }
});

// ---------- Online/offline indicator ----------
function updateOnlineStatus() {
  const dot = document.getElementById('offline-dot');
  if (navigator.onLine) dot.classList.remove('offline');
  else dot.classList.add('offline');
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ---------- Service worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(err => console.error('SW failed', err));
  });
}

// ---------- Init ----------
renderHome();
