export function showToast(message, type = 'success') {
  // Hapus toast yang ada dulu
  const existing = document.getElementById('toastEl')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'toastEl'
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#2d6a4f' : type === 'error' ? '#c84b2f' : '#1a1612'};
    color: white;
    padding: 12px 20px;
    border-radius: 20px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    animation: toastIn 0.3s ease;
    white-space: nowrap;
    max-width: 360px;
    text-align: center;
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards'
    setTimeout(() => toast.remove(), 300)
  }, 2500)
}