import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Loader2 } from 'lucide-react';
import { fetchForecastOptions, fetchWeeklyForecast } from '../services/api.js';
import { formatDate } from '../utils.js';
import { Notice, Panel, StatusBadge } from './Shared.jsx';

const DAYS = 7;
const unitLabel = (unit) => (unit === 'loaf_450g' ? 'loaf (450 g)' : unit);
const amount = (value) => Number(value).toLocaleString('en-LK', { maximumFractionDigits: 2 });
const shortDay = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

function windowDates(startISO) {
  const start = new Date(`${startISO}T12:00:00`);
  return Array.from({ length: DAYS }, (_, offset) => {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const date = String(day.getDate()).padStart(2, '0');
    return `${day.getFullYear()}-${month}-${date}`;
  });
}

export default function WeeklyOutlookPanel({ selectedDate }) {
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [weather, setWeather] = useState('Sunny');
  const [customers, setCustomers] = useState(200);
  const [holidays, setHolidays] = useState([]);
  const [result, setResult] = useState(null);
  const [ingredient, setIngredient] = useState('');
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

  const dates = useMemo(() => windowDates(selectedDate), [selectedDate]);

  // A new start date makes the previous result describe different days.
  useEffect(() => {
    setResult(null);
    setHolidays([]);
  }, [selectedDate]);

  const topIngredients = useMemo(
    () => [...(result?.totals || [])].filter((row) => row.predicted_qty > 0).sort((a, b) => b.predicted_qty - a.predicted_qty),
    [result],
  );
  const activeIngredient = ingredient && topIngredients.some((row) => row.ingredient === ingredient) ? ingredient : topIngredients[0]?.ingredient;

  const series = useMemo(() => (result?.days || []).map((day) => ({
    day,
    row: day.forecasts.find((item) => item.ingredient === activeIngredient),
  })).filter((item) => item.row), [result, activeIngredient]);
  const axisMax = Math.max(0, ...series.map((item) => item.row.high_qty));
  const unit = series[0]?.row.unit;

  const toggleHoliday = (date) => setHolidays((previous) => (previous.includes(date) ? previous.filter((item) => item !== date) : [...previous, date]));

  const runForecast = async () => {
    setLoading(true);
    setError('');
    try {
      setResult(await fetchWeeklyForecast({
        restaurant_name: restaurant,
        start_date: selectedDate,
        days: DAYS,
        estimated_customers: Math.max(0, Math.round(Number(customers) || 0)),
        weather,
        holidays,
      }));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  const title = 'Weekly outlook · next 7 days with forecast range';
  const subtitle = `Ingredient demand from ${formatDate(dates[0])} to ${formatDate(dates[DAYS - 1])}. The shaded band is the spread of the model’s 100 trees (10th–90th percentile).`;

  if (optionsError) {
    return <Panel title={title} subtitle={subtitle}><Notice tone="warning">The forecasting model is unavailable: {optionsError}</Notice></Panel>;
  }

  if (!options) {
    return <Panel title={title} subtitle={subtitle}><div className="model-loading"><Loader2 size={16} className="spin" /> Loading model options…</div></Panel>;
  }

  return <Panel title={title} subtitle={subtitle} action={<span className="micro-tag"><CalendarRange size={12} /> 7-day view</span>}>
    <div className="model-form">
      <label><span>Restaurant</span>
        <select value={restaurant} onChange={(event) => setRestaurant(event.target.value)}>
          {options.restaurants.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label><span>Weather (all days)</span>
        <select value={weather} onChange={(event) => setWeather(event.target.value)}>
          {options.weather.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label><span>Expected customers / day</span>
        <input type="number" min="0" max="100000" value={customers} onChange={(event) => setCustomers(event.target.value)} />
      </label>
      <button type="button" className="button-primary" onClick={runForecast} disabled={loading || !restaurant}>
        {loading ? <><Loader2 size={15} className="spin" /> Forecasting…</> : 'Forecast week'}
      </button>
    </div>

    <div className="weekly-days" role="group" aria-label="Mark holiday or festival days">
      <span>Mark holidays / festivals:</span>
      {dates.map((date) => <button type="button" key={date} className={`weekly-day-chip${holidays.includes(date) ? ' is-holiday' : ''}`} aria-pressed={holidays.includes(date)} onClick={() => toggleHoliday(date)}>
        {new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
      </button>)}
    </div>

    {error && <Notice tone="warning">{error}</Notice>}

    {result && topIngredients.length > 0 && <>
      <label className="weekly-picker">Ingredient
        <select value={activeIngredient} onChange={(event) => setIngredient(event.target.value)}>
          {topIngredients.map((row) => <option key={row.ingredient} value={row.ingredient}>{row.ingredient}</option>)}
        </select>
      </label>

      <div>
        {series.map(({ day, row }) => <div className="range-row" key={day.date}>
          <div className="range-day"><strong>{shortDay(day.date)}</strong><small>{day.is_holiday ? 'Holiday / festival' : day.day_of_week}</small></div>
          <div className="range-track" role="img" aria-label={`${activeIngredient} ${amount(row.predicted_qty)} ${unitLabel(unit)}, range ${amount(row.low_qty)} to ${amount(row.high_qty)}`}>
            <div className="range-span" style={{ left: `${axisMax ? (row.low_qty / axisMax) * 100 : 0}%`, width: `${axisMax ? ((row.high_qty - row.low_qty) / axisMax) * 100 : 0}%` }} />
            <div className="range-mark" style={{ left: `${axisMax ? (row.predicted_qty / axisMax) * 100 : 0}%` }} />
          </div>
          <div className="range-value"><strong>{amount(row.predicted_qty)}</strong> {unitLabel(unit)} <span className="muted">({amount(row.low_qty)}–{amount(row.high_qty)})</span></div>
        </div>)}
      </div>

      <div className="table-wrap weekly-totals">
        <table>
          <thead><tr><th>Ingredient (week total)</th><th>Expected</th><th>Range</th><th>Plan up to</th></tr></thead>
          <tbody>
            {topIngredients.slice(0, 8).map((row) => <tr key={row.ingredient}>
              <td><div className="table-primary">{row.ingredient}</div></td>
              <td><strong>{amount(row.predicted_qty)}</strong> <span className="muted">{unitLabel(row.unit)}</span></td>
              <td><span className="muted">{amount(row.low_qty)} – {amount(row.high_qty)} {unitLabel(row.unit)}</span></td>
              <td><StatusBadge tone="green">{amount(row.high_qty)} {unitLabel(row.unit)}</StatusBadge></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </>}

    <div className="chart-footnote">Future days have no recent-use history, so the model fills typical values. The range shows how much the trees disagree, not a guarantee. {options.metrics?.warning}</div>
  </Panel>;
}
