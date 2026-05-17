document.addEventListener('DOMContentLoaded', () => {
  const steps = [...document.querySelectorAll('[data-step]')];
  const pills = [...document.querySelectorAll('[data-step-pill]')];
  const prevBtn = document.querySelector('[data-prev]');
  const nextBtn = document.querySelector('[data-next]');
  const finishBtn = document.querySelector('[data-finish]');
  const servicesWrap = document.querySelector('[data-booking-services]');
  const mastersWrap = document.querySelector('[data-booking-masters]');
  const calendarGrid = document.querySelector('[data-calendar-grid]');
  const calendarTitle = document.querySelector('[data-calendar-title]');
  const timeGrid = document.querySelector('[data-time-grid]');
  const summary = document.querySelector('[data-book-summary]');
  const calendarPrev = document.querySelector('[data-calendar-prev]');
  const calendarNext = document.querySelector('[data-calendar-next]');

  const params = new URLSearchParams(location.search);
  const state = {
    service: params.get('service') || '',
    master: params.get('master') || '',
    date: '',
    time: ''
  };

  let currentStep = state.service ? 1 : 0;
  let calendarMonth = new Date();
  calendarMonth.setDate(1);
  let bookedSlots = [];

  const todayKey = (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  })();

  const russianMonths = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const timeSlots = ['10:00','11:30','13:00','14:30','16:00','17:30','19:00','20:00'];

  function compatibleMasters(serviceId) {
    const service = window.BP.findService(serviceId);
    if (!service) return window.BP_DATA.masters;
    return window.BP_DATA.masters.filter((master) => master.services.includes(service.category));
  }

  function renderSteps() {
    steps.forEach((step, index) => step.classList.toggle('d-none', index !== currentStep));
    pills.forEach((pill, index) => pill.classList.toggle('active', index === currentStep));
    prevBtn.disabled = currentStep === 0;
    nextBtn.classList.toggle('d-none', currentStep === 2);
    finishBtn.classList.toggle('d-none', currentStep !== 2);
  }

  function renderServices() {
    servicesWrap.innerHTML = window.BP_DATA.services.map((item) => `
      <div class="col-md-6">
        <div class="service-chip ${state.service === item.id ? 'active' : ''}" data-service-id="${item.id}">
          <div class="d-flex justify-content-between gap-2 align-items-start">
            <div>
              <div class="fw-semibold">${item.name}</div>
              <div class="small-note">${item.categoryLabel} · ${item.duration}</div>
            </div>
            <strong class="text-nowrap">${item.price}</strong>
          </div>
        </div>
      </div>
    `).join('');

    servicesWrap.querySelectorAll('[data-service-id]').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.service = chip.dataset.serviceId;
        state.master = '';
        state.date = '';
        state.time = '';
        currentStep = 1;
        renderAll();
      });
    });
  }

  function renderMasters() {
    const list = compatibleMasters(state.service);
    mastersWrap.innerHTML = list.map((item) => `
      <div class="col-md-6">
        <div class="master-choice ${state.master === item.id ? 'active' : ''}" data-master-id="${item.id}">
          <div class="d-flex gap-3">
            <img src="${window.BP.makeAvatar(item.photoLabel)}" alt="Фото мастера ${item.name}" style="width:72px;height:72px;border-radius:16px;object-fit:cover;">
            <div class="flex-grow-1">
              <div class="fw-semibold">${item.name}</div>
              <div class="small-note mb-1">${item.specialization}</div>
              <div class="rating">${window.BP.formatStars(item.rating)}</div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    mastersWrap.querySelectorAll('[data-master-id]').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.master = chip.dataset.masterId;
        currentStep = 2;
        renderAll();
      });
    });
  }

  function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + offset);
    return d;
  }

  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    calendarTitle.textContent = `${russianMonths[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const gridStart = startOfWeek(firstDay);
    const cells = [];
    for (let i = 0; i < 42; i += 1) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + i);
      const inMonth = day.getMonth() === month;
      const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const disabled = iso < todayKey || !inMonth;
      const active = state.date === iso;
      cells.push(`
        <div class="calendar-day ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}" data-date="${iso}" data-disabled="${disabled}">
          <div class="fw-semibold">${day.getDate()}</div>
          <div class="small-note">${inMonth ? 'Доступно' : '—'}</div>
        </div>
      `);
    }
    calendarGrid.innerHTML = cells.join('');

    calendarGrid.querySelectorAll('[data-date]').forEach((cell) => {
      if (cell.dataset.disabled === 'true') return;
      cell.addEventListener('click', () => {
        state.date = cell.dataset.date;
        state.time = '';
        renderAll();
      });
    });
  }

  async function fetchBookedSlots() {
    if (!state.master || !state.date) { bookedSlots = []; return; }
    try {
      const res = await fetch(`http://localhost:3000/api/bookings/slots?master_id=${state.master}&date=${state.date}`);
      bookedSlots = await res.json();
    } catch { bookedSlots = []; }
  }

  function renderTimes() {
    timeGrid.innerHTML = timeSlots.map((slot) => {
      const isBooked = bookedSlots.includes(slot);
      const isActive = state.time === slot;
      return `<div class="time-slot ${isActive ? 'active' : ''} ${isBooked ? 'booked' : ''}" data-time="${slot}" ${isBooked ? 'data-booked="true"' : ''}>
        ${slot}${isBooked ? '<br><small>Занято</small>' : ''}
      </div>`;
    }).join('');

    timeGrid.querySelectorAll('[data-time]').forEach((slotEl) => {
      if (slotEl.dataset.booked === 'true') return;
      slotEl.addEventListener('click', () => {
        if (!state.date) {
          alert('Сначала выберите дату в календаре.');
          return;
        }
        state.time = slotEl.dataset.time;
        renderAll();
      });
    });
  }

  function renderSummary() {
    const serviceText = state.service ? window.BP.serviceLabel(state.service) : 'Не выбрано';
    const masterText = state.master ? window.BP.masterLabel(state.master) : 'Не выбран';
    const dateText = state.date ? window.BP.formatDateRu(state.date) : 'Не выбрано';
    const timeText = state.time || 'Не выбрано';
    summary.innerHTML = `
      <div class="mb-2"><strong>Услуга:</strong> ${serviceText}</div>
      <div class="mb-2"><strong>Мастер:</strong> ${masterText}</div>
      <div class="mb-2"><strong>Дата:</strong> ${dateText}</div>
      <div><strong>Время:</strong> ${timeText}</div>
    `;
  }

  async function renderAll() {
    renderSteps();
    renderServices();
    renderMasters();
    renderCalendar();
    await fetchBookedSlots();
    renderTimes();
    renderSummary();
  }

  prevBtn.addEventListener('click', async () => {
    currentStep = Math.max(0, currentStep - 1);
    await renderAll();
  });

  nextBtn.addEventListener('click', async () => {
    if (currentStep === 0 && !state.service) {
      alert('Сначала выберите услугу.');
      return;
    }
    if (currentStep === 1 && !state.master) {
      alert('Сначала выберите мастера.');
      return;
    }
    currentStep = Math.min(2, currentStep + 1);
    await renderAll();
  });

  finishBtn.addEventListener('click', async () => {
    if (!state.service || !state.master || !state.date || !state.time) {
      alert('Заполните все шаги записи.');
      return;
    }

    finishBtn.disabled = true;
    finishBtn.textContent = 'Сохраняем...';

    try {
      await window.API.createBooking({
        service_id: state.service,
        master_id: state.master,
        date: state.date,
        time: state.time
      });
      alert('Запись создана! Ждём вас.');
      location.href = 'dashboard.html';
    } catch (err) {
      alert('Ошибка: ' + err.message);
      finishBtn.disabled = false;
      finishBtn.textContent = 'Подтвердить запись';
    }
  });

  calendarPrev.addEventListener('click', async () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    await renderAll();
  });

  calendarNext.addEventListener('click', async () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    await renderAll();
  });

  renderAll();
});
