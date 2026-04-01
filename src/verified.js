export function renderVerified() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 32px 24px;
      text-align: center;
    ">
      <div style="
        background: white;
        border: 1px solid #ddd6cc;
        border-radius: 16px;
        padding: 40px 32px;
        max-width: 360px;
        width: 100%;
      ">
        <div style="font-size: 56px; margin-bottom: 16px;">✅</div>
        <div style="
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: #1a1612;
          margin-bottom: 12px;
        ">Email Terverifikasi!</div>
        <p style="
          font-size: 14px;
          color: #6b6560;
          line-height: 1.6;
          margin-bottom: 32px;
        ">
          Akun DuitKu lo udah aktif. Sekarang lo bisa masuk dan mulai catat keuangan lo.
        </p>
        <button id="btnGoLogin" style="
          width: 100%;
          padding: 16px;
          background: #c84b2f;
          color: white;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        ">Masuk ke DuitKu</button>
      </div>

      <div style="
        font-family: 'DM Serif Display', serif;
        font-size: 20px;
        color: #1a1612;
        margin-top: 32px;
      ">Duit<span style="color: #c84b2f;">Ku</span></div>
    </div>
  `

  document.getElementById('btnGoLogin').addEventListener('click', () => {
    // Hapus token dari URL biar bersih
    window.history.replaceState({}, document.title, '/')
    // Reload untuk trigger init() dari awal
    window.location.reload()
  })
}