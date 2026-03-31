import { state } from '../main.js';
import { formatMoney } from '../lib/utils.js';
import { getMonthlySummary } from '../lib/analysis.js';

export function renderSimulador(container) {
  const summary = getMonthlySummary(state.movements);
  const totalBalance = state.accounts.reduce((s, a) => s + Number(a.saldo_actual), 0);

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Simulador de Compras</h1>
    </div>

    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr">
      <!-- Input Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">💵 Datos de la Compra</span>
        </div>
        <form id="sim-form">
          <div class="form-group">
            <label class="form-label">Precio de Contado (Cash)</label>
            <input type="number" class="form-input" id="sim-precio-contado" placeholder="Ej: 100000" min="0" required />
            <small style="color:var(--text-muted);font-size:0.7rem">Precio si pagas hoy mismo.</small>
          </div>

          <div style="padding:16px;background:var(--bg-input);border-radius:var(--radius-md);margin-bottom:18px">
            <div style="font-weight:600;font-size:0.85rem;margin-bottom:12px">🏦 Opción en Cuotas</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Cantidad de Cuotas</label>
                <input type="number" class="form-input" id="sim-cuotas" value="12" min="1" required />
              </div>
              <div class="form-group">
                <label class="form-label">Monto por Cuota</label>
                <input type="number" class="form-input" id="sim-monto-cuota" placeholder="Ej: 10000" min="0" required />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Inflación mensual estimada (%)</label>
            <input type="number" class="form-input" id="sim-inflacion" value="4" min="0" step="0.1" />
            <small style="color:var(--text-muted);font-size:0.7rem">Ayuda a calcular el valor real de las cuotas futuras.</small>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Analizar Operación</button>
        </form>
      </div>

      <!-- Result Card -->
      <div id="sim-result-container">
        <div class="card" style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);text-align:center">
          <div>
            <div style="font-size:3rem;margin-bottom:16px">📊</div>
            <div>Ingresa los datos para recibir una recomendación personalizada rápida basada en tus finanzas actuales.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('sim-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const precio = Number(document.getElementById('sim-precio-contado').value);
    const cuotas = Number(document.getElementById('sim-cuotas').value);
    const montoCuota = Number(document.getElementById('sim-monto-cuota').value);
    const inflacion = Number(document.getElementById('sim-inflacion').value) / 100;

    calculateSimulation(precio, cuotas, montoCuota, inflacion, summary, totalBalance);
  });
}

function calculateSimulation(precio, cuotas, montoCuota, inflacion, summary, balance) {
  const resultContainer = document.getElementById('sim-result-container');
  const totalCuotas = cuotas * montoCuota;
  const surcharge = totalCuotas - precio;
  const surchargePct = (surcharge / precio) * 100;

  // Present Value (NPV) considering inflation - simplified: PV = C * [(1 - (1+i)^-n) / i]
  const i = inflacion;
  const n = cuotas;
  const valorPresenteCuotas = i > 0 
    ? montoCuota * ((1 - Math.pow(1 + i, -n)) / i)
    : totalCuotas;

  const ahorroInflacion = totalCuotas - valorPresenteCuotas;
  const esMejorCuotas = valorPresenteCuotas < precio;

  // Financial health check
  const capacity = summary.income - summary.expenses;
  const fitsInBudget = montoCuota < (capacity * 0.3); // No more than 30% of available income
  const hasCash = balance >= precio;

  let recommendation = '';
  let color = '';
  let icon = '';
  let detail = '';

  if (esMejorCuotas && fitsInBudget) {
    recommendation = 'Altamente Recomendado: Cuotas';
    color = 'var(--accent-green)';
    icon = '✅';
    detail = `El valor real que pagarás ($${Math.round(valorPresenteCuotas).toLocaleString()}) es menor al precio de contado debido a la inflación.`;
  } else if (!esMejorCuotas && hasCash) {
    recommendation = 'Recomendado: Contado';
    color = 'var(--accent-green)';
    icon = '💵';
    detail = `Pagar en cuotas te sale más caro ($${Math.round(totalCuotas - precio).toLocaleString()} de recargo). Sale mejor usar tus ahorros.`;
  } else if (!fitsInBudget) {
    recommendation = 'Peligro: No aconsejable';
    color = 'var(--accent-red)';
    icon = '🚨';
    detail = `La cuota de ${formatMoney(montoCuota)} representa una carga muy alta para tu presupuesto mensual neto actual.`;
  } else {
    recommendation = 'Proceder con Cautela';
    color = 'var(--accent-orange)';
    icon = '⚠️';
    detail = `Financieramente es aceptable, pero evalúa si realmente es una necesidad prioritaria en este momento.`;
  }

  resultContainer.innerHTML = `
    <div class="card" style="height:100%">
      <div class="card-header">
        <span class="card-title">📈 Resultados del Análisis</span>
      </div>
      
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:3.5rem;margin-bottom:10px">${icon}</div>
        <h2 style="color:${color};font-size:1.4rem;font-weight:800">${recommendation}</h2>
      </div>

      <div class="data-table-simple" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-light)">
          <span style="color:var(--text-muted)">Total en cuotas</span>
          <span style="font-weight:700">${formatMoney(totalCuotas)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-light)">
          <span style="color:var(--text-muted)">Recargo nominal</span>
          <span style="font-weight:700;color:${surcharge > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}">
            ${surcharge > 0 ? '+' : ''}${formatMoney(surcharge)} (${surchargePct.toFixed(1)}%)
          </span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-light)">
          <span style="color:var(--text-muted)">Valor Real (ajustado x infla)</span>
          <span style="font-weight:700;color:var(--primary)">${formatMoney(valorPresenteCuotas)}</span>
        </div>
      </div>

      <div class="ai-card" style="min-height:auto;padding:20px;border-radius:var(--radius-md)">
        <div style="font-weight:700;margin-bottom:8px">💡 Veredicto</div>
        <div style="font-size:0.88rem;line-height:1.5;opacity:0.9">${detail}</div>
      </div>

      <div style="margin-top:20px;font-size:0.75rem;color:var(--text-muted)">
        * Basado en tu saldo actual de <strong>${formatMoney(balance)}</strong> y tu ahorro mensual promedio.
      </div>
    </div>
  `;
}
