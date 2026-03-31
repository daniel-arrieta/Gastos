import { supabase } from '../lib/supabase.js';
import { state, loadData } from '../main.js';
import { formatMoney, formatDate, showToast } from '../lib/utils.js';

export function renderMovimientos(container) {
  let filterType = 'todos';

  function render() {
    const filtered = filterType === 'todos' ? state.movements : state.movements.filter(m => m.tipo === filterType);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Movimientos</h1>
        <div class="header-actions">
          <select class="filter-select" id="filter-tipo">
            <option value="todos" ${filterType === 'todos' ? 'selected' : ''}>Todos</option>
            <option value="ingreso" ${filterType === 'ingreso' ? 'selected' : ''}>Ingresos</option>
            <option value="gasto" ${filterType === 'gasto' ? 'selected' : ''}>Gastos</option>
          </select>
          <button class="btn btn-primary" id="btn-add-mov">+ Nuevo</button>
        </div>
      </div>
      <div class="card">
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No hay movimientos registrados</div><button class="btn btn-primary" id="btn-add-empty">+ Agregar primero</button></div>' : `
        <table class="data-table">
          <thead><tr><th>Categoría</th><th>Descripción</th><th>Fecha</th><th>Monto</th><th></th></tr></thead>
          <tbody>
            ${filtered.map(m => {
              const cat = m.categorias;
              return `<tr>
                <td><span class="category-chip" style="background:${cat ? cat.color + '18' : 'var(--bg-input)'};color:${cat ? cat.color : 'var(--text-muted)'}">${cat ? cat.icono + ' ' + cat.nombre : '—'}</span></td>
                <td>${m.descripcion || '—'}</td>
                <td style="color:var(--text-muted);font-size:0.82rem">${formatDate(m.fecha)}</td>
                <td><span class="movement-amount ${m.tipo === 'ingreso' ? 'income' : 'expense'}">${m.tipo === 'ingreso' ? '+' : '-'}${formatMoney(m.monto)}</span></td>
                <td class="actions-cell">
                  <button class="btn-icon btn-edit-mov" data-id="${m.id}" title="Editar">✏️</button>
                  <button class="btn-icon btn-del-mov" data-id="${m.id}" title="Eliminar">🗑️</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`}
      </div>`;

    // Events
    document.getElementById('filter-tipo')?.addEventListener('change', (e) => { filterType = e.target.value; render(); });
    document.getElementById('btn-add-mov')?.addEventListener('click', () => showModal());
    document.getElementById('btn-add-empty')?.addEventListener('click', () => showModal());
    document.querySelectorAll('.btn-edit-mov').forEach(btn => btn.addEventListener('click', () => {
      const mov = state.movements.find(m => m.id === btn.dataset.id);
      if (mov) showModal(mov);
    }));
    document.querySelectorAll('.btn-del-mov').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este movimiento?')) return;
      await supabase.from('movimientos').delete().eq('id', btn.dataset.id);
      showToast('Movimiento eliminado');
      await loadData(); render();
    }));
  }

  function showModal(editing = null) {
    const gastoCats = state.categories.filter(c => c.tipo === 'gasto');
    const ingresoCats = state.categories.filter(c => c.tipo === 'ingreso');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${editing ? 'Editar' : 'Nuevo'} Movimiento</h2>
          <button class="modal-close" id="modal-close">×</button>
        </div>
        <form id="mov-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select class="form-input" id="mov-tipo" required>
                <option value="gasto" ${editing?.tipo === 'gasto' ? 'selected' : ''}>Gasto</option>
                <option value="ingreso" ${editing?.tipo === 'ingreso' ? 'selected' : ''}>Ingreso</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Monto</label>
              <input type="number" class="form-input" id="mov-monto" min="1" step="0.01" value="${editing?.monto || ''}" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Categoría</label>
              <select class="form-input" id="mov-cat">
                <optgroup label="Gastos">${gastoCats.map(c => `<option value="${c.id}" ${editing?.categoria_id === c.id ? 'selected' : ''}>${c.icono} ${c.nombre}</option>`).join('')}</optgroup>
                <optgroup label="Ingresos">${ingresoCats.map(c => `<option value="${c.id}" ${editing?.categoria_id === c.id ? 'selected' : ''}>${c.icono} ${c.nombre}</option>`).join('')}</optgroup>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha</label>
              <input type="date" class="form-input" id="mov-fecha" value="${editing?.fecha || new Date().toISOString().split('T')[0]}" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <input type="text" class="form-input" id="mov-desc" value="${editing?.descripcion || ''}" placeholder="Opcional" />
          </div>
          ${state.accounts.length > 0 ? `<div class="form-group"><label class="form-label">Cuenta</label><select class="form-input" id="mov-cuenta"><option value="">Sin cuenta</option>${state.accounts.map(a => `<option value="${a.id}" ${editing?.cuenta_id === a.id ? 'selected' : ''}>${a.nombre}</option>`).join('')}</select></div>` : ''}
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

    overlay.querySelector('#mov-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        tipo: document.getElementById('mov-tipo').value,
        monto: parseFloat(document.getElementById('mov-monto').value),
        categoria_id: document.getElementById('mov-cat').value || null,
        fecha: document.getElementById('mov-fecha').value,
        descripcion: document.getElementById('mov-desc').value || null,
        cuenta_id: document.getElementById('mov-cuenta')?.value || null,
        usuario_id: state.user.id
      };
      if (editing) {
        await supabase.from('movimientos').update(data).eq('id', editing.id);
        showToast('Movimiento actualizado');
      } else {
        await supabase.from('movimientos').insert(data);
        showToast('Movimiento creado');
      }
      close();
      await loadData(); render();
    });
  }

  render();
}
