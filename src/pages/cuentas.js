import { supabase } from '../lib/supabase.js';
import { state, loadData } from '../main.js';
import { formatMoney, showToast } from '../lib/utils.js';

export function renderCuentas(container) {
  function render() {
    const totalBalance = state.accounts.reduce((s, a) => s + Number(a.saldo_actual), 0);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Cuentas</h1>
        <div class="header-actions"><button class="btn btn-primary" id="btn-add-acc">+ Nueva Cuenta</button></div>
      </div>
      <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,#6C5CE7,#A29BFE);color:white">
        <div style="font-size:0.82rem;opacity:0.8">Balance Total</div>
        <div class="kpi-value" style="color:white">${formatMoney(totalBalance)}</div>
      </div>
      ${state.accounts.length === 0 ? `<div class="card"><div class="empty-state"><div class="empty-state-icon">🏦</div><div class="empty-state-text">No hay cuentas</div></div></div>` : `
      <div class="budget-grid">
        ${state.accounts.map(a => `
        <div class="card">
          <div class="card-header">
            <span class="card-title">🏦 ${a.nombre}</span>
            <div class="actions-cell">
              <button class="btn-icon btn-edit-acc" data-id="${a.id}">✏️</button>
              <button class="btn-icon btn-del-acc" data-id="${a.id}">🗑️</button>
            </div>
          </div>
          <div class="kpi-value" style="color:${Number(a.saldo_actual) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${formatMoney(a.saldo_actual)}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">Saldo actual</div>
        </div>`).join('')}
      </div>`}`;

    document.getElementById('btn-add-acc')?.addEventListener('click', () => showAccModal());
    document.querySelectorAll('.btn-edit-acc').forEach(btn => btn.addEventListener('click', () => {
      const acc = state.accounts.find(a => a.id === btn.dataset.id);
      if (acc) showAccModal(acc);
    }));
    document.querySelectorAll('.btn-del-acc').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta cuenta?')) return;
      await supabase.from('cuentas').delete().eq('id', btn.dataset.id);
      showToast('Cuenta eliminada'); await loadData(); render();
    }));
  }

  function showAccModal(editing = null) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h2 class="modal-title">${editing ? 'Editar' : 'Nueva'} Cuenta</h2><button class="modal-close" id="mc">×</button></div>
        <form id="acc-form">
          <div class="form-group"><label class="form-label">Nombre</label><input type="text" class="form-input" id="acc-name" value="${editing?.nombre || ''}" required placeholder="Ej: Banco Nación" /></div>
          <div class="form-group"><label class="form-label">Saldo actual</label><input type="number" class="form-input" id="acc-saldo" step="0.01" value="${editing?.saldo_actual || 0}" required /></div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" id="mc2">Cancelar</button><button type="submit" class="btn btn-primary">${editing ? 'Guardar' : 'Crear'}</button></div>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#mc').addEventListener('click', close);
    overlay.querySelector('#mc2').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#acc-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = { nombre: document.getElementById('acc-name').value, saldo_actual: parseFloat(document.getElementById('acc-saldo').value), usuario_id: state.user.id };
      if (editing) { await supabase.from('cuentas').update(data).eq('id', editing.id); showToast('Cuenta actualizada'); }
      else { await supabase.from('cuentas').insert(data); showToast('Cuenta creada'); }
      close(); await loadData(); render();
    });
  }

  render();
}
