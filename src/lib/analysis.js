// ============================================
// Analysis Engine — FinanzasApp
// Anomaly detection, insights, and projections
// ============================================

/**
 * Detect spending increase: current month vs previous month
 */
export function detectSpendingIncrease(movements) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentExpenses = movements
    .filter(m => m.tipo === 'gasto' && new Date(m.fecha).getMonth() === currentMonth && new Date(m.fecha).getFullYear() === currentYear)
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const prevExpenses = movements
    .filter(m => m.tipo === 'gasto' && new Date(m.fecha).getMonth() === prevMonth && new Date(m.fecha).getFullYear() === prevYear)
    .reduce((sum, m) => sum + Number(m.monto), 0);

  if (prevExpenses === 0) return null;

  const pctChange = ((currentExpenses - prevExpenses) / prevExpenses) * 100;

  if (pctChange > 15) {
    return {
      type: 'warning',
      icon: '📈',
      message: `Los gastos aumentaron un <strong>${pctChange.toFixed(0)}%</strong> respecto al mes anterior ($${prevExpenses.toFixed(0)} → $${currentExpenses.toFixed(0)}).`
    };
  }
  if (pctChange < -10) {
    return {
      type: 'success',
      icon: '📉',
      message: `¡Bien! Los gastos disminuyeron un <strong>${Math.abs(pctChange).toFixed(0)}%</strong> respecto al mes anterior.`
    };
  }
  return null;
}

/**
 * Detect budget overspend per category
 */
export function detectBudgetOverspend(movements, budgets, categories) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const insights = [];

  for (const budget of budgets) {
    const cat = categories.find(c => c.id === budget.categoria_id);
    if (!cat) continue;

    const spent = movements
      .filter(m =>
        m.tipo === 'gasto' &&
        m.categoria_id === budget.categoria_id &&
        new Date(m.fecha).getMonth() === currentMonth &&
        new Date(m.fecha).getFullYear() === currentYear
      )
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const pct = (spent / Number(budget.monto_mensual)) * 100;

    if (pct >= 100) {
      insights.push({
        type: 'danger',
        icon: '🚨',
        message: `<strong>${cat.nombre}</strong> excedió el presupuesto: $${spent.toFixed(0)} de $${Number(budget.monto_mensual).toFixed(0)} (${pct.toFixed(0)}%).`,
        category: cat,
        spent,
        budget: Number(budget.monto_mensual),
        pct
      });
    } else if (pct >= 75) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        message: `<strong>${cat.nombre}</strong> está al ${pct.toFixed(0)}% del presupuesto ($${spent.toFixed(0)} de $${Number(budget.monto_mensual).toFixed(0)}).`,
        category: cat,
        spent,
        budget: Number(budget.monto_mensual),
        pct
      });
    }
  }

  return insights;
}

/**
 * Detect sustained growth trend (3 months)
 */
export function detectGrowthTrend(movements) {
  const now = new Date();
  const months = [];

  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();

    const total = movements
      .filter(m => m.tipo === 'gasto' && new Date(m.fecha).getMonth() === month && new Date(m.fecha).getFullYear() === year)
      .reduce((sum, m) => sum + Number(m.monto), 0);

    months.push(total);
  }

  if (months[0] > 0 && months[1] > months[0] && months[2] > months[1]) {
    return {
      type: 'warning',
      icon: '📊',
      message: `Crecimiento sostenido de gastos en los últimos 3 meses: $${months[0].toFixed(0)} → $${months[1].toFixed(0)} → $${months[2].toFixed(0)}.`
    };
  }
  return null;
}

/**
 * Detect unusual expenses (> 2x category average)
 */
export function detectUnusualExpenses(movements) {
  const expenses = movements.filter(m => m.tipo === 'gasto');
  const insights = [];

  // Group by category
  const byCategory = {};
  for (const m of expenses) {
    const key = m.categoria_id || 'sin_categoria';
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(m);
  }

  for (const [catId, catMovements] of Object.entries(byCategory)) {
    if (catMovements.length < 3) continue;

    const amounts = catMovements.map(m => Number(m.monto));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Check last 3 movements for outliers
    const recent = catMovements.slice(-3);
    for (const m of recent) {
      if (Number(m.monto) > avg * 2) {
        insights.push({
          type: 'warning',
          icon: '🔍',
          message: `Gasto inusual de <strong>$${Number(m.monto).toFixed(0)}</strong> en ${m.descripcion || 'una categoría'} (promedio: $${avg.toFixed(0)}).`
        });
      }
    }
  }

  return insights;
}

/**
 * Generate all insights
 */
export function generateInsights(movements, budgets, categories) {
  const insights = [];

  const spendingIncrease = detectSpendingIncrease(movements);
  if (spendingIncrease) insights.push(spendingIncrease);

  const budgetAlerts = detectBudgetOverspend(movements, budgets, categories);
  insights.push(...budgetAlerts);

  const growthTrend = detectGrowthTrend(movements);
  if (growthTrend) insights.push(growthTrend);

  const unusualExpenses = detectUnusualExpenses(movements);
  insights.push(...unusualExpenses);

  // If no issues detected, add a positive insight
  if (insights.length === 0) {
    insights.push({
      type: 'success',
      icon: '✅',
      message: '¡Todo bien! No se detectaron anomalías ni excesos en tus finanzas este mes.'
    });
  }

  return insights;
}

/**
 * Calculate projections based on historical data
 */
export function calculateProjections(movements) {
  const now = new Date();
  const projections = { income: 0, expenses: 0, balance: 0 };

  // Get last 3 months avg
  const monthsData = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();

    const income = movements
      .filter(m => m.tipo === 'ingreso' && new Date(m.fecha).getMonth() === month && new Date(m.fecha).getFullYear() === year)
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const expenses = movements
      .filter(m => m.tipo === 'gasto' && new Date(m.fecha).getMonth() === month && new Date(m.fecha).getFullYear() === year)
      .reduce((sum, m) => sum + Number(m.monto), 0);

    monthsData.push({ income, expenses });
  }

  if (monthsData.length > 0) {
    projections.income = monthsData.reduce((s, m) => s + m.income, 0) / monthsData.length;
    projections.expenses = monthsData.reduce((s, m) => s + m.expenses, 0) / monthsData.length;
    projections.balance = projections.income - projections.expenses;
  }

  return projections;
}

/**
 * Get weekly spending for bar chart
 */
export function getWeeklySpending(movements) {
  const now = new Date();
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const result = days.map(d => ({ day: d, amount: 0 }));

  // Get current week's expenses
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const expenses = movements.filter(m => {
    const d = new Date(m.fecha);
    return m.tipo === 'gasto' && d >= startOfWeek;
  });

  for (const exp of expenses) {
    const d = new Date(exp.fecha);
    let dayIdx = d.getDay() - 1;
    if (dayIdx < 0) dayIdx = 6; // Sunday
    result[dayIdx].amount += Number(exp.monto);
  }

  return result;
}

/**
 * Get spending by category (for donut chart)
 */
export function getSpendingByCategory(movements, categories) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const expenses = movements.filter(m =>
    m.tipo === 'gasto' &&
    new Date(m.fecha).getMonth() === currentMonth &&
    new Date(m.fecha).getFullYear() === currentYear
  );

  const byCategory = {};
  for (const m of expenses) {
    const cat = categories.find(c => c.id === m.categoria_id);
    const catName = cat ? cat.nombre : 'Sin categoría';
    const catColor = cat ? cat.color : '#9CA3AF';
    if (!byCategory[catName]) {
      byCategory[catName] = { name: catName, color: catColor, amount: 0 };
    }
    byCategory[catName].amount += Number(m.monto);
  }

  return Object.values(byCategory).sort((a, b) => b.amount - a.amount);
}

/**
 * Get monthly summary (income, expenses, balance)
 */
export function getMonthlySummary(movements) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentIncome = movements
    .filter(m => m.tipo === 'ingreso' && new Date(m.fecha).getMonth() === currentMonth && new Date(m.fecha).getFullYear() === currentYear)
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const currentExpenses = movements
    .filter(m => m.tipo === 'gasto' && new Date(m.fecha).getMonth() === currentMonth && new Date(m.fecha).getFullYear() === currentYear)
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const prevIncome = movements
    .filter(m => m.tipo === 'ingreso' && new Date(m.fecha).getMonth() === prevMonth && new Date(m.fecha).getFullYear() === prevYear)
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const prevExpenses = movements
    .filter(m => m.tipo === 'gasto' && new Date(m.fecha).getMonth() === prevMonth && new Date(m.fecha).getFullYear() === prevYear)
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome * 100) : 0;
  const expenseChange = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses * 100) : 0;

  return {
    income: currentIncome,
    expenses: currentExpenses,
    balance: currentIncome - currentExpenses,
    incomeChange,
    expenseChange
  };
}
