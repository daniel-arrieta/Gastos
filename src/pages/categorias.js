import { supabase } from '../lib/supabase.js';
import { state, loadData } from '../main.js';
import { showToast } from '../lib/utils.js';

const COLORS = ['#6C5CE7','#00D2A0','#FF6B6B','#FDCB6E','#74B9FF','#EC4899','#F97316','#14B8A6','#8B5CF6','#06B6D4','#64748B','#10B981'];

export function renderCategorias(container) {
  function render() {
    const gastos = state.categories.filter(c => c.tipo === 'gasto');
    const ingresos = state.categories.filter(c => c.tipo === 'ingreso');

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Categorías</h1>
        <div class="header-actions"><button class="btn btn-primary" id="btn-add-cat">+ Nueva</button></div>
      </div>
      <div class="section-title">Gastos</div>
      <div class="card" style="margin-bottom:20px">
        <table class="data-table"><thead><tr><th>Icono</th><th>Nombre</th><th>Color</th><th></th></tr></thead>
        <tbody>${gastos.map(c => `<tr>
          <td style="font-size:1.2rem">${c.icono}</td>
          <td><strong>${c.nombre}</strong></td>
          <td><span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${c.color}"></span></td>
          <td class="actions-cell"><button class="btn-icon btn-del-cat" data-id="${c.id}">🗑️</button></td>
        </tr>`).join('')}</tbody></table>
      </div>
      <div class="section-title">Ingresos</div>
      <div class="card">
        <table class="data-table"><thead><tr><th>Icono</th><th>Nombre</th><th>Color</th><th></th></tr></thead>
        <tbody>${ingresos.map(c => `<tr>
          <td style="font-size:1.2rem">${c.icono}</td>
          <td><strong>${c.nombre}</strong></td>
          <td><span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${c.color}"></span></td>
          <td class="actions-cell"><button class="btn-icon btn-del-cat" data-id="${c.id}">🗑️</button></td>
        </tr>`).join('')}</tbody></table>
      </div>`;

    document.getElementById('btn-add-cat')?.addEventListener('click', showCatModal);
    document.querySelectorAll('.btn-del-cat').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta categoría?')) return;
      await supabase.from('categorias').delete().eq('id', btn.dataset.id);
      showToast('Categoría eliminada'); await loadData(); render();
    }));
  }

  function showCatModal() {
    let selectedColor = COLORS[0];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h2 class="modal-title">Nueva Categoría</h2><button class="modal-close" id="mc">×</button></div>
        <form id="cat-form">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Nombre</label><input type="text" class="form-input" id="cat-name" required /></div>
            <div class="form-group"><label class="form-label">Tipo</label><select class="form-input" id="cat-tipo"><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select></div>
          </div>
          <div class="form-group"><label class="form-label">Icono (emoji)</label><input type="text" class="form-input" id="cat-icon" value="📦" maxlength="4" /></div>
          <div class="form-group"><label class="form-label">Color</label>
            <div class="color-options">${COLORS.map(c => `<div class="color-option ${c === selectedColor ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`).join('')}</div>
          </div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" id="mc2">Cancelar</button><button type="submit" class="btn btn-primary">Crear</button></div>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#mc').addEventListener('click', close);
    overlay.querySelector('#mc2').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelectorAll('.color-option').forEach(el => el.addEventListener('click', () => {
      overlay.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected'); selectedColor = el.dataset.color;
    }));
    overlay.querySelector('#cat-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await supabase.from('categorias').insert({ nombre: document.getElementById('cat-name').value, tipo: document.getElementById('cat-tipo').value, icono: document.getElementById('cat-icon').value, color: selectedColor });
      showToast('Categoría creada'); close(); await loadData(); render();
    });
  }

  render();
}
