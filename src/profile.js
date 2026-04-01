import { supabase } from '../supabase.js'
import { saveSettings } from './storage.js'
import { showToast } from './toast.js'

export function renderProfile(state, onLogout, onSave) {
  const { first_name, last_name } = state.settings
  const fullName = [first_name, last_name].filter(Boolean).join(' ') || 'User'
  const initials = [first_name?.[0], last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  const email = state.user?.email || ''

  return `
    <div class="section-title">Profil Saya</div>

    <!-- Avatar & Info -->
    <div class="card-box" style="text-align:center;padding:28px;">
      <div style="
        width:72px;height:72px;border-radius:50%;
        background:var(--accent);color:white;
        display:flex;align-items:center;justify-content:center;
        font-family:'DM Serif Display',serif;font-size:26px;
        margin:0 auto 16px;
      ">${initials}</div>
      <div style="font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:4px;">${fullName}</div>
      <div style="font-size:13px;color:var(--ink-muted);">${email}</div>
      <div style="font-size:11px;color:var(--ink-faint);margin-top:6px;">DuitKu v1.0.0</div>
    </div>

    <!-- Edit Nama -->
    <div class="section-title">Edit Profil</div>
    <div class="card-box">
      <div class="form-group">
        <label class="form-label">Nama Depan</label>
        <input class="form-input" type="text" id="profileFirstName" value="${first_name||''}" placeholder="Nama depan">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Nama Belakang</label>
        <input class="form-input" type="text" id="profileLastName" value="${last_name||''}" placeholder="Nama belakang">
      </div>
      <div class="divider"></div>
      <button class="btn-primary" id="btnSaveProfile">Simpan Nama</button>
    </div>

    <!-- Ganti Password -->
    <div class="section-title">Ganti Password</div>
    <div class="card-box">
      <div class="form-group">
        <label class="form-label">Password Lama</label>
        <input class="form-input" type="password" id="oldPassword" placeholder="Password lama">
      </div>
      <div class="form-group">
        <label class="form-label">Password Baru</label>
        <input class="form-input" type="password" id="newPassword" placeholder="Minimal 6 karakter">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Ulangi Password Baru</label>
        <input class="form-input" type="password" id="confirmPassword" placeholder="Ulangi password baru">
      </div>
      <div class="divider"></div>
      <button class="btn-primary" id="btnChangePassword">Ganti Password</button>
    </div>

    <!-- Install App -->
    <div id="installSection" style="display:none">
      <div class="section-title">Aplikasi</div>
      <div class="card-box">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <div style="font-size:32px;">📲</div>
          <div>
            <div style="font-size:14px;font-weight:600;margin-bottom:2px;">Install DuitKu</div>
            <div style="font-size:12px;color:var(--ink-muted);">Tambahkan ke homescreen HP lo</div>
          </div>
        </div>
        <button class="btn-primary" id="btnInstallApp" style="background:var(--blue);">⬇ Install Aplikasi</button>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="section-title" style="color:var(--accent);">⚠️ Danger Zone</div>
    <div class="card-box" style="border-color:#ecd0ca;">
      <button class="btn-primary" id="btnLogout" style="background:var(--ink);margin-bottom:8px;">🚪 Keluar</button>
      <button class="btn-primary" id="btnDeleteAccount" style="background:var(--accent-light);color:var(--accent);border:1.5px solid #ecd0ca;">🗑 Hapus Akun</button>
    </div>
  `
}

export function attachProfileListeners(state, onLogout, onSave) {
  // Simpan nama
  document.getElementById('btnSaveProfile')?.addEventListener('click', async () => {
    const firstName = document.getElementById('profileFirstName').value.trim()
    const lastName = document.getElementById('profileLastName').value.trim()
    if (!firstName || !lastName) { showToast('Nama depan dan belakang wajib diisi.', 'error'); return }
    state.settings.first_name = firstName
    state.settings.last_name = lastName
    const ok = await saveSettings(state.settings)
    if (ok) { showToast('✅ Nama berhasil disimpan!'); onSave() }
    else showToast('Gagal menyimpan nama.', 'error')
  })

  // Ganti password
  document.getElementById('btnChangePassword')?.addEventListener('click', async () => {
    const oldPassword = document.getElementById('oldPassword').value
    const newPassword = document.getElementById('newPassword').value
    const confirmPassword = document.getElementById('confirmPassword').value
    const email = state.user?.email

    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Semua field wajib diisi.', 'error'); return
    }
    if (newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter.', 'error'); return
    }
    if (newPassword !== confirmPassword) {
      showToast('Password baru tidak sama.', 'error'); return
    }

    const btn = document.getElementById('btnChangePassword')
    btn.textContent = 'Memverifikasi...'; btn.disabled = true

    // Verifikasi password lama dulu
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email, password: oldPassword
    })
    if (signInError) {
      showToast('Password lama salah.', 'error')
      btn.textContent = 'Ganti Password'; btn.disabled = false
      return
    }

    // Update password baru
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      showToast('Gagal ganti password.', 'error')
      btn.textContent = 'Ganti Password'; btn.disabled = false
      return
    }

    showToast('✅ Password berhasil diubah!')
    document.getElementById('oldPassword').value = ''
    document.getElementById('newPassword').value = ''
    document.getElementById('confirmPassword').value = ''
    btn.textContent = 'Ganti Password'; btn.disabled = false
  })

  // Install App
  let deferredPrompt = null
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    const section = document.getElementById('installSection')
    if (section) section.style.display = 'block'
  })

  document.getElementById('btnInstallApp')?.addEventListener('click', async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      showToast('✅ DuitKu berhasil diinstall!')
      document.getElementById('installSection').style.display = 'none'
    }
    deferredPrompt = null
  })

  // Logout
  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    if (!confirm('Yakin mau keluar?')) return
    await supabase.auth.signOut()
    onLogout()
  })

  // Hapus Akun — 3 lapis validasi
  document.getElementById('btnDeleteAccount')?.addEventListener('click', async () => {
    // Lapis 1
    if (!confirm('⚠️ Yakin mau hapus akun?\nSemua data keuangan lo akan ikut terhapus.')) return

    // Lapis 2
    if (!confirm('🚨 Ini tidak bisa dibatalkan!\nSemua transaksi, budget, dan target akan hilang permanen.')) return

    // Lapis 3 — ketik ulang email
    const email = state.user?.email
    const input = prompt(`Ketik email lo untuk konfirmasi:\n${email}`)
    if (input !== email) {
      showToast('Email tidak sesuai. Hapus akun dibatalkan.', 'error')
      return
    }

    showToast('Menghapus akun...')

    try {
      // Hapus semua data user
      const uid = state.user.id
      await supabase.from('transactions').delete().eq('user_id', uid)
      await supabase.from('bank_accounts').delete().eq('user_id', uid)
      await supabase.from('budgets').delete().eq('user_id', uid)
      await supabase.from('goals').delete().eq('user_id', uid)
      await supabase.from('settings').delete().eq('user_id', uid)

      // Hapus user dari auth
      await supabase.auth.admin.deleteUser(uid)
      await supabase.auth.signOut()
      onLogout()
    } catch(e) {
      showToast('Gagal hapus akun. Hubungi admin.', 'error')
    }
  })
}