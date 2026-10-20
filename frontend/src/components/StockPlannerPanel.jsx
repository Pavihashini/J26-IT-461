import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchForecastOptions, fetchStockPlan } from '../services/api.js';
import { formatDate } from '../utils.js';
import { EmptyState, Notice, Panel, StatusBadge } from './Shared.jsx';

const unitLabel = (unit) => (unit === 'loaf_450g' ? 'loaf (450 g)' : unit);
const quantity = (value) => Number(value).toLocaleString('en-LK', { maximumFractionDigits: 2 });

export default function StockPlannerPanel({ selectedDate }) {
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);
  const [stock, setStock] = useState({});
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    fetchForecastOptions()
      .then((data) => {
        if (!isCurrent) return;
        setOptions(data);
        setRestaurant((current) => current || data.restaurants[0] || '');
      })
      .catch((reason) => {
        if (isCurrent) setOptionsError(reason.message);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const runPlan = async () => {
    setLoading(true);
    setError('');
    const stockPayload = {};
    Object.entries(stock).forEach(([name, value]) => {
      if (value !== '' && Number(value) > 0) stockPayload[name] = Number(value);
    });

    try {
      setPlan(await fetchStockPlan({
        restaurant_name: restaurant,
        forecast_date: selectedDate,
        is_holiday: isHoliday,
        stock: stockPayload,
      }));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  const title = 'Remaining stock · menu options & purchase list';
  const subtitle = `Enter what is left in the kitchen to see what you can cook and what to buy for ${formatDate(selectedDate)}.`;

  if (optionsError) {
    return <Panel title={title} subtitle={subtitle}><Notice tone="warning">The planning service is unavailable: {optionsError}</Notice></Panel>;
  }

  if (!options) {
    return <Panel title={title} subtitle={subtitle}><div className="model-loading"><Loader2 size={16} className="spin" /> Loading ingredients…</div></Panel>;
  }

  const unitByIngredient = Object.fromEntries(options.ingredients.map((item) => [item.name, item.unit]));
  const cookable = plan?.dishes.filter((dish) => dish.max_portions > 0) || [];
  const blocked = plan?.dishes.filter((dish) => dish.max_portions === 0) || [];

  return <Panel title={title} subtitle={subtitle}>
    <div className="stock-planner">
    <div className="model-form">
      <label><span>Restaurant</span>
        <select value={restaurant} onChange={(event) => setRestaurant(event.target.value)}>
          {options.restaurants.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label className="model-check"><input type="checkbox" checked={isHoliday} onChange={(event) => setIsHoliday(event.target.checked)} /><span>Holiday / festival</span></label>
      <button type="button" className="button-primary" onClick={runPlan} disabled={loading || !restaurant}>
        {loading ? <><Loader2 size={15} className="spin" /> Calculating…</> : 'Calculate'}
      </button>
    </div>

    {error && <Notice tone="warning">{error}</Notice>}

    <div className="planner-grid">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Ingredient</th><th>Stock left</th></tr></thead>
          <tbody>
            {options.ingredients.map((item) => <tr key={item.name}>
              <td><div className="table-primary">{item.name}</div></td>
              <td>
                <input className="model-lag-input" type="number" min="0" step="any" placeholder="0" aria-label={`Stock left of ${item.name}`} value={stock[item.name] ?? ''} onChange={(event) => setStock((previous) => ({ ...previous, [item.name]: event.target.value }))} />
                <span className="muted"> {unitLabel(item.unit)}</span>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>

      <div className="planner-results">
        {!plan ? <EmptyState title="No plan yet" description="Enter your remaining stock and press Calculate." /> : <>
          <section>
            <h3>Dishes you can make</h3>
            {cookable.length === 0 ? <p className="muted">Remaining stock is not enough for a full portion of any dish. See the suggestions below.</p> : cookable.map((dish) => <div className="dish-option" key={dish.dish}>
              <strong>{dish.dish}</strong><StatusBadge tone="green">up to {dish.max_portions} portions</StatusBadge>
            </div>)}
          </section>
          {blocked.length > 0 && <section>
            <h3>{cookable.length === 0 ? 'Suggested stock to buy' : 'Buy more to add these dishes'}</h3>
            <p className="muted">Easiest dishes first — quantities cover 10 portions.</p>
            {blocked.map((dish) => <div className="dish-option" key={dish.dish}>
              <div><strong>{dish.dish}</strong><small>Buy: {dish.to_buy.map((item) => `${item.ingredient} ${quantity(item.quantity)} ${unitLabel(unitByIngredient[item.ingredient])}`).join(' · ')}</small></div>
              <StatusBadge tone="orange">{dish.to_buy.length} item{dish.to_buy.length === 1 ? '' : 's'}</StatusBadge>
            </div>)}
          </section>}
        </>}
      </div>
    </div>

    <div className="chart-footnote">Purchase amounts compare stock with the trained model’s expected use for the selected day ({options.metrics?.warning || 'simulated training data'}). Dish recipes use planning assumptions per portion.</div>
    </div>
  </Panel>;
}
