import { state } from '../main.js';
import { formatMoney, formatDate } from '../lib/utils.js';
import { generateInsights, getMonthlySummary, getWeeklySpending, getSpendingByCategory } from '../lib/analysis.js';

export function renderDashboard(container) {
  const summary = getMonthlySummary(state.movements);
  const weekly = getWeeklySpending(state.movements);
  const byCategory = getSpendingByCategory(state.movements, state.categories);
  const insights = generateInsights(state.movements, state.budgets, state.categories);
  const recentMovements = state.movements.slice(0, 5);

  const incBadge = summary.incomeChange >= 0
    ? `<span class="kpi-badge up">▲ ${summary.incomeChange.toFixed(0)}%</span>`
    : `<span class="kpi-badge down">▼ ${Math.abs(summary.incomeChange).toFixed(0)}%</span>`;
  const expBadge = summary.expenseChange >= 0
    ? `<span class="kpi-badge down">▲ ${summary.expenseChange.toFixed(0)}%</span>`
    : `<span class="kpi-badge up">▼ ${Math.abs(summary.expenseChange).toFixed(0)}%</span>`;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Tu Panel Financiero</h1>
      <div class="header-actions">
        <button class="btn btn-primary" onclick="location.hash='/movimientos'">+ Nuevo Movimiento</button>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- AI Insights Card -->
      <div class="card ai-card">
        <div class="ai-card-content">
          <div class="ai-card-label">🤖 Asistente IA</div>
          <div class="ai-card-text">Análisis automático de tus finanzas con detección de anomalías y recomendaciones personalizadas.</div>
          <div class="ai-card-btn" id="btn-show-insights">
            Ver análisis completo
            <span class="arrow">→</span>
          </div>
        </div>
      </div>

      <!-- Weekly Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title"><span class="icon" style="background:var(--bg-badge);color:var(--primary)">📊</span> Gastos Semanales</span>
          <select class="filter-select" id="chart-period"><option>Semana</option></select>
        </div>
        <canvas id="weekly-chart" height="120"></canvas>
      </div>

      <!-- KPIs -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Resumen del Mes</span>
        </div>
        <div style="margin-bottom:20px">
          <div style="font-size:0.78rem;color:var(--text-muted)">Ingresos ${incBadge}</div>
          <div class="kpi-value" style="color:var(--accent-green)">${formatMoney(summary.income)}</div>
        </div>
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted)">Gastos ${expBadge}</div>
          <div class="kpi-value" style="color:var(--accent-red)">${formatMoney(summary.expenses)}</div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-light)">
          <div style="font-size:0.78rem;color:var(--text-muted)">Balance</div>
          <div class="kpi-value" style="color:${summary.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${formatMoney(summary.balance)}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid-bottom">
      <!-- Recent movements -->
      <div class="card">
        <div class="card-header">
          <span class="card-title"><span class="icon" style="background:rgba(0,210,160,0.1);color:var(--accent-green)">💸</span> Movimientos Recientes</span>
          <a href="#/movimientos" style="font-size:0.78rem;color:var(--primary);font-weight:600">Ver todos →</a>
        </div>
        ${recentMovements.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No hay movimientos aún</div></div>' :
          recentMovements.map(m => {
            const cat = m.categorias;
            return `<div class="movement-row">
              <div class="movement-avatar" style="background:${cat ? cat.color + '18' : 'var(--bg-input)'}">${cat ? cat.icono : '📦'}</div>
              <div class="movement-info">
                <div class="movement-name">${m.descripcion || (cat ? cat.nombre : 'Movimiento')}</div>
                <div class="movement-date">${formatDate(m.fecha)}</div>
              </div>
              <span class="movement-amount ${m.tipo === 'ingreso' ? 'income' : 'expense'}">
                ${m.tipo === 'ingreso' ? '+' : '-'}${formatMoney(m.monto)}
              </span>
            </div>`;
          }).join('')}
      </div>

      <!-- Growth donut -->
      <div class="card">
        <div class="card-header">
          <span class="card-title"><span class="icon" style="background:rgba(99,102,241,0.1);color:var(--primary)">🍩</span> Distribución</span>
        </div>
        <div class="chart-container" style="height:180px;margin-bottom:12px">
          <canvas id="donut-chart"></canvas>
          <div class="chart-center-label">
            <div class="chart-center-value">${byCategory.length}</div>
            <div class="chart-center-text">categorías</div>
          </div>
        </div>
      </div>

      <!-- Top categories -->
      <div class="card">
        <div class="card-header">
          <span class="card-title"><span class="icon" style="background:rgba(253,203,110,0.15);color:#E67E22">🏆</span> Top Categorías</span>
        </div>
        ${byCategory.length === 0 ? '<div class="empty-state"><div class="empty-state-text">Sin datos este mes</div></div>' :
          byCategory.slice(0, 5).map(c => `
            <div class="top-item">
              <div class="top-item-bar" style="background:${c.color}"></div>
              <div class="top-item-info">
                <div class="top-item-name">${c.name}</div>
              </div>
              <div class="top-item-value">${formatMoney(c.amount)}</div>
            </div>
          `).join('')}
      </div>
    </div>

    <!-- Insights modal -->
    <div class="modal-overlay" id="insights-modal" style="display:none">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">🤖 Análisis Inteligente</h2>
          <button class="modal-close" id="close-insights">×</button>
        </div>
        ${insights.map(i => `
          <div class="insight-item">
            <div class="insight-icon" style="background:${i.type === 'danger' ? 'rgba(255,107,107,0.12)' : i.type === 'warning' ? 'rgba(253,203,110,0.15)' : 'rgba(0,210,160,0.12)'}">${i.icon}</div>
            <div class="insight-text">${i.message}</div>
          </div>
        `).join('')}
      </div>
    </div>`;

  // Event listeners
  document.getElementById('btn-show-insights')?.addEventListener('click', () => {
    document.getElementById('insights-modal').style.display = 'flex';
  });
  document.getElementById('close-insights')?.addEventListener('click', () => {
    document.getElementById('insights-modal').style.display = 'none';
  });
  document.getElementById('insights-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'insights-modal') e.target.style.display = 'none';
  });

  // Render charts
  renderWeeklyChart(weekly);
  renderDonutChart(byCategory);
}

function renderWeeklyChart(data) {
  const ctx = document.getElementById('weekly-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.day),
      datasets: [{
        data: data.map(d => d.amount),
        backgroundColor: data.map((d, i) => {
          const max = Math.max(...data.map(x => x.amount));
          return d.amount === max && d.amount > 0 ? '#6C5CE7' : '#E8E5FC';
        }),
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 28
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => '$' + ctx.raw.toLocaleString() } } },
      scales: {
        y: { display: false, beginAtZero: true },
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11, weight: '500' }, color: '#9CA3AF' }, border: { display: false } }
      }
    }
  });
}

function renderDonutChart(data) {
  const ctx = document.getElementById('donut-chart');
  if (!ctx || data.length === 0) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.slice(0, 5).map(d => d.name),
      datasets: [{
        data: data.slice(0, 5).map(d => d.amount),
        backgroundColor: data.slice(0, 5).map(d => d.color),
        borderWidth: 0,
        spacing: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.label + ': $' + ctx.raw.toLocaleString() } } }
    }
  });
}
