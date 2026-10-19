import React, { useEffect, useMemo, useState } from 'react';
import { Cpu, Loader2 } from 'lucide-react';
import { fetchConsumptionForecast, fetchForecastOptions } from '../services/api.js';
import { formatDate } from '../utils.js';
import { Notice, Panel, StatusBadge } from './Shared.jsx';

const unitLabel = (unit) => (unit === 'loaf_450g' ? 'loaf (450 g)' : unit);

export default function IngredientForecastPanel({ selectedDate }) {
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [weather, setWeather] = useState('Sunny');
  const [customers, setCustomers] = useState(200);
  const [isHoliday, setIsHoliday] = useState(false);
  const [history, setHistory] = useState({});
  const [result, setResult] = useState(null);
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

  const forecastByIngredient = useMemo(
    () => Object.fromEntries((result?.forecasts || []).map((row) => [row.ingredient, row.predicted_qty])),
    [result],
  );
  const maxQuantity = Math.max(0, ...Object.values(forecastByIngredient));
  const totalItems = result?.forecasts.filter((row) => row.predicted_qty > 0).length || 0;

  const updateHistory = (ingredient, field, value) => {
    setHistory((previous) => ({ ...previous, [ingredient]: { ...previous[ingredient], [field]: value } }));
  };

  const runForecast = async () => {
    setLoading(true);
    setError('');
    const payloadHistory = {};
    Object.entries(history).forEach(([ingredient, values]) => {
      const entry = {};
      if (values.previous_day_qty !== undefined && values.previous_day_qty !== '') entry.previous_day_qty = Number(values.previous_day_qty);
      if (values.avg_7day_qty !== undefined && values.avg_7day_qty !== '') entry.avg_7day_qty = Number(values.avg_7day_qty);
      if (Object.keys(entry).length) payloadHistory[ingredient] = entry;
    });

    try {
      setResult(await fetchConsumptionForecast({
        restaurant_name: restaurant,
        forecast_date: selectedDate,
        estimated_customers: Math.max(0, Math.round(Number(customers) || 0)),
        weather,
        is_holiday: isHoliday,
        history: payloadHistory,
      }));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  const title = 'Required ingredient quantity · Random Forest Regressor';
  const subtitle = `Predicted ingredient consumption for ${formatDate(selectedDate)}, calculated by the trained model in the backend.`;

  if (optionsError) {
    return <Panel title={title} subtitle={subtitle}><Notice tone="warning">The forecasting model is unavailable: {optionsError}</Notice></Panel>;
  }

  if (!options) {
    return <Panel title={title} subtitle={subtitle}><div className="model-loading"><Loader2 size={16} className="spin" /> Loading model options…</div></Panel>;
  }

  return <Panel
    title={title}
    subtitle={subtitle}
    action={<span className="micro-tag"><Cpu size={12} /> {options.metrics ? `R² ${options.metrics.R2.toFixed(3)} · MAE ${options.metrics.MAE.toFixed(2)}` : 'Random Forest'}</span>}
  >
    <div className="model-form">
      <label><span>Restaurant</span>
        <select value={restaurant} onChange={(event) => setRestaurant(event.target.value)}>
          {options.restaurants.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label><span>Weather</span>
        <select value={weather} onChange={(event) => setWeather(event.target.value)}>
          {options.weather.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label><span>Expected customers</span>
        <input type="number" min="0" max="100000" value={customers} onChange={(event) => setCustomers(event.target.value)} />
      </label>
      <label className="model-check"><input type="checkbox" checked={isHoliday} onChange={(event) => setIsHoliday(event.target.checked)} /><span>Holiday / festival</span></label>
      <button type="button" className="button-primary" onClick={runForecast} disabled={loading || !restaurant}>
        {loading ? <><Loader2 size={15} className="spin" /> Predicting…</> : 'Predict ingredients'}
      </button>
    </div>

    {error && <Notice tone="warning">{error}</Notice>}
    {result && <p className="model-summary">{result.restaurant_name} · {result.day_of_week} · {totalItems} ingredients with predicted use</p>}

    <div className="table-wrap">
      <table>
        <thead><tr><th>Ingredient</th><th>Yesterday's use</th><th>7-day average</th><th>Predicted consumption</th></tr></thead>
        <tbody>
          {options.ingredients.map((item) => {
            const predicted = forecastByIngredient[item.name];
            return <tr key={item.name}>
              <td><div className="table-primary">{item.name}</div><div className="table-secondary">{unitLabel(item.unit)}</div></td>
              <td><input className="model-lag-input" type="number" min="0" step="any" placeholder="auto" aria-label={`Yesterday's use of ${item.name}`} value={history[item.name]?.previous_day_qty ?? ''} onChange={(event) => updateHistory(item.name, 'previous_day_qty', event.target.value)} /></td>
              <td><input className="model-lag-input" type="number" min="0" step="any" placeholder="auto" aria-label={`7-day average use of ${item.name}`} value={history[item.name]?.avg_7day_qty ?? ''} onChange={(event) => updateHistory(item.name, 'avg_7day_qty', event.target.value)} /></td>
              <td>
                {predicted === undefined ? <span className="muted">—</span> : <div className="model-result">
                  <div className="bar-line"><div className="bar predicted" style={{ width: `${maxQuantity > 0 ? (predicted / maxQuantity) * 100 : 0}%` }} /></div>
                  <StatusBadge tone="green">{predicted.toLocaleString('en-LK', { maximumFractionDigits: 2 })} {unitLabel(item.unit)}</StatusBadge>
                </div>}
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>

    <div className="chart-footnote">Leave the recent-use fields as “auto” and the model fills typical values; entering real figures improves accuracy. {options.metrics?.warning}</div>
  </Panel>;
}
