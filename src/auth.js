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

        <div id="registerFields" style="display:none">
          <div class="form-group">
            <label class="form-label">Nama Depan</label>
            <input class="form-input" type="text" id="authFirstName" placeholder="Contoh: Maydhika">
          </div>
          <div class="form-group">
            <label class="form-label">Nama Belakang</label>
            <input class="form-input" type="text" id="authLastName" placeholder="Contoh: Putra">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" id="authEmail" placeholder="email@contoh.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" id="authPassword" placeholder="Minimal 6 karakter">
        </div>

        <div id="forgotPassword" style="text-align:right;margin-top:-8px;margin-bottom:16px;display:block">
          <a id="btnForgotPassword" style="font-size:13px;color:var(--accent);cursor:pointer;font-weight:500;">Lupa password?</a>
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

  // Toggle login/register
  document.getElementById('authSwitchBtn').addEventListener('click', () => {
    isLogin = !isLogin
    document.getElementById('authTitle').textContent = isLogin ? 'Masuk' : 'Daftar'
    document.getElementById('authBtn').textContent = isLogin ? 'Masuk' : 'Buat Akun'
    document.getElementById('authSwitchText').textContent = isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'
    document.getElementById('authSwitchBtn').textContent = isLogin ? ' Daftar' : ' Masuk'
    document.getElementById('registerFields').style.display = isLogin ? 'none' : 'block'
    document.getElementById('forgotPassword').style.display = isLogin ? 'block' : 'none'
    showError('')
  })

  // Lupa password
  document.getElementById('btnForgotPassword').addEventListener('click', () => {
    renderForgotPassword(onLogin)
  })

  // Submit
  document.getElementById('authBtn').addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value.trim()
    const password = document.getElementById('authPassword').value
    const btn = document.getElementById('authBtn')

    if (!email || !password) { showError('Email dan password wajib diisi.'); return }
    if (password.length < 6) { showError('Password minimal 6 karakter.'); return }

    if (!isLogin) {
      const firstName = document.getElementById('authFirstName').value.trim()
      const lastName = document.getElementById('authLastName').value.trim()
      if (!firstName || !lastName) { showError('Nama depan dan belakang wajib diisi.'); return }
    }

    btn.textContent = 'Loading...'; btn.disabled = true

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { showError('Email atau password salah.'); resetBtn(); return }
      onLogin()
    } else {
      const firstName = document.getElementById('authFirstName').value.trim()
      const lastName = document.getElementById('authLastName').value.trim()

      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { showError(error.message); resetBtn(); return }

      // Simpan nama ke localStorage sementara — akan disave ke DB setelah verifikasi
      localStorage.setItem('duitku_pending_name', JSON.stringify({ firstName, lastName }))

      showError('✅ Akun dibuat! Cek email lo untuk verifikasi, lalu kembali ke sini untuk masuk.')
      resetBtn()
    }
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

// ── LUPA PASSWORD ──
function renderForgotPassword(onLogin) {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-logo">Duit<span>Ku</span></div>
      <div class="auth-tagline">Reset password lo.</div>
      <div class="auth-card">
        <div class="auth-title">Lupa Password</div>
        <div class="auth-error" id="authError"></div>
        <p style="font-size:14px;color:var(--ink-muted);margin-bottom:20px;line-height:1.6;">
          Masukkan email lo, kami akan kirim link untuk reset password.
        </p>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" id="resetEmail" placeholder="email@contoh.com">
        </div>
        <button class="btn-primary" id="btnSendReset">Kirim Link Reset</button>
        <button class="btn-secondary" id="btnBackLogin">Kembali ke Login</button>
      </div>
    </div>
  `

  document.getElementById('btnSendReset').addEventListener('click', async () => {
    const email = document.getElementById('resetEmail').value.trim()
    const btn = document.getElementById('btnSendReset')
    if (!email) { showForgotError('Masukkan email lo.'); return }

    btn.textContent = 'Mengirim...'; btn.disabled = true

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://webduitku.netlify.app/#type=recovery',
    })

    if (error) {
      showForgotError('Gagal kirim email. Coba lagi.')
      btn.textContent = 'Kirim Link Reset'; btn.disabled = false
      return
    }

    showForgotError('✅ Email reset dikirim! Cek inbox lo.')
    btn.textContent = 'Terkirim ✅'; btn.disabled = true
  })

  document.getElementById('btnBackLogin').addEventListener('click', () => {
    renderAuth(onLogin)
  })

  function showForgotError(msg) {
    const el = document.getElementById('authError')
    el.textContent = msg
    el.className = 'auth-error' + (msg ? ' show' : '')
  }
}

// ── RESET PASSWORD ──
export function renderResetPassword(onLogin) {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-logo">Duit<span>Ku</span></div>
      <div class="auth-tagline">Buat password baru.</div>
      <div class="auth-card">
        <div class="auth-title">Reset Password</div>
        <div class="auth-error" id="authError"></div>
        <div id="resetForm">
          <div class="form-group">
            <label class="form-label">Password Baru</label>
            <input class="form-input" type="password" id="newPassword" placeholder="Minimal 6 karakter">
          </div>
          <div class="form-group">
            <label class="form-label">Ulangi Password Baru</label>
            <input class="form-input" type="password" id="confirmPassword" placeholder="Ulangi password baru">
          </div>
          <button class="btn-primary" id="btnResetPassword">Simpan Password Baru</button>
        </div>
      </div>
    </div>
  `

  // Tunggu Supabase proses token dari URL
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      // Session siap, aktifkan form
      document.getElementById('resetForm').style.opacity = '1'
      subscription.unsubscribe()
    }
  })

  document.getElementById('btnResetPassword').addEventListener('click', async () => {
    const newPassword = document.getElementById('newPassword').value
    const confirmPassword = document.getElementById('confirmPassword').value
    const btn = document.getElementById('btnResetPassword')

    if (!newPassword || !confirmPassword) { showResetError('Semua field wajib diisi.'); return }
    if (newPassword.length < 6) { showResetError('Password minimal 6 karakter.'); return }
    if (newPassword !== confirmPassword) { showResetError('Password tidak sama.'); return }

    btn.textContent = 'Menyimpan...'; btn.disabled = true

    // DEBUG
    const { data: sessionData } = await supabase.auth.getSession()
    console.log('session saat reset:', sessionData?.session)

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    console.log('error updateUser:', error)
    
    if (error) {
      showResetError('Gagal reset password. Coba lagi.')
      btn.textContent = 'Simpan Password Baru'; btn.disabled = false
      return
    }

    showResetError('✅ Password berhasil diubah! Silakan masuk.')
    await supabase.auth.signOut()
    setTimeout(() => onLogin(), 2000)
  })

  function showResetError(msg) {
    const el = document.getElementById('authError')
    el.textContent = msg
    el.className = 'auth-error' + (msg ? ' show' : '')
  }
}