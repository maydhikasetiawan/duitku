import { showToast } from './src/toast.js'
import { supabase } from './supabase.js'
import { renderAuth } from './src/auth.js'
import {
  getSettings, saveSettings,
  getBankAccounts, addBankAccount, updateBankBalance, deleteBankAccount,
  getTransactions, addTransaction, voidTransaction,
  getBudgets, saveBudget,
  getGoals, addGoal, updateGoalSaved, deleteGoal,
} from './src/storage.js'
import { renderVerified } from './src/verified.js'
import { renderResetPassword } from './src/auth.js'
import { renderProfile, attachProfileListeners } from './src/profile.js'

// ── KATEGORI ──
const CATEGORIES = [
  { id:'makan', label:'🍜 Makan', emoji:'🍜' },
  { id:'transport', label:'🚗 Transport', emoji:'🚗' },
  { id:'belanja', label:'🛒 Belanja', emoji:'🛒' },
  { id:'tagihan', label:'⚡ Tagihan', emoji:'⚡' },
  { id:'hiburan', label:'🎮 Hiburan', emoji:'🎮' },
  { id:'kesehatan', label:'💊 Kesehatan', emoji:'💊' },
  { id:'lainnya', label:'📦 Lainnya', emoji:'📦' },
]

// ── STATE ──
let state = {
  settings: { kas:0, invest:0, emas_gram:0, emas_harga_manual:0 },
  banks: [],
  transactions: [],
  budgets: [],
  goals: [],
  txType: 'expense',
  txCategory: 'makan',
  goldPriceLive: 0,
  user: null,
}

// ── INIT ──
async function init() {
  // Cek apakah ini redirect dari konfirmasi email atau reset password
  const hash = window.location.hash
  const params = new URLSearchParams(hash.replace('#', '?'))
  const type = params.get('type')

  if (type === 'signup') {
    await supabase.auth.signOut()
    renderVerified()
    return
  }

  if (type === 'recovery') {
    renderResetPassword(() => init())
    return
  }

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    renderAuth(() => init())
    return
  }

  state.user = session.user
  document.getElementById('app').innerHTML = '<div style="padding:40px;text-align:center">⏳ Memuat data...</div>'

  // Load semua data dari Supabase
  const [settings, banks, transactions, budgets, goals] = await Promise.all([
    getSettings(),
    getBankAccounts(),
    getTransactions(),
    getBudgets(),
    getGoals(),
  ])

  state.settings = settings
  state.banks = banks
  state.transactions = transactions
  state.budgets = budgets
  state.goals = goals

  // Simpan nama dari registrasi ke database
  const pendingName = localStorage.getItem('duitku_pending_name')
  if (pendingName) {
    const { firstName, lastName } = JSON.parse(pendingName)
    if (firstName && !state.settings.first_name) {
      state.settings.first_name = firstName
      state.settings.last_name = lastName
      await saveSettings(state.settings)
    }
    localStorage.removeItem('duitku_pending_name')
  }

  renderApp()
  fetchGoldPrice()
}

// ── GOLD PRICE ──
async function fetchGoldPrice() {
  try {
    const r = await fetch('https://api.gold-api.com/price/XAU')
    const d = await r.json()
    const rr = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const rd = await rr.json()
    state.goldPriceLive = Math.round((d.price / 31.1035) * (rd.rates.IDR || 16000))
    renderApp()
  } catch(e) {
    state.goldPriceLive = 0
  }
}

// ── UTILS ──
function fmt(n) {
  const a = Math.abs(n)
  if (a >= 1e9) return 'Rp ' + (n/1e9).toFixed(1) + 'M'
  if (a >= 1e6) return 'Rp ' + (n/1e6).toFixed(1) + 'jt'
  return 'Rp ' + n.toLocaleString('id-ID')
}
function fmtS(n) {
  const a = Math.abs(n)
  if (a >= 1e9) return (n/1e9).toFixed(1) + 'M'
  if (a >= 1e6) return (n/1e6).toFixed(1) + 'jt'
  return n.toLocaleString('id-ID')
}
function getMonth() {
  return new Date().toLocaleDateString('id-ID', { month:'long', year:'numeric' })
}
function thisMonthTx() {
  const now = new Date()
  return state.transactions.filter(t => {
    if (t.voided) return false
    const d = new Date(t.date)
    return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()
  })
}
function getAccLabel(id) {
  if (id==='kas') return '💵 Kas'
  if (id==='invest') return '📈 Investasi'
  const b = state.banks.find(b => b.id===id)
  return b ? '🏦 '+b.name : '🏦 Bank'
}
function bankTotal() { return state.banks.reduce((s,b) => s+b.balance, 0) }
function emasVal() {
  const { emas_gram, emas_harga_manual } = state.settings
  const h = emas_harga_manual > 0 ? emas_harga_manual : state.goldPriceLive
  return h > 0 ? Math.round(emas_gram * h) : 0
}
function getBudgetAmount(category) {
  const b = state.budgets.find(b => b.category===category)
  return b ? b.amount : 0
}
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
}

