import { supabase } from '../lib/supabase.js';
import { state, loadData } from '../main.js';
import { formatMoney, showToast } from '../lib/utils.js';
import { detectBudgetOverspend } from '../lib/analysis.js';

export function renderPresupuestos(container) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const budgetAlerts = detectBudgetOverspend(state.movements, state.budgets, state.categories);

  function getSpent(catId) {
    return state.movements
      .filter(m => m.tipo === 'gasto' && m.categoria_id === catId && new Date(m.fecha).getMonth() === currentMonth && new Date(m.fecha).getFullYear() === currentYear)
      .reduce((s, m) => s + Number(m.monto), 0);
  }

  function render() {
    const gastoCats = state.categories.filter(c => c.tipo === 'gasto');

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Presupuestos</h1>
        <div class="header-actions">
          <button class="btn btn-primary" id="btn-add-budget">+ Nuevo Presupuesto</button>
        </div>
      </div>
      ${state.budgets.length === 0 ? `<div class="card"><div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">No hay presupuestos definidos</div><button class="btn btn-primary" id="btn-add-empty">+ Crear presupuesto</button></div></div>` : `
      <div class="budget-grid">
        ${state.budgets.map(b => {
          const cat = b.categorias || state.categories.find(c => c.id === b.categoria_id);
          const spent = getSpent(b.categoria_id);
          const pct = Math.min((spent / Number(b.monto_mensual)) * 100, 100);
          const statusClass = pct >= 100 ? 'danger' : pct >= 75 ? 'warning' : 'ok';
          const barColor = pct >= 100 ? 'var(--accent-red)' : pct >= 75 ? 'var(--accent-orange)' : 'var(--accent-green)';
          return `
          <div class="budget-card ${statusClass}">
            <div class="card-header">
              <span class="card-title">${cat ? cat.icono + ' ' + cat.nombre : 'Categoría'}</span>
              <div class="actions-cell">
                <button class="btn-icon btn-del-budget" data-id="${b.id}" title="Eliminar">🗑️</button>
              </div>
            </div>
            <div class="progress-container">
              <div class="progress-header">
                <span class="progress-label">${formatMoney(spent)} <span style="color:var(--text-muted)">de ${formatMoney(b.monto_mensual)}</span></span>
                <span class="progress-pct" style="color:${barColor}">${pct.toFixed(0)}%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${barColor}"></div></div>
            </div>
            ${pct >= 100 ? '<div class="badge badge-red">⚠ Excedido</div>' : pct >= 75 ? '<div class="badge badge-orange">⚡ Atención</div>' : '<div class="badge badge-green">✓ En rango</div>'}
          </div>`;
        }).join('')}
      </div>`}`;

    document.getElementById('btn-add-budget')?.addEventListener('click', () => showBudgetModal(gastoCats));
    document.getElementById('btn-add-empty')?.addEventListener('click', () => showBudgetModal(gastoCats));
    document.querySelectorAll('.btn-del-budget').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este presupuesto?')) return;
      await supabase.from('presupuestos').delete().eq('id', btn.dataset.id);
      showToast('Presupuesto eliminado');
      await loadData(); render();
    }));
  }

  function showBudgetModal(gastoCats) {
    const existing = state.budgets.map(b => b.categoria_id);
    const available = gastoCats.filter(c => !existing.includes(c.id));
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h2 class="modal-title">Nuevo Presupuesto</h2><button class="modal-close" id="modal-close">×</button></div>
        <form id="budget-form">
          <div class="form-group"><label class="form-label">Categoría</label>
            <select class="form-input" id="budget-cat" required>${available.map(c => `<option value="${c.id}">${c.icono} ${c.nombre}</option>`).join('')}</select>
          </div>
          <div class="form-group"><label class="form-label">Monto mensual</label>
            <input type="number" class="form-input" id="budget-monto" min="1" step="0.01" required placeholder="Ej: 50000" />
          </div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" id="modal-cancel">Cancelar</button><button type="submit" class="btn btn-primary">Crear</button></div>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#modal-close').addEventListener('click', close);
    overlay.querySelector('#modal-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#budget-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await supabase.from('presupuestos').insert({ categoria_id: document.getElementById('budget-cat').value, monto_mensual: parseFloat(document.getElementById('budget-monto').value), usuario_id: state.user.id });
      showToast('Presupuesto creado');
      close(); await loadData(); render();
    });
  }

  render();
}
