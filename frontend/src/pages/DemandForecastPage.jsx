import React, { useMemo } from 'react';
import { CalendarDays, ChefHat, CloudSun, Gauge, Leaf, Plus, Minus, ShoppingBasket, Sparkles, TrendingUp } from 'lucide-react';
import { initialDishes, ingredientCatalog, todayISO } from '../data/mockData.js';
import { formatDate } from '../utils.js';
import IngredientForecastPanel from '../components/IngredientForecastPanel.jsx';
import { FlowStrip, Notice, PageHeading, Panel, StatCard, StatusBadge } from '../components/Shared.jsx';

const ingredientById = Object.fromEntries(ingredientCatalog.map((item) => [item.id, item]));

function dateMultiplier(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();
  if (day === 0 || day === 6) return 1.12;
  if (day === 5) return 1.06;
  if (day === 1) return 0.94;
  return 1;
}

function number(value, digits = 1) {
  return Number(value.toFixed(digits)).toLocaleString('en-LK', { maximumFractionDigits: digits });
}

export default function DemandForecastPage({ selectedDate, setSelectedDate, prepQuantities, setPrepQuantities }) {
  const multiplier = dateMultiplier(selectedDate);
  const dishes = useMemo(() => initialDishes.map((dish) => ({
    ...dish,
    predictedForDate: Math.max(1, Math.round(dish.predicted * multiplier)),
  })), [multiplier]);

  const ingredientRequirements = useMemo(() => {
    const totals = new Map();
    dishes.forEach((dish) => {
      const prepared = Math.max(0, Number(prepQuantities[dish.id] ?? dish.basePrep));
      dish.recipe.forEach((recipeLine) => {
        const key = `${recipeLine.ingredientId}|${recipeLine.unit}`;
        const current = totals.get(key) || { ingredientId: recipeLine.ingredientId, unit: recipeLine.unit, amount: 0, dishes: [] };
        current.amount += prepared * recipeLine.amount;
        if (!current.dishes.includes(dish.name)) current.dishes.push(dish.name);
        totals.set(key, current);
      });
    });
    return [...totals.values()].map((item) => ({
      ...item,
      name: ingredientById[item.ingredientId]?.name || item.ingredientId,
      amount: item.unit === 'units' ? Math.round(item.amount) : Number(item.amount.toFixed(2)),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [dishes, prepQuantities]);

  const totalPredicted = dishes.reduce((sum, dish) => sum + dish.predictedForDate, 0);
  const totalPrepared = dishes.reduce((sum, dish) => sum + Math.max(0, Number(prepQuantities[dish.id] ?? dish.basePrep)), 0);
  const buffer = totalPrepared - totalPredicted;
  const maxDemand = Math.max(...dishes.flatMap((dish) => [dish.historical, dish.predictedForDate]));
  const isWeekend = [0, 6].includes(new Date(`${selectedDate}T12:00:00`).getDay());

  const changePrep = (id, value) => {
    const next = Math.max(0, Math.min(999, Math.round(Number(value) || 0)));
    setPrepQuantities((previous) => ({ ...previous, [id]: next }));
  };

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="Component 01 · Plan before you prepare"
        title="Demand forecasting"
        description="Turn sales history and demand signals into dish-level forecasts, ingredient quantities, and practical kitchen preparation plans."
        actions={<label className="date-control"><CalendarDays size={16} /><span>Forecast date</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>}
      />

      <div className="stats-grid four">
        <StatCard label="Predicted portions" value={totalPredicted.toLocaleString('en-LK')} detail="Across 4 menu items" icon={TrendingUp} tone="green" />
        <StatCard label="Planned preparation" value={totalPrepared.toLocaleString('en-LK')} detail="Editable kitchen plan" icon={ChefHat} tone="orange" />
        <StatCard label="Preparation buffer" value={`${buffer >= 0 ? '+' : ''}${buffer}`} detail={buffer >= 0 ? 'Portions above forecast' : 'Below predicted demand'} icon={Gauge} tone="purple" />
        <StatCard label="Demand signals" value="6 inputs" detail="POS, guests, weather, calendar" icon={Sparkles} tone="blue" />
      </div>

      <Panel className="process-panel" title="How the recommendation is formed" subtitle="A simplified view of the workflow presented in the research proposal.">
        <FlowStrip items={['Demand-related data', 'Dish-level prediction', 'Ingredient quantities', 'Preparation plan']} />
      </Panel>

      <div className="two-column-grid forecast-top-grid">
        <Panel title="Dish demand prediction" subtitle={`Historical reference vs. simulated forecast for ${formatDate(selectedDate)}.`} action={<span className="micro-tag"><span className="dot dot-green" /> Demo values</span>}>
          <div className="chart-legend"><span><i className="legend-box historical" />Historical</span><span><i className="legend-box predicted" />Predicted</span></div>
          <div className="dish-chart-list">
            {dishes.map((dish) => (
              <div className="dish-chart-row" key={dish.id}>
                <div className="dish-chart-name"><strong>{dish.name}</strong><span>{dish.category}</span></div>
                <div className="dish-bars">
                  <div className="bar-line"><div className="bar historical" style={{ width: `${(dish.historical / maxDemand) * 100}%` }} /><span>{dish.historical}</span></div>
                  <div className="bar-line"><div className="bar predicted" style={{ width: `${(dish.predictedForDate / maxDemand) * 100}%` }} /><span>{dish.predictedForDate}</span></div>
                </div>
                <div className="change-label">{((dish.predictedForDate - dish.historical) / dish.historical * 100) >= 0 ? ' +' : ''}{(((dish.predictedForDate - dish.historical) / dish.historical) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
          <div className="chart-footnote">Forecast quantities are illustrative and respond to the selected day-of-week scenario; no trained model is running.</div>
        </Panel>

        <Panel title="Demand signals in this scenario" subtitle="Mock inputs demonstrate how the context can influence planning.">
          <div className="signal-list">
            <div className="signal-row"><span className="signal-icon"><ShoppingBasket size={17} /></span><div><strong>Historical POS sales</strong><p>Recent dish sales provide the baseline.</p></div><StatusBadge tone="green">Available</StatusBadge></div>
            <div className="signal-row"><span className="signal-icon"><TrendingUp size={17} /></span><div><strong>Daily customer count</strong><p>Illustrative guest volume: 215 covers.</p></div><StatusBadge tone="green">Available</StatusBadge></div>
            <div className="signal-row"><span className="signal-icon"><CloudSun size={17} /></span><div><strong>Weather conditions</strong><p>Warm with intermittent showers — demo context.</p></div><StatusBadge tone="blue">Mock input</StatusBadge></div>
            <div className="signal-row"><span className="signal-icon"><CalendarDays size={17} /></span><div><strong>Day / public holiday / event</strong><p>{isWeekend ? 'Weekend uplift is applied in this example.' : 'Standard weekday scenario; no major event assumed.'}</p></div><StatusBadge tone="blue">Mock input</StatusBadge></div>
            <div className="signal-row"><span className="signal-icon"><Sparkles size={17} /></span><div><strong>Seasonality & promotions</strong><p>No promotion or special event uplift is added.</p></div><StatusBadge tone="neutral">Not applied</StatusBadge></div>
          </div>
        </Panel>
      </div>

      <Panel title="Kitchen preparation recommendations" subtitle="Adjust portion counts to see the shared ingredient requirement totals update below.">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Dish</th><th>Predicted demand</th><th>Prep recommendation</th><th>Buffer</th><th>Why this quantity?</th></tr></thead>
            <tbody>
              {dishes.map((dish) => {
                const quantity = Math.max(0, Number(prepQuantities[dish.id] ?? dish.basePrep));
                const difference = quantity - dish.predictedForDate;
                return <tr key={dish.id}>
                  <td><div className="table-primary">{dish.name}</div><div className="table-secondary">{dish.category}</div></td>
                  <td><strong>{dish.predictedForDate}</strong> <span className="muted">portions</span></td>
                  <td>
                    <div className="quantity-stepper">
                      <button type="button" aria-label={`Reduce ${dish.name} preparation`} onClick={() => changePrep(dish.id, quantity - 1)}><Minus size={14} /></button>
                      <input aria-label={`Preparation portions for ${dish.name}`} type="number" min="0" max="999" step="1" value={quantity} onChange={(event) => changePrep(dish.id, event.target.value)} />
                      <button type="button" aria-label={`Increase ${dish.name} preparation`} onClick={() => changePrep(dish.id, quantity + 1)}><Plus size={14} /></button>
                    </div>
                  </td>
                  <td><StatusBadge tone={difference < 0 ? 'orange' : difference > 0 ? 'green' : 'neutral'}>{difference > 0 ? `+${difference}` : difference} portions</StatusBadge></td>
                  <td className="recommendation-cell">{difference < 0 ? 'Below forecast — review service capacity.' : difference === 0 ? 'Matches forecast; monitor actual demand.' : dish.detail}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Combined ingredient quantity recommendation" subtitle="Shared ingredients are consolidated once across the selected preparation plan, avoiding duplicate totals.">
        <div className="ingredient-grid">
          {ingredientRequirements.map((item) => (
            <div className="ingredient-quantity-card" key={`${item.ingredientId}-${item.unit}`}>
              <div className="ingredient-small-icon"><Leaf size={17} /></div>
              <div className="ingredient-quantity-main"><span>{item.name}</span><strong>{number(item.amount, item.unit === 'units' ? 0 : 2)} <small>{item.unit}</small></strong><p>Used in {item.dishes.length > 1 ? `${item.dishes.length} dishes` : item.dishes[0]}</p></div>
            </div>
          ))}
        </div>
      </Panel>

      <IngredientForecastPanel selectedDate={selectedDate} />

      <Notice>The dish forecasts, guest counts, and recipe quantities above are demonstration data. The ingredient quantity prediction is produced by a Random Forest Regressor trained on simulated data, so it demonstrates the method rather than proving real-world accuracy.</Notice>
    </div>
  );
}
