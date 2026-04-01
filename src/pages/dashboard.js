import { state } from '../main.js';
import { formatMoney, formatDate } from '../lib/utils.js';
import { generateInsights, getMonthlySummary, getWeeklySpending, getDailySpending, getMonthlySpending, getSpendingByCategory, getCollectionSummary } from '../lib/analysis.js';

export function renderDashboard(container) {
  const summary = getMonthlySummary(state.movements);
  const weekly = getWeeklySpending(state.movements);
  const byCategory = getSpendingByCategory(state.movements, state.categories);
  const insights = generateInsights(state.movements, state.budgets, state.categories);
  const recentMovements = state.movements.slice(0, 5);
  const collections = getCollectionSummary(state.movements, state.recurringIncome);

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
      <div class="card ai-card ${insights[0]?.type === 'danger' ? 'danger' : ''}">
        <div class="ai-card-content">
          <div class="ai-card-label ${insights[0]?.type === 'danger' ? 'blink-red' : ''}">
            🤖 Asistente IA 
            ${insights[0]?.type === 'danger' ? '<span class="alert-dot blink-red"></span>' : ''}
          </div>
          <div class="ai-card-text" id="ai-realtime-text" style="${insights[0]?.type === 'danger' ? 'font-weight:700;color:var(--accent-red)' : ''}">
            ${insights[0] ? insights[0].message : 'Análisis automático de tus finanzas.'}
          </div>
          <div class="ai-card-btn" id="btn-show-insights">
            ${insights.length > 1 ? `Ver ${insights.length} análisis más` : 'Ver análisis completo'}
            <span class="arrow">→</span>
          </div>
        </div>
      </div>

      <!-- Weekly Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title"><span class="icon" style="background:var(--bg-badge);color:var(--primary)">📊</span> Gastos</span>
          <select class="filter-select" id="chart-period">
            <option value="weekly">Semanal</option>
            <option value="daily">Diario (30d)</option>
            <option value="monthly">Mensual (12m)</option>
          </select>
        </div>
        <div class="chart-container" style="height:300px;margin-bottom:12px">
          <canvas id="main-chart"></canvas>
        </div>
      </div>

      <!-- KPIs -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Resumen del Mes</span>
        </div>
        <div style="margin-bottom:12px">
          <div style="font-size:0.75rem;color:var(--text-muted)">Ingresos ${incBadge}</div>
          <div class="kpi-value" style="color:var(--accent-green);font-size:1.4rem">${formatMoney(summary.income)}</div>
        </div>
        <div style="margin-bottom:12px">
          <div style="font-size:0.75rem;color:var(--text-muted)">Gastos ${expBadge}</div>
          <div class="kpi-value" style="color:var(--accent-red);font-size:1.4rem">${formatMoney(summary.expenses)}</div>
        </div>
        
        <!-- Collections Mini-panel -->
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-light)">
          <div class="card-title" style="font-size:0.8rem;margin-bottom:8px">
            <span class="icon" style="width:20px;height:20px;font-size:0.7rem;background:rgba(108,92,231,0.1);color:var(--primary)">💼</span>
            Cobranza
          </div>
          <div class="progress-container" style="margin-bottom:4px">
            <div class="progress-header">
              <span class="progress-label" style="font-size:0.7rem">Progreso</span>
              <span class="progress-pct" style="font-size:0.7rem;color:var(--primary)">${collections.pct.toFixed(0)}%</span>
            </div>
            <div class="progress-bar" style="height:6px">
              <div class="progress-fill" style="width:${collections.pct}%;background:var(--primary)"></div>
            </div>
          </div>
          <div style="font-size:0.68rem;color:var(--text-muted)">
            ${formatMoney(collections.collected)} de ${formatMoney(collections.expected)}
          </div>
        </div>
      </div>

      <!-- Income vs Expenses Comparison -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <span class="icon" style="background:rgba(0,210,160,0.1);color:var(--accent-green)">⚖️</span> 
            Ingresos vs Gastos
          </span>
        </div>
        <div class="chart-container" style="height:250px;margin-bottom:12px">
          <canvas id="comparison-chart"></canvas>
        </div>
        <div style="display:flex;justify-content:center;gap:20px;font-size:0.75rem;color:var(--text-muted)">
          <div style="display:flex;align-items:center;gap:4px">
            <div style="width:8px;height:8px;border-radius:2px;background:var(--accent-green)"></div> Ingresos
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            <div style="width:8px;height:8px;border-radius:2px;background:var(--accent-red)"></div> Gastos
          </div>
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
        <div class="chart-container" style="height:140px;margin-bottom:8px">
          <canvas id="donut-chart"></canvas>
          <div class="chart-center-label">
            <div class="chart-center-value" style="font-size:1.1rem">${byCategory.length}</div>
            <div class="chart-center-text" style="font-size:0.65rem">categorías</div>
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

  const chartSelect = document.getElementById('chart-period');
  let mainChart = null;

  function updateMainChart(period) {
    let data = [];
    if (period === 'weekly') data = getWeeklySpending(state.movements);
    else if (period === 'daily') data = getDailySpending(state.movements);
    else if (period === 'monthly') data = getMonthlySpending(state.movements);

    if (mainChart) mainChart.destroy();
    mainChart = renderMainChart(data, period);
  }

  chartSelect?.addEventListener('change', (e) => updateMainChart(e.target.value));

  // Initial render
  updateMainChart('weekly');
  renderDonutChart(byCategory);
  renderComparisonChart(summary.income, summary.expenses);
}

function renderComparisonChart(income, expenses) {
  const ctx = document.getElementById('comparison-chart');
  if (!ctx) return;
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Este Mes'],
      datasets: [
        {
          label: 'Ingresos',
          data: [income],
          backgroundColor: '#00D2A0',
          borderRadius: 6,
          barThickness: 40
        },
        {
          label: 'Gastos',
          data: [expenses],
          backgroundColor: '#FF6B6B',
          borderRadius: 6,
          barThickness: 40
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': $' + ctx.raw.toLocaleString() } }
      },
      scales: {
        y: { 
          beginAtZero: true,
          grid: { color: 'rgba(229,231,235,0.4)', drawTicks: false },
          ticks: { font: { size: 10 }, color: '#9CA3AF' },
          border: { display: false }
        },
        x: { 
          grid: { display: false },
          ticks: { display: false },
          border: { display: false }
        }
      }
    }
  });
}

function renderMainChart(data, period) {
  const ctx = document.getElementById('main-chart');
  if (!ctx) return;
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.amount),
        backgroundColor: data.map((d, i) => {
          const max = Math.max(...data.map(x => x.amount));
          return d.amount === max && d.amount > 0 ? '#6C5CE7' : '#E8E5FC';
        }),
        borderRadius: 6,
        borderSkipped: false,
        barThickness: period === 'daily' ? 'flex' : 28,
        maxBarThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => '$' + ctx.raw.toLocaleString() } } },
      scales: {
        y: { display: false, beginAtZero: true },
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: period === 'daily' ? 9 : 11, weight: '500' }, color: '#9CA3AF' }, border: { display: false } }
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
      cutout: '60%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.label + ': $' + ctx.raw.toLocaleString() } } }
    }
  });
}
