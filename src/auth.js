import { supabase } from '../supabase.js'

export function renderAuth(onLogin) {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-logo">Duit<span>Ku</span></div>
      <div class="auth-tagline">Catat keuangan pribadi lo.</div>
      <div class="auth-card">
        <div class="auth-title" id="authTitle">Masuk</div>
        <div class="auth-error" id="authError"></div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" id="authEmail" placeholder="email@contoh.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" id="authPassword" placeholder="Minimal 6 karakter">
        </div>
        <button class="btn-primary" id="authBtn">Masuk</button>
        <div class="auth-switch">
          <span id="authSwitchText">Belum punya akun?</span>
          <a id="authSwitchBtn"> Daftar</a>
        </div>
      </div>
    </div>
  `

  let isLogin = true

  document.getElementById('authSwitchBtn').addEventListener('click', () => {
    isLogin = !isLogin
    document.getElementById('authTitle').textContent = isLogin ? 'Masuk' : 'Daftar'
    document.getElementById('authBtn').textContent = isLogin ? 'Masuk' : 'Buat Akun'
    document.getElementById('authSwitchText').textContent = isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'
    document.getElementById('authSwitchBtn').textContent = isLogin ? ' Daftar' : ' Masuk'
    showError('')
  })

  document.getElementById('authBtn').addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value.trim()
    const password = document.getElementById('authPassword').value
    const btn = document.getElementById('authBtn')

    if (!email || !password) { showError('Email dan password wajib diisi.'); return }
    if (password.length < 6) { showError('Password minimal 6 karakter.'); return }

    btn.textContent = 'Loading...'
    btn.disabled = true

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { showError('Email atau password salah.'); resetBtn(); return }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { showError(error.message); resetBtn(); return }
      showError('✅ Akun dibuat! Silakan masuk.')
      resetBtn(); return
    }

    onLogin()
  })

  function showError(msg) {
    const el = document.getElementById('authError')
    el.textContent = msg
    el.className = 'auth-error' + (msg ? ' show' : '')
  }

  function resetBtn() {
    const btn = document.getElementById('authBtn')
    btn.textContent = isLogin ? 'Masuk' : 'Buat Akun'
    btn.disabled = false
  }
}