import { supabase } from './lib/supabase.js';
import { Router } from './lib/router.js';
import { renderAuth } from './pages/auth.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderMovimientos } from './pages/movimientos.js';
import { renderPresupuestos } from './pages/presupuestos.js';
import { renderCategorias } from './pages/categorias.js';
import { renderCuentas } from './pages/cuentas.js';
import { renderProyecciones } from './pages/proyecciones.js';

const app = document.getElementById('app');
const router = new Router();

// Shared state
export const state = {
  user: null,
  categories: [],
  accounts: [],
  movements: [],
  budgets: [],
  recurringIncome: []
};

export async function loadData() {
  const [cats, accs, movs, buds, recs] = await Promise.all([
    supabase.from('categorias').select('*').order('nombre'),
    supabase.from('cuentas').select('*').order('nombre'),
    supabase.from('movimientos').select('*, categorias(nombre, color, icono)').order('fecha', { ascending: false }),
    supabase.from('presupuestos').select('*, categorias(nombre, color, icono)').order('created_at'),
    supabase.from('ingresos_recurrentes').select('*').order('cliente')
  ]);
  state.categories = cats.data || [];
  state.accounts = accs.data || [];
  state.movements = movs.data || [];
  state.budgets = buds.data || [];
  state.recurringIncome = recs.data || [];
}

function renderSidebar(active) {
  const links = [
    { hash: '/', icon: '📊', label: 'Dashboard' },
    { hash: '/movimientos', icon: '💸', label: 'Movimientos' },
    { hash: '/presupuestos', icon: '🎯', label: 'Presupuestos' },
    { hash: '/categorias', icon: '🏷️', label: 'Categorías' },
    { hash: '/cuentas', icon: '🏦', label: 'Cuentas' },
    { hash: '/proyecciones', icon: '🔮', label: 'Proyecciones' },
  ];
  return `
    <aside class="sidebar">
      <div class="sidebar-logo">💰</div>
      <nav class="sidebar-nav">
        ${links.map(l => `
          <a href="#${l.hash}" class="sidebar-link ${active === l.hash ? 'active' : ''}">
            ${l.icon}
            <span class="tooltip">${l.label}</span>
          </a>
        `).join('')}
      </nav>
      <button class="sidebar-link" id="btn-logout" title="Cerrar sesión">🚪</button>
    </aside>`;
}

function renderPage(hash, contentFn) {
  app.innerHTML = `
    <div class="app-layout">
      ${renderSidebar(hash)}
      <main class="main-content" id="page-content"></main>
    </div>`;
  const content = document.getElementById('page-content');
  contentFn(content);
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    state.user = null;
    router.navigate('/auth');
  });
}

async function guardAuth(hash, renderFn) {
  if (!state.user) {
    router.navigate('/auth');
    return;
  }
  await loadData();
  renderPage(hash, renderFn);
}

router
  .on('/auth', () => renderAuth(app, router, state))
  .on('/', () => guardAuth('/', renderDashboard))
  .on('/movimientos', () => guardAuth('/movimientos', renderMovimientos))
  .on('/presupuestos', () => guardAuth('/presupuestos', renderPresupuestos))
  .on('/categorias', () => guardAuth('/categorias', renderCategorias))
  .on('/cuentas', () => guardAuth('/cuentas', renderCuentas))
  .on('/proyecciones', () => guardAuth('/proyecciones', renderProyecciones));

// Init
supabase.auth.getSession().then(({ data: { session } }) => {
  state.user = session?.user || null;
  if (!state.user) {
    router.navigate('/auth');
  }
  router.start();
});

supabase.auth.onAuthStateChange((_event, session) => {
  state.user = session?.user || null;
});