// ── RENDER APP ──
function renderApp() {
  document.getElementById('app').innerHTML = `
    <div class="header">
      <div class="header-top">
        <div class="app-title">Duit<span>Ku</span></div>
        <div class="month-badge">${getMonth()}</div>
      </div>
    </div>
    <div class="main">
      <div class="page active" id="page-dashboard">${renderDashboard()}</div>
      <div class="page" id="page-akun">${renderAkun()}</div>
      <div class="page" id="page-budget">${renderBudget()}</div>
      <div class="page" id="page-goals">${renderGoals()}</div>
      <div class="page" id="page-profil">${renderProfile(state, () => init(), () => { renderApp() })}</div>
    </div>
    <button class="fab" id="fabBtn">+</button>
    <div class="bottom-nav">
      <button class="bottom-nav-item active" data-page="dashboard">
        <span class="nav-icon">🏠</span>Beranda
      </button>
      <button class="bottom-nav-item" data-page="akun">
        <span class="nav-icon">💰</span>Akun
      </button>
      <button class="bottom-nav-item" data-page="budget">
        <span class="nav-icon">🎯</span>Budget
      </button>
      <button class="bottom-nav-item" data-page="goals">
        <span class="nav-icon">🏆</span>Target
      </button>
      <button class="bottom-nav-item" data-page="profil">
        <span class="nav-icon">👤</span>Profil
      </button>
    </div>
    ${renderModal()}
  `
  attachEventListeners()
}

// ── RENDER PAGES ──
function renderDashboard() {
  const { kas, invest } = state.settings
  const bTotal = bankTotal(), eVal = emasVal()
  const total = kas + bTotal + invest + eVal
  const txs = thisMonthTx()
  const income = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
  const expense = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
  const recent = [...state.transactions].slice(0,15)

  return `
    <div class="networth-card">
      <div class="networth-label">Total Kekayaan Bersih</div>
      <div class="networth-amount">${fmt(total)}</div>
      <div class="networth-breakdown">
        <div class="breakdown-item"><div class="breakdown-icon">💵</div><div class="breakdown-label">Kas</div><div class="breakdown-val">Rp ${fmtS(kas)}</div></div>
        <div class="breakdown-item"><div class="breakdown-icon">🏦</div><div class="breakdown-label">Bank</div><div class="breakdown-val">Rp ${fmtS(bTotal)}</div></div>
        <div class="breakdown-item"><div class="breakdown-icon">📈</div><div class="breakdown-label">Investasi</div><div class="breakdown-val">Rp ${fmtS(invest+eVal)}</div></div>
      </div>
    </div>
    <div class="cashflow-row">
      <div class="cashflow-card income"><div class="cashflow-icon">↑</div><div class="cashflow-label">Pemasukan</div><div class="cashflow-amount">${fmt(income)}</div></div>
      <div class="cashflow-card expense"><div class="cashflow-icon">↓</div><div class="cashflow-label">Pengeluaran</div><div class="cashflow-amount">${fmt(expense)}</div></div>
    </div>
    <div class="section-title">Transaksi Terbaru</div>
    <div class="tx-list">
      ${recent.length ? recent.map(t => {
        const cat = CATEGORIES.find(c=>c.id===t.category)||{emoji:'📦'}
        const bg = t.voided?'#f0ece4':t.type==='income'?'#e8f3ee':'#f5e8e5'
        const d = new Date(t.date).toLocaleDateString('id-ID',{day:'numeric',month:'short'})
        return `<div class="tx-item${t.voided?' voided':''}">
          <div class="tx-icon-wrap" style="background:${bg}">${cat.emoji}</div>
          <div class="tx-info">
            <div class="tx-name">${t.voided?'[VOID] ':''}${escapeHtml(t.note||'Transaksi')}</div>
            <div class="tx-meta">${d} · ${getAccLabel(t.account_id)}</div>
          </div>
          <div class="tx-amount ${t.voided?'void-style':t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</div>
          ${!t.voided?`<button class="tx-void-btn" data-void="${t.id}">✕</button>`:''}
        </div>`
      }).join('') : '<div class="empty-state"><div class="empty-icon">📋</div><p>Belum ada transaksi.<br>Ketuk + untuk mulai mencatat.</p></div>'}
    </div>
  `
}

function renderAkun() {
  const { kas, invest, emas_gram, emas_harga_manual } = state.settings
  const h = emas_harga_manual > 0 ? emas_harga_manual : state.goldPriceLive
  const eVal = emasVal()

  return `
    <div class="section-title">Semua Akun</div>
    <div class="account-cards">
      <div class="account-card kas">
        <div class="account-icon">💵</div>
        <div class="account-info"><div class="account-name">Kas / Dompet</div><div class="account-sub">Uang tunai</div></div>
        <div class="account-balance" style="color:var(--gold)">${fmt(kas)}</div>
      </div>
      ${state.banks.map(b => `
        <div class="account-card bank">
          <div class="account-icon">🏦</div>
          <div class="account-info"><div class="account-name">${escapeHtml(b.name)}</div><div class="account-sub">Rekening bank</div></div>
          <div class="account-balance">${fmt(b.balance)}</div>
          <button class="account-del" data-delbank="${b.id}">🗑</button>
        </div>`).join('')}
      <div class="account-card invest">
        <div class="account-icon">📈</div>
        <div class="account-info"><div class="account-name">Investasi</div><div class="account-sub">Saham, reksa dana, dll</div></div>
        <div class="account-balance">${fmt(invest)}</div>
      </div>
      <div class="account-card emas">
        <div class="account-icon">🥇</div>
        <div class="account-info"><div class="account-name">Emas Pegadaian</div><div class="account-sub">${emas_gram||0} gram</div></div>
        <div>
          <div class="account-balance">${eVal>0?fmt(eVal):'—'}</div>
          <div class="gold-detail">${h>0?fmt(h)+'/gr'+(emas_harga_manual>0?' (manual)':' (live)'):'Atur di bawah'}</div>
        </div>
      </div>
    </div>

    <div class="section-title">Atur Saldo</div>
    <div class="card-box">
      <div class="form-group">
        <label class="form-label">Kas / Dompet (Rp)</label>
        <input class="form-input" type="number" id="initKas" value="${kas||''}" placeholder="0" inputmode="numeric">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Investasi (Rp)</label>
        <input class="form-input" type="number" id="initInvest" value="${invest||''}" placeholder="0" inputmode="numeric">
      </div>
      <div class="divider"></div>
      <button class="btn-primary" id="btnSaveBalances">Simpan Saldo</button>
    </div>

    <div class="section-title">🏦 Tambah Akun Bank</div>
    <div class="card-box">
      <div class="form-group">
        <label class="form-label">Nama Bank</label>
        <input class="form-input" type="text" id="newBankName" placeholder="Contoh: BCA, BRI, Jenius...">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Saldo Awal (Rp)</label>
        <input class="form-input" type="number" id="newBankBalance" placeholder="0" inputmode="numeric">
      </div>
      <div class="divider"></div>
      <button class="btn-primary" id="btnAddBank" style="background:var(--blue)">+ Tambah Akun Bank</button>
    </div>

    <div class="section-title">🥇 Emas Pegadaian Tring</div>
    <div class="card-box">
      <div class="form-group">
        <label class="form-label">Jumlah Emas (gram)</label>
        <input class="form-input" type="number" id="initEmasGram" value="${emas_gram||''}" placeholder="0.00" inputmode="decimal" step="0.01">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Override Harga/Gram (Rp) — kosongkan untuk otomatis</label>
        <input class="form-input" type="number" id="initEmasHarga" value="${emas_harga_manual||''}" placeholder="Otomatis dari internet" inputmode="numeric">
      </div>
      <div class="divider"></div>
      <button class="btn-primary" id="btnSaveEmas" style="background:var(--gold)">Simpan Emas</button>
    </div>
  `
}

function renderBudget() {
  const txs = thisMonthTx().filter(t=>t.type==='expense')
  const totalB = CATEGORIES.reduce((s,c)=>s+getBudgetAmount(c.id),0)
  const totalS = txs.reduce((s,t)=>s+t.amount,0)
  const rem = totalB - totalS

  return `
    <div class="budget-header-card">
      <div><div class="budget-total-label">Total Budget</div><div class="budget-total-val">${fmt(totalB)}</div></div>
      <div><div class="budget-remaining-label">Sisa</div><div class="budget-remaining-val" style="color:${rem<0?'var(--accent)':'var(--green)'}">${fmt(Math.abs(rem))}</div></div>
    </div>
    <div class="section-title">Budget per Kategori</div>
    <div class="budget-list">
      ${CATEGORIES.map(cat => {
        const budget = getBudgetAmount(cat.id)
        const spent = txs.filter(t=>t.category===cat.id).reduce((s,t)=>s+t.amount,0)
        if (budget===0 && spent===0) return ''
        const pct = budget>0?Math.min((spent/budget)*100,100):spent>0?100:0
        const bc = pct>=100?'bar-over':pct>=80?'bar-warn':'bar-ok'
        return `<div class="budget-item">
          <div class="budget-item-header">
            <div style="display:flex;align-items:center;gap:8px"><span>${cat.emoji}</span><span style="font-size:14px;font-weight:500">${cat.label.replace(/^.+ /,'')}</span></div>
            <div style="font-size:12px;color:var(--ink-muted)">${fmt(spent)} / ${fmt(budget)}</div>
          </div>
          <div class="budget-bar-track"><div class="budget-bar-fill ${bc}" style="width:${pct}%"></div></div>
        </div>`
      }).join('')||'<div class="empty-state"><div class="empty-icon">🎯</div><p>Atur budget di bawah.</p></div>'}
    </div>
    <div class="card-box">
      <div style="font-family:\'DM Serif Display\',serif;font-size:18px;margin-bottom:16px;">Atur Budget</div>
      ${CATEGORIES.map(c=>`
        <div class="form-group">
          <label class="form-label">${c.emoji} ${c.label.replace(/^.+ /,'')} (Rp)</label>
          <input class="form-input" type="number" id="budget_${c.id}" placeholder="0" inputmode="numeric" value="${getBudgetAmount(c.id)||''}">
        </div>`).join('')}
      <button class="btn-primary" id="btnSaveBudgets">Simpan Budget</button>
    </div>
  `
}

function renderGoals() {
  return `
    <div class="section-title">Target Tabungan Berjangka</div>
    ${state.goals.length ? state.goals.map(g => {
      const needed = Math.max(0, g.target-g.saved)
      const perMonth = g.months>0?Math.ceil(needed/g.months):0
      const pct = g.target>0?Math.min(Math.round((g.saved/g.target)*100),100):0
      const done = new Date(); done.setMonth(done.getMonth()+g.months)
      const doneStr = done.toLocaleDateString('id-ID',{month:'long',year:'numeric'})
      return `<div class="goal-card">
        <div class="goal-header">
          <div style="display:flex;align-items:center">
            <span class="goal-emoji">${g.emoji||'🎯'}</span>
            <div><div class="goal-title">${escapeHtml(g.name)}</div><div class="goal-sub">Target: ${fmt(g.target)} · ${g.months} bulan</div></div>
          </div>
          <button class="goal-del" data-delgoal="${g.id}">🗑</button>
        </div>
        <div class="goal-stats">
          <div class="goal-stat"><div class="goal-stat-label">Terkumpul</div><div class="goal-stat-val" style="color:var(--green)">${fmt(g.saved)}</div></div>
          <div class="goal-stat"><div class="goal-stat-label">Kurang</div><div class="goal-stat-val" style="color:var(--accent)">${fmt(needed)}</div></div>
          <div class="goal-stat"><div class="goal-stat-label">Tabung/bulan</div><div class="goal-stat-val" style="color:var(--blue)">${fmt(perMonth)}</div></div>
          <div class="goal-stat"><div class="goal-stat-label">Est. Selesai</div><div class="goal-stat-val" style="font-size:12px">${pct>=100?'✅ Tercapai!':doneStr}</div></div>
        </div>
        <div class="goal-progress-track"><div class="goal-progress-fill" style="width:${pct}%"></div></div>
        <div class="goal-progress-label">${pct}% tercapai</div>
        <button class="btn-secondary" style="margin-top:10px;font-size:13px;padding:10px" data-updategoal="${g.id}" data-currentsaved="${g.saved}">✏️ Update dana terkumpul</button>
      </div>`
    }).join('') : '<div class="empty-state" style="padding:24px 0"><div class="empty-icon">🏆</div><p>Belum ada target.<br>Tambah target di bawah.</p></div>'}
    <div class="card-box">
      <div style="font-family:\'DM Serif Display\',serif;font-size:18px;margin-bottom:16px;">+ Target Baru</div>
      <div class="form-group"><label class="form-label">Nama Target</label><input class="form-input" type="text" id="goalName" placeholder="Contoh: Laptop baru..."></div>
      <div class="form-group"><label class="form-label">Emoji</label><input class="form-input" type="text" id="goalEmoji" placeholder="💻" maxlength="2" style="font-size:22px;text-align:center"></div>
      <div class="form-group"><label class="form-label">Harga Target (Rp)</label><input class="form-input" type="number" id="goalTarget" placeholder="0" inputmode="numeric"></div>
      <div class="form-group"><label class="form-label">Dana yang Sudah Ada (Rp)</label><input class="form-input" type="number" id="goalSaved" placeholder="0" inputmode="numeric"></div>
      <div class="form-group"><label class="form-label">Target Selesai dalam (bulan)</label><input class="form-input" type="number" id="goalMonths" placeholder="12" inputmode="numeric"></div>
      <button class="btn-primary" id="btnAddGoal" style="background:var(--blue)">Simpan Target</button>
    </div>
  `
}

function renderModal() {
  const bankOptions = state.banks.map(b=>`<option value="${b.id}">🏦 ${escapeHtml(b.name)}</option>`).join('')
  return `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-title">Catat Transaksi</div>
        <div class="type-toggle">
          <button class="type-btn active expense" id="btnExpense">↓ Pengeluaran</button>
          <button class="type-btn income" id="btnIncome">↑ Pemasukan</button>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah (Rp)</label>
          <input class="form-input" type="number" id="txAmount" placeholder="0" inputmode="numeric">
        </div>
        <div class="form-group">
          <label class="form-label">Keterangan</label>
          <input class="form-input" type="text" id="txNote" placeholder="Contoh: Makan siang, Gaji...">
        </div>
        <div class="form-group">
          <label class="form-label">Dari Akun</label>
          <select class="form-select" id="txAccount">
            <option value="kas">💵 Kas / Dompet</option>
            ${bankOptions}
            <option value="invest">📈 Investasi</option>
          </select>
        </div>
        <div class="form-group" id="categoryGroup">
          <label class="form-label">Kategori</label>
          <div class="chip-group">
            ${CATEGORIES.map(c=>`<div class="chip ${c.id===state.txCategory?'active':''}" data-cat="${c.id}">${c.label}</div>`).join('')}
          </div>
        </div>
        <button class="btn-primary" id="btnSaveTx">Simpan Transaksi</button>
        <button class="btn-secondary" id="btnCloseModal">Batal</button>
      </div>
    </div>
  `
}

// ── EVENT LISTENERS ──
function attachEventListeners() {
  // Bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page
      if (page === 'profil') {
        document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'))
        document.querySelectorAll('.bottom-nav-item').forEach(b=>b.classList.remove('active'))
        document.getElementById('page-profil').classList.add('active')
        btn.classList.add('active')
        attachProfileListeners(state, () => init(), () => renderApp())
        return
      }
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'))
      document.querySelectorAll('.bottom-nav-item').forEach(b=>b.classList.remove('active'))
      document.getElementById('page-'+page).classList.add('active')
      btn.classList.add('active')
    })
  })

  // FAB
  document.getElementById('fabBtn').addEventListener('click', () => {
    document.getElementById('modalOverlay').classList.add('open')
    setTimeout(()=>document.getElementById('txAmount').focus(), 300)
  })

  // Modal close
  document.getElementById('btnCloseModal').addEventListener('click', closeModal)
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal()
  })

  // TX type toggle
  document.getElementById('btnExpense').addEventListener('click', () => setTxType('expense'))
  document.getElementById('btnIncome').addEventListener('click', () => setTxType('income'))

  // Category chips
  document.querySelectorAll('.chip[data-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
      state.txCategory = chip.dataset.cat
      document.querySelectorAll('.chip[data-cat]').forEach(c=>c.classList.remove('active'))
      chip.classList.add('active')
    })
  })

  // Save transaction
  document.getElementById('btnSaveTx').addEventListener('click', handleSaveTx)

  // Void transaction
  document.querySelectorAll('.tx-void-btn[data-void]').forEach(btn => {
    btn.addEventListener('click', () => handleVoidTx(btn.dataset.void))
  })

  // Save balances
  document.getElementById('btnSaveBalances')?.addEventListener('click', handleSaveBalances)

  // Add bank
  document.getElementById('btnAddBank')?.addEventListener('click', handleAddBank)

  // Delete bank
  document.querySelectorAll('[data-delbank]').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteBank(btn.dataset.delbank))
  })

  // Save emas
  document.getElementById('btnSaveEmas')?.addEventListener('click', handleSaveEmas)

  // Save budgets
  document.getElementById('btnSaveBudgets')?.addEventListener('click', handleSaveBudgets)

  // Add goal
  document.getElementById('btnAddGoal')?.addEventListener('click', handleAddGoal)

  // Delete goal
  document.querySelectorAll('[data-delgoal]').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteGoal(btn.dataset.delgoal))
  })

  // Update goal saved
  document.querySelectorAll('[data-updategoal]').forEach(btn => {
    btn.addEventListener('click', () => handleUpdateGoalSaved(btn.dataset.updategoal, btn.dataset.currentsaved))
  })
}

// ── HANDLERS ──
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open')
  document.getElementById('txAmount').value = ''
  document.getElementById('txNote').value = ''
}

function setTxType(type) {
  state.txType = type
  document.getElementById('btnExpense').className = 'type-btn'+(type==='expense'?' active expense':'')
  document.getElementById('btnIncome').className = 'type-btn'+(type==='income'?' active income':'')
  document.getElementById('categoryGroup').style.display = type==='expense'?'block':'none'
}

async function handleSaveTx() {
  const amount = parseInt(document.getElementById('txAmount').value)
  const note = document.getElementById('txNote').value.trim()
  const account_id = document.getElementById('txAccount').value
  if (!amount || amount<=0) { showToast('Gagal menyimpan transaksi.', 'error'); return }

  const btn = document.getElementById('btnSaveTx')
  btn.textContent = 'Menyimpan...'; btn.disabled = true

  const tx = {
    type: state.txType, amount,
    note: note||(state.txType==='income'?'Pemasukan':'Pengeluaran'),
    account_id,
    category: state.txType==='expense'?state.txCategory:'lainnya',
    date: new Date().toISOString(),
    voided: false,
  }

  const saved = await addTransaction(tx)
  if (!saved) { showToast('Gagal menyimpan transaksi.', 'error'); btn.textContent='Simpan Transaksi'; btn.disabled=false; return }

  // Update saldo
  if (account_id==='kas'||account_id==='invest') {
    const key = account_id==='kas'?'kas':'invest'
    if (state.txType==='expense') state.settings[key] = Math.max(0, state.settings[key]-amount)
    else state.settings[key] += amount
    await saveSettings(state.settings)
  } else {
    const bank = state.banks.find(b=>b.id===account_id)
    if (bank) {
      if (state.txType==='expense') bank.balance = Math.max(0, bank.balance-amount)
      else bank.balance += amount
      await updateBankBalance(account_id, bank.balance)
    }
  }

  state.transactions.unshift(saved)
  closeModal()
  renderApp()
}

async function handleVoidTx(id) {
  if (!confirm('Void transaksi ini? Saldo akun akan dikembalikan.')) return
  const tx = state.transactions.find(t=>t.id==id)
  if (!tx||tx.voided) return

  const ok = await voidTransaction(id)
  if (!ok) { showToast('Gagal void transaksi.', 'error'); return }

  tx.voided = true
  if (tx.account_id==='kas'||tx.account_id==='invest') {
    const key = tx.account_id==='kas'?'kas':'invest'
    if (tx.type==='expense') state.settings[key] += tx.amount
    else state.settings[key] = Math.max(0, state.settings[key]-tx.amount)
    await saveSettings(state.settings)
  } else {
    const bank = state.banks.find(b=>b.id===tx.account_id)
    if (bank) {
      if (tx.type==='expense') bank.balance += tx.amount
      else bank.balance = Math.max(0, bank.balance-tx.amount)
      await updateBankBalance(tx.account_id, bank.balance)
    }
  }
  renderApp()
}

async function handleSaveBalances() {
  state.settings.kas = parseInt(document.getElementById('initKas').value)||0
  state.settings.invest = parseInt(document.getElementById('initInvest').value)||0
  const ok = await saveSettings(state.settings)
  if (ok) { showToast('✅ Saldo disimpan!'); renderApp() }
  else showToast('Gagal menyimpan.', 'error')
}

async function handleAddBank() {
  const name = document.getElementById('newBankName').value.trim()
  const balance = parseInt(document.getElementById('newBankBalance').value)||0
  if (!name) { alert('Masukkan nama bank.'); return }
  const ok = await addBankAccount(name, balance)
  if (ok) {
    state.banks = await getBankAccounts()
    showToast('✅ Akun ' + name + ' ditambahkan!')
    renderApp()
  } else showToast('Gagal menambah akun.', 'error')
}

async function handleDeleteBank(id) {
  if (!confirm('Hapus akun bank ini?')) return
  const ok = await deleteBankAccount(id)
  if (ok) {
    state.banks = state.banks.filter(b=>b.id!==id)
    renderApp()
  } else showToast('Gagal menghapus akun.', 'error')
}

async function handleSaveEmas() {
  state.settings.emas_gram = parseFloat(document.getElementById('initEmasGram').value)||0
  state.settings.emas_harga_manual = parseInt(document.getElementById('initEmasHarga').value)||0
  const ok = await saveSettings(state.settings)
  if (ok) { showToast('✅ Data emas disimpan!'); renderApp() }
  else showToast('Gagal menyimpan.', 'error')
}

async function handleSaveBudgets() {
  const btn = document.getElementById('btnSaveBudgets')
  btn.textContent = 'Menyimpan...'; btn.disabled = true
  for (const c of CATEGORIES) {
    const amount = parseInt(document.getElementById('budget_'+c.id).value)||0
    await saveBudget(c.id, amount)
    const existing = state.budgets.find(b=>b.category===c.id)
    if (existing) existing.amount = amount
    else state.budgets.push({ category: c.id, amount })
  }
  showToast('✅ Budget disimpan!')
  renderApp()
}

async function handleAddGoal() {
  const name = document.getElementById('goalName').value.trim()
  const emoji = document.getElementById('goalEmoji').value.trim()||'🎯'
  const target = parseInt(document.getElementById('goalTarget').value)||0
  const saved = parseInt(document.getElementById('goalSaved').value)||0
  const months = parseInt(document.getElementById('goalMonths').value)||0
  if (!name||target<=0||months<=0) { alert('Lengkapi semua field.'); return }
  const ok = await addGoal({ name, emoji, target, saved, months })
  if (ok) {
    state.goals = await getGoals()
    showToast('✅ Target "' + name + '" disimpan!')
    renderApp()
  } else showToast('Gagal menyimpan target.', 'error')
}

async function handleDeleteGoal(id) {
  if (!confirm('Hapus target ini?')) return
  const ok = await deleteGoal(id)
  if (ok) {
    state.goals = state.goals.filter(g=>g.id!=id)
    renderApp()
  } else showToast('Gagal menghapus target.', 'error')
}

async function handleUpdateGoalSaved(id, currentSaved) {
  const v = prompt('Update dana yang sudah terkumpul (Rp):', currentSaved)
  if (v===null) return
  const val = parseInt(v)
  if (isNaN(val)||val<0) { showToast('Angka tidak valid.', 'error'); return }
  const ok = await updateGoalSaved(id, val)
  if (ok) {
    const g = state.goals.find(g=>g.id==id)
    if (g) g.saved = val
    renderApp()
  } else showToast('Gagal update.', 'error')
}

async function handleLogout() {
  if (!confirm('Yakin mau keluar?')) return
  await supabase.auth.signOut()
  init()
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('✅ Service Worker registered'))
      .catch(err => console.log('SW error:', err))
  })
}
init()