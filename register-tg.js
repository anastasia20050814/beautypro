// Логика выбора способа регистрации
document.addEventListener('DOMContentLoaded', () => {
  const methodChoice = document.getElementById('methodChoice');
  const emailForm    = document.getElementById('emailForm');
  const tgRegForm    = document.getElementById('tgRegForm');

  // Выбор email
  document.getElementById('chooseEmail')?.addEventListener('click', () => {
    methodChoice.classList.add('d-none');
    emailForm.classList.remove('d-none');
  });

  document.getElementById('backFromEmail')?.addEventListener('click', () => {
    emailForm.classList.add('d-none');
    methodChoice.classList.remove('d-none');
  });

  // Выбор Telegram
  document.getElementById('chooseTg')?.addEventListener('click', async () => {
    methodChoice.classList.add('d-none');
    tgRegForm.classList.remove('d-none');
    await startTgReg();
  });

  document.getElementById('backFromTg')?.addEventListener('click', () => {
    tgRegForm.classList.add('d-none');
    methodChoice.classList.remove('d-none');
    stopPolling();
  });
});

let pollInterval = null;

function stopPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
}

async function startTgReg() {
  try {
    // Получаем код для Telegram регистрации
    const res = await fetch('/api/telegram/register/start');
    const data = await res.json();
    if (!data.code) throw new Error('Нет кода');

    const botUrl = `https://t.me/${data.botUsername}?start=REG_${data.code}`;

    document.getElementById('tgRegBtn').onclick = () => window.open(botUrl, '_blank');
    document.getElementById('tgRegBtn').setAttribute('href', botUrl);

    // Показываем ожидание после нажатия
    document.getElementById('tgRegBtn').addEventListener('click', () => {
      document.getElementById('tgRegWaiting').style.display = 'block';
      startPolling(data.code);
    }, { once: true });

  } catch (err) {
    alert('Ошибка: ' + err.message);
  }
}

function startPolling(code) {
  stopPolling();
  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/telegram/register/status?code=${code}`);
      const data = await res.json();

      if (data.ready && data.token) {
        stopPolling();
        // Авторизуем пользователя
        localStorage.setItem('bpToken', data.token);
        window.BP.setAuth({ loggedIn: true, name: data.user.name, role: data.user.role });
        const next = new URLSearchParams(location.search).get('next');
        location.href = next ? decodeURIComponent(next) : 'dashboard.html';
      }
    } catch {}
  }, 2000); // проверяем каждые 2 секунды
}
