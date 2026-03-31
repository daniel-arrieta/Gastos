import { supabase } from '../lib/supabase.js';
import { state, loadData } from '../main.js';
import { formatMoney, showToast } from '../lib/utils.js';

export function renderCobranzas(container) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  function getClientCollection(clientName) {
    return state.movements
      .filter(m => 
        m.tipo === 'ingreso' && 
        new Date(m.fecha).getMonth() === currentMonth && 
        new Date(m.fecha).getFullYear() === currentYear &&
        m.descripcion?.toLowerCase().includes(clientName.toLowerCase())
      )
      .reduce((sum, m) => sum + Number(m.monto), 0);
  }

  function render() {
    const clients = state.recurringIncome || [];
    const totalExpected = clients.reduce((sum, c) => sum + Number(c.monto_estimado), 0);
    const totalCollected = clients.reduce((sum, c) => sum + getClientCollection(c.cliente), 0);
    const pct = totalExpected > 0 ? Math.min((totalCollected / totalExpected) * 100, 100) : 0;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Gestión de Cobranzas</h1>
        <div class="header-actions">
          <button class="btn btn-primary" id="btn-add-client">+ Nuevo Cliente</button>
        </div>
      </div>

      <div class="dashboard-grid" style="grid-template-columns: 1fr 2fr">
        <!-- Collection Stats -->
        <div class="card">
          <div class="card-header"><span class="card-title">📊 Resumen del Mes</span></div>
          <div style="margin-bottom:24px">
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px">Total Cobrado</div>
            <div class="kpi-value" style="color:var(--accent-green)">${formatMoney(totalCollected)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">de ${formatMoney(totalExpected)} esperados</div>
          </div>
          
          <div class="progress-container">
            <div class="progress-header">
              <span class="progress-label">Progreso de Cobranza</span>
              <span class="progress-pct" style="color:var(--primary)">${pct.toFixed(0)}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:var(--primary)"></div>
            </div>
          </div>

          <div style="margin-top:24px;padding:16px;background:var(--bg-badge);border-radius:var(--radius-md)">
            <div style="font-size:0.75rem;font-weight:600;color:var(--primary);margin-bottom:4px">💡 Tip de Cobranza</div>
            <div style="font-size:0.75rem;color:var(--text-primary)">Asegúrate de que la descripción de los ingresos contenga el nombre del cliente para que se vinculen automáticamente.</div>
          </div>
        </div>

        <!-- Client List -->
        <div class="card">
          <div class="card-header"><span class="card-title">👥 Mis Clientes</span></div>
          ${clients.length === 0 ? '<div class="empty-state">No hay clientes registrados</div>' : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Esperado</th>
                <th>Cobrado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${clients.map(c => {
                const collected = getClientCollection(c.cliente);
                const isPaid = collected >= Number(c.monto_estimado);
                return `
                <tr>
                  <td style="font-weight:600">${c.cliente}</td>
                  <td>${formatMoney(c.monto_estimado)}</td>
                  <td style="color:${isPaid ? 'var(--accent-green)' : 'var(--text-primary)'}">${formatMoney(collected)}</td>
                  <td>
                    ${isPaid ? '<span class="badge badge-green">Cobrado</span>' : 
                      collected > 0 ? '<span class="badge badge-orange">Parcial</span>' : 
                      '<span class="badge badge-red">Pendiente</span>'}
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon btn-edit-client" data-id="${c.id}">✏️</button>
                    <button class="btn-icon btn-del-client" data-id="${c.id}">🗑️</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`}
        </div>
      </div>
    `;

    // Events
    document.getElementById('btn-add-client')?.addEventListener('click', () => showModal());
    document.querySelectorAll('.btn-edit-client').forEach(btn => btn.addEventListener('click', () => {
      const client = clients.find(c => c.id === btn.dataset.id);
      if (client) showModal(client);
    }));
    document.querySelectorAll('.btn-del-client').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este cliente?')) return;
      await supabase.from('ingresos_recurrentes').delete().eq('id', btn.dataset.id);
      showToast('Cliente eliminado');
      await loadData(); render();
    }));
  }

  function showModal(editing = null) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${editing ? 'Editar' : 'Nuevo'} Cliente</h2>
          <button class="modal-close" id="modal-close">×</button>
        </div>
        <form id="client-form">
          <div class="form-group">
            <label class="form-label">Nombre del Cliente</label>
            <input type="text" class="form-input" id="client-name" value="${editing?.cliente || ''}" required placeholder="Ej: TechCorp S.A." />
          </div>
          <div class="form-group">
            <label class="form-label">Monto Mensual Esperado</label>
            <input type="number" class="form-input" id="client-monto" value="${editing?.monto_estimado || ''}" min="1" step="0.01" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary">${editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#modal-close').addEventListener('click', close);
    overlay.querySelector('#modal-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelector('#client-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        cliente: document.getElementById('client-name').value,
        monto_estimado: parseFloat(document.getElementById('client-monto').value),
        frecuencia: 'mensual',
        activo: true,
        usuario_id: state.user.id
      };
      if (editing) {
        await supabase.from('ingresos_recurrentes').update(data).eq('id', editing.id);
        showToast('Cliente actualizado');
      } else {
        await supabase.from('ingresos_recurrentes').insert(data);
        showToast('Cliente creado');
      }
      close();
      await loadData(); render();
    });
  }

  render();
}
