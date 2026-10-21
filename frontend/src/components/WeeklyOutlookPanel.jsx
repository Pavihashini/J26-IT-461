import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Flame, Loader2, Target, TrendingUp } from 'lucide-react';
import { fetchForecastOptions, fetchWeeklyForecast } from '../services/api.js';
import { formatDate } from '../utils.js';
import { Notice, Panel, StatusBadge } from './Shared.jsx';

const DAYS = 7;
const AXIS_TICKS = 4;
const unitLabel = (unit) => (unit === 'loaf_450g' ? 'loaf (450 g)' : unit);
const amount = (value) => Number(value).toLocaleString('en-LK', { maximumFractionDigits: 2 });
const longDay = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

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

// Smallest "round" axis maximum (1, 2, 2.5, 5 × 10ⁿ per tick) that still covers the data.
function niceAxisMax(value) {
  if (value <= 0) return 1;
  const rawStep = value / AXIS_TICKS;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rawStep);
  return step * AXIS_TICKS;
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
  const activeTotal = topIngredients.find((row) => row.ingredient === activeIngredient);

  const series = useMemo(() => (result?.days || []).map((day) => ({
    day,
    row: day.forecasts.find((item) => item.ingredient === activeIngredient),
  })).filter((item) => item.row), [result, activeIngredient]);

  const unit = series[0]?.row.unit;
  const axisMax = niceAxisMax(Math.max(0, ...series.map((item) => item.row.high_qty)));
  const percent = (value) => `${(value / axisMax) * 100}%`;
  const peak = series.reduce((best, item) => (!best || item.row.predicted_qty > best.row.predicted_qty ? item : best), null);
  const widest = series.reduce((best, item) => (!best || item.row.high_qty - item.row.low_qty > best.row.high_qty - best.row.low_qty ? item : best), null);

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

  const ticks = Array.from({ length: AXIS_TICKS + 1 }, (_, index) => (axisMax / AXIS_TICKS) * index);

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
      <span>Mark holidays / festivals</span>
      {dates.map((date) => <button type="button" key={date} className={`weekly-day-chip${holidays.includes(date) ? ' is-holiday' : ''}`} aria-pressed={holidays.includes(date)} onClick={() => toggleHoliday(date)}>
        {new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
      </button>)}
    </div>

    {error && <Notice tone="warning">{error}</Notice>}

    {result && topIngredients.length > 0 && activeTotal && peak && widest && <>
      <div className="weekly-toolbar">
        <label className="weekly-picker">Ingredient
          <select value={activeIngredient} onChange={(event) => setIngredient(event.target.value)}>
            {topIngredients.map((row) => <option key={row.ingredient} value={row.ingredient}>{row.ingredient}</option>)}
          </select>
        </label>
        <div className="weekly-legend" aria-hidden="true">
          <span><i className="legend-dot" /> Expected</span>
          <span><i className="legend-band" /> Likely range</span>
        </div>
      </div>

      <div className="weekly-summary">
        <div className="weekly-tile"><span className="weekly-tile-icon"><TrendingUp size={15} /></span><div><small>Week total</small><strong>{amount(activeTotal.predicted_qty)} <em>{unitLabel(unit)}</em></strong><p>{amount(activeTotal.low_qty)} – {amount(activeTotal.high_qty)} likely</p></div></div>
        <div className="weekly-tile"><span className="weekly-tile-icon warm"><Flame size={15} /></span><div><small>Busiest day</small><strong>{longDay(peak.day.date)}</strong><p>{amount(peak.row.predicted_qty)} {unitLabel(unit)} expected</p></div></div>
        <div className="weekly-tile"><span className="weekly-tile-icon blue"><Target size={15} /></span><div><small>Least certain day</small><strong>{longDay(widest.day.date)}</strong><p>±{amount((widest.row.high_qty - widest.row.low_qty) / 2)} {unitLabel(unit)} spread</p></div></div>
      </div>

      <div className="range-chart">
        {series.map(({ day, row }) => {
          const isWeekend = ['Saturday', 'Sunday'].includes(day.day_of_week);
          const classes = ['range-row', day.is_holiday ? 'is-holiday' : isWeekend ? 'is-weekend' : '', day === peak.day ? 'is-peak' : ''].filter(Boolean).join(' ');
          return <div className={classes} key={day.date}>
            <div className="range-day">
              <strong>{longDay(day.date)}</strong>
              <small>{day.is_holiday ? 'Holiday / festival' : day.day_of_week}{day === peak.day && <b className="peak-tag">Peak</b>}</small>
            </div>
            <div className="range-track" role="img" aria-label={`${activeIngredient} ${amount(row.predicted_qty)} ${unitLabel(unit)}, range ${amount(row.low_qty)} to ${amount(row.high_qty)}`}>
              {ticks.slice(1, -1).map((tick) => <i className="range-grid" key={tick} style={{ left: percent(tick) }} />)}
              <div className="range-span" style={{ left: percent(row.low_qty), width: percent(row.high_qty - row.low_qty) }} />
              <div className="range-mark" style={{ left: percent(row.predicted_qty) }} />
            </div>
            <div className="range-value"><strong>{amount(row.predicted_qty)} <em>{unitLabel(unit)}</em></strong><span>{amount(row.low_qty)} – {amount(row.high_qty)}</span></div>
          </div>;
        })}
        <div className="range-row range-axis" aria-hidden="true">
          <div />
          <div className="range-axis-scale">{ticks.map((tick) => <span key={tick} style={{ left: percent(tick) }}>{amount(tick)}</span>)}</div>
          <div className="range-axis-unit">{unitLabel(unit)}</div>
        </div>
      </div>

      <h3 className="weekly-table-title">Week totals · top ingredients</h3>
      <div className="table-wrap weekly-totals">
        <table>
          <thead><tr><th>Ingredient</th><th>Expected</th><th>Likely range</th><th>Plan up to</th></tr></thead>
          <tbody>
            {topIngredients.slice(0, 8).map((row) => <tr key={row.ingredient} className={row.ingredient === activeIngredient ? 'is-active' : ''}>
              <td><button type="button" className="weekly-link" onClick={() => setIngredient(row.ingredient)} title="Show this ingredient in the chart">{row.ingredient}</button></td>
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
