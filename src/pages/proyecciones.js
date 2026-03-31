import { state } from '../main.js';
import { formatMoney } from '../lib/utils.js';
import { calculateProjections } from '../lib/analysis.js';

export function renderProyecciones(container) {
  const proj = calculateProjections(state.movements);

  // Build last 6 months data for chart
  const now = new Date();
  const monthsLabels = [];
  const incomeData = [];
  const expenseData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsLabels.push(d.toLocaleDateString('es-AR', { month: 'short' }));
    const month = d.getMonth();
    const year = d.getFullYear();

    incomeData.push(state.movements
      .filter(m => m.tipo === 'ingreso' && new Date(m.fecha).getMonth() === month && new Date(m.fecha).getFullYear() === year)
      .reduce((s, m) => s + Number(m.monto), 0));

    expenseData.push(state.movements
      .filter(m => m.tipo === 'gasto' && new Date(m.fecha).getMonth() === month && new Date(m.fecha).getFullYear() === year)
      .reduce((s, m) => s + Number(m.monto), 0));
  }

  // Add projected month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  monthsLabels.push(nextMonth.toLocaleDateString('es-AR', { month: 'short' }) + ' (est)');
  incomeData.push(proj.income);
  expenseData.push(proj.expenses);

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Proyecciones</h1>
    </div>
    <div class="dashboard-grid" style="grid-template-columns:1fr 1fr 1fr">
      <div class="card" style="border-left:4px solid var(--accent-green)">
        <div style="font-size:0.78rem;color:var(--text-muted)">Ingreso proyectado</div>
        <div class="kpi-value" style="color:var(--accent-green)">${formatMoney(proj.income)}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">Promedio últimos 3 meses</div>
      </div>
      <div class="card" style="border-left:4px solid var(--accent-red)">
        <div style="font-size:0.78rem;color:var(--text-muted)">Gasto proyectado</div>
        <div class="kpi-value" style="color:var(--accent-red)">${formatMoney(proj.expenses)}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">Promedio últimos 3 meses</div>
      </div>
      <div class="card" style="border-left:4px solid ${proj.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
        <div style="font-size:0.78rem;color:var(--text-muted)">Balance proyectado</div>
        <div class="kpi-value" style="color:${proj.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${formatMoney(proj.balance)}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${proj.balance >= 0 ? '💪 Superávit estimado' : '⚠️ Déficit estimado'}</div>
      </div>
    </div>
    <div class="card" style="margin-top:20px">
      <div class="card-header">
        <span class="card-title"><span class="icon" style="background:var(--bg-badge);color:var(--primary)">📈</span> Tendencia de 6 meses + Proyección</span>
      </div>
      <canvas id="projection-chart" height="180"></canvas>
    </div>`;

  // Render chart
  const ctx = document.getElementById('projection-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthsLabels,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeData,
          borderColor: '#00D2A0',
          backgroundColor: 'rgba(0,210,160,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#00D2A0',
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5
        },
        {
          label: 'Gastos',
          data: expenseData,
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255,107,107,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#FF6B6B',
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': $' + ctx.raw.toLocaleString() } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { font: { family: 'Inter', size: 11 }, callback: v => '$' + (v / 1000).toFixed(0) + 'k' } },
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11, weight: '500' } } }
      }
    }
  });
}
