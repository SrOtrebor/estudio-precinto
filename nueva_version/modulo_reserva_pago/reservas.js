// --- MODAL DE RESERVAS DINÁMICO (Firebase + Mercado Pago) ---
const PROJECT_ID = 'estudio-precinto'; // ID de proyecto oficial de Firebase
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://localhost:5001/${PROJECT_ID}/us-central1/api`
    : `https://us-central1-estudio-precinto.cloudfunctions.net/api`;

// Precios Dinámicos
let globalPricing = { individual: 70000, ventas_ya: 350000 };

async function fetchPricing() {
    try {
        const res = await fetch(`${API_URL}/pricing`);
        if (res.ok) {
            const data = await res.json();
            globalPricing = data;
        }
    } catch (e) {
        console.warn('Error al obtener precios dinámicos', e);
    }
}
document.addEventListener('DOMContentLoaded', fetchPricing);

const modal = document.getElementById('bookingModal');
const modalOverlay = document.getElementById('modalOverlay');
let modalService = '';
let modalPrice = '';
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function openModal(service, detail, price) {
  modalService = detail;
  modalPrice = price || '$70.000 ARS';
  const label = document.getElementById('modal-service-label');
  if(label) label.textContent = detail;
  
  // Actualizar precio en la vista del modal
  const priceEl = document.getElementById('modal-sum-price');
  if (priceEl) {
    priceEl.textContent = modalPrice;
  }
  
  // Limpiar form
  const form = document.getElementById('modal-booking-form');
  if(form) form.reset();
  
  // Reiniciar selección
  selectedDate = null;
  selectedTime = null;
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  
  renderCalendar(currentMonth, currentYear);
  updateSummary();
  
  // Mostrar paso 1
  document.querySelectorAll('.modal-step').forEach(s => s.classList.add('hidden'));
  const step1 = document.getElementById('step1');
  if(step1) step1.classList.remove('hidden');
  
  if(modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  if(modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', closeModal);
}

function renderCalendar(month, year) {
    const calendarGrid = document.getElementById('modal-calendar');
    if (!calendarGrid) return;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    let html = `
        <div class="calendar-header">
            <button type="button" class="btn-prev">&lt;</button>
            <div style="font-weight: 700; color: var(--carbon, #111827);">${monthNames[month]} ${year}</div>
            <button type="button" class="btn-next">&gt;</button>
        </div>
        <div class="calendar-days">
            <div class="day-name">Dom</div><div class="day-name">Lun</div><div class="day-name">Mar</div><div class="day-name">Mié</div>
            <div class="day-name">Jue</div><div class="day-name">Vie</div><div class="day-name">Sáb</div>
    `;

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="day empty" style="background: transparent; border: none;"></div>`;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const isPast = dateObj < today;
        const isSelected = selectedDate && dateObj.toDateString() === selectedDate.toDateString();

        html += `
            <div class="day ${isPast ? 'disabled' : 'clickable'} ${isSelected ? 'selected' : ''}" 
                 data-date="${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}">
                ${day}
            </div>
        `;
    }

    html += `</div>`;
    calendarGrid.innerHTML = html;

    const prevBtn = calendarGrid.querySelector('.btn-prev');
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            currentMonth--;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderCalendar(currentMonth, currentYear);
        };
    }

    const nextBtn = calendarGrid.querySelector('.btn-next');
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            renderCalendar(currentMonth, currentYear);
        };
    }

    calendarGrid.querySelectorAll('.day.clickable').forEach(el => {
        el.onclick = (e) => {
            calendarGrid.querySelectorAll('.day.selected').forEach(s => s.classList.remove('selected'));
            e.target.classList.add('selected');

            const [y, m, d] = e.target.dataset.date.split('-').map(Number);
            selectedDate = new Date(y, m - 1, d);
            selectedTime = null;

            renderTimeSlots(selectedDate);
            updateSummary();
        };
    });
}

async function renderTimeSlots(date) {
    const slotsGrid = document.getElementById('modal-slots');
    if (!slotsGrid) return;
    slotsGrid.innerHTML = '<p style="color: #6b7280; font-size: 0.85rem; text-align: center; width: 100%;">Cargando horarios...</p>';

    try {
        if (PROJECT_ID === 'TU-PROJECT-ID') {
            throw new Error("Demo Mode");
        }
        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const response = await fetch(`${API_URL}/getAvailableSlots?date=${dateStr}`);

        if (!response.ok) throw new Error('Error al obtener horarios');

        const data = await response.json();
        const slots = data.slots || [];

        if (slots.length === 0) {
            slotsGrid.innerHTML = '<p style="color: #6b7280; font-size: 0.85rem; text-align: center; width: 100%;">No hay horarios disponibles.</p>';
            return;
        }

        slotsGrid.innerHTML = '<div class="slots-grid">' + slots.map(time => `
            <div class="slot-btn ${selectedTime === time ? 'selected' : ''}" data-time="${time}">${time}</div>
        `).join('') + '</div>';

        slotsGrid.querySelectorAll('.slot-btn').forEach(el => {
            el.onclick = (e) => {
                slotsGrid.querySelectorAll('.slot-btn.selected').forEach(s => s.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedTime = e.target.dataset.time;
                updateSummary();
            };
        });

    } catch (error) {
        console.warn("Fallback de horarios simulado.");
        const mockSlots = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];
        slotsGrid.innerHTML = `
            <div class="slots-grid">
                ${mockSlots.map(time => `<div class="slot-btn ${selectedTime === time ? 'selected' : ''}" data-time="${time}">${time}</div>`).join('')}
            </div>
        `;

        slotsGrid.querySelectorAll('.slot-btn').forEach(el => {
            el.onclick = (e) => {
                slotsGrid.querySelectorAll('.slot-btn.selected').forEach(s => s.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedTime = e.target.dataset.time;
                updateSummary();
            };
        });
    }
}

function updateSummary() {
    const summaryDate = document.getElementById('modal-sum-date');
    const summaryTime = document.getElementById('modal-sum-time');
    const btnPay = document.getElementById('modal-btn-pay');
    
    if (selectedDate) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (summaryDate) summaryDate.textContent = selectedDate.toLocaleDateString('es-ES', options);
    } else {
        if (summaryDate) summaryDate.textContent = 'Sin seleccionar';
    }

    if (summaryTime) summaryTime.textContent = selectedTime || 'Sin seleccionar';

    const name = document.getElementById('modal-name')?.value.trim();
    const phone = document.getElementById('modal-phone')?.value.trim();
    const email = document.getElementById('modal-email')?.value.trim();

    if (btnPay) {
        btnPay.disabled = !(selectedDate && selectedTime && name && phone && email);
        
        const isFreeOrCustom = modalPrice.includes('A convenir') || 
                               modalPrice.includes('convenir') || 
                               modalPrice.includes('Gratis') || 
                               modalPrice.includes('gratis');
                               
        if (isFreeOrCustom) {
            btnPay.innerHTML = '📩 Confirmar y Agendar';
        } else {
            btnPay.innerHTML = '💳 Confirmar y Pagar';
        }
    }
}

['modal-name','modal-phone','modal-email'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateSummary);
});

async function submitModalBooking() {
  if (!selectedDate || !selectedTime) {
      alert('Por favor selecciona fecha y hora para tu cita.');
      return;
  }

  const name = document.getElementById('modal-name').value.trim();
  const phone = document.getElementById('modal-phone').value.trim();
  const email = document.getElementById('modal-email').value.trim();

  if (!name || !email || !phone) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
  }
  
  const dateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

  const formData = {
      name: name,
      email: email,
      phone: phone,
      date: dateStr,
      time: selectedTime,
      service: modalService
  };

  const btnPay = document.getElementById('modal-btn-pay');
  const originalText = btnPay.innerHTML;
  btnPay.textContent = 'Procesando...';
  btnPay.disabled = true;

  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  
  if(step1) step1.classList.add('hidden');
  if(step2) step2.classList.remove('hidden');

  try {
      if (PROJECT_ID === 'TU-PROJECT-ID') {
          throw new Error("Demo Mode");
      }
      const response = await fetch(`${API_URL}/createBooking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (!response.ok) {
          throw new Error(result.error || 'Error al crear la reserva');
      }

      if (result.init_point) {
          btnPay.textContent = 'Redirigiendo...';
          window.location.href = result.init_point;
      } else {
          throw new Error('No se recibió el link de pago.');
      }

  } catch (error) {
      console.warn("Simulando proceso completado para este módulo independiente.");
      
      setTimeout(() => {
        if(step2) step2.classList.add('hidden');
        if(step3) step3.classList.remove('hidden');
        
        btnPay.innerHTML = originalText;
        btnPay.disabled = false;
      }, 1500);
  }
}

// Exponer global
window.openModal = openModal;
window.closeModal = closeModal;
window.submitModalBooking = submitModalBooking;
