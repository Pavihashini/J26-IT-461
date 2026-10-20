import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, CheckCircle2, CircleDollarSign, ClipboardList, Coins, Info, Leaf, Package, ShieldAlert, ShoppingCart, TrendingDown, Wallet } from 'lucide-react';
import { ingredientCatalog } from '../data/mockData.js';
import { dayDifference, formatDate, formatLKR, sumBy } from '../utils.js';
import StockPlannerPanel from '../components/StockPlannerPanel.jsx';
import { Notice, PageHeading, Panel, StatCard, StatusBadge } from '../components/Shared.jsx';

const riskTone = (risk) => risk === 'High' ? 'red' : risk === 'Medium' ? 'orange' : 'green';
const periodOptions = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: '7 days' },
  { id: 'month', label: '30 days' },
];

function costFor(record) {
  return Math.max(0, Number(record.quantity) || 0) * Math.max(0, Number(record.unitCost) || 0);
}

function filterRecords(records, period) {
  return records.filter((record) => {
    const daysAgo = -dayDifference(record.date);
    if (period === 'day') return daysAgo === 0;
    if (period === 'week') return daysAgo >= 0 && daysAgo < 7;
    return daysAgo >= 0 && daysAgo < 30;
  });
}

function BarLine({ label, value, max, valueLabel, subLabel }) {
  const width = max > 0 ? Math.max(value > 0 ? 2 : 0, (value / max) * 100) : 0;
  return <div className="horizontal-bar-row">
    <div className="horizontal-bar-label"><strong>{label}</strong>{subLabel && <span>{subLabel}</span>}</div>
    <div className="horizontal-bar-track"><div className="horizontal-bar-fill" style={{ width: `${width}%` }} /></div>
    <div className="horizontal-bar-value">{valueLabel}</div>
  </div>;
}

function RiskOverview({ onOpenFinancials }) {
  const [selectedId, setSelectedId] = useState('chicken');
  const selected = ingredientCatalog.find((item) => item.id === selectedId) || ingredientCatalog[0];
  const highCount = ingredientCatalog.filter((item) => item.risk === 'High').length;
  const mediumCount = ingredientCatalog.filter((item) => item.risk === 'Medium').length;
  const understockCount = ingredientCatalog.filter((item) => item.status.toLowerCase().includes('understock')).length;
  const alertRows = useMemo(() => {
    const rows = [];
    ingredientCatalog.forEach((item) => {
      if (item.expiryInDays <= 3) rows.push({ id: `${item.id}-expiry`, item, type: 'Near expiry', message: `Expiry in ${item.expiryInDays} day${item.expiryInDays === 1 ? '' : 's'}; compare stock with expected use.`, tone: 'orange' });
      if (item.riskScore >= 70) rows.push({ id: `${item.id}-risk`, item, type: 'High waste risk', message: item.riskScore >= 85 ? 'Stock, shelf life, and historical waste signals combine to elevate risk.' : 'Expiry and projected usage suggest preventable waste exposure.', tone: 'red' });
      if (item.stock > item.expectedUsageBeforeExpiry * 1.25 && item.expiryInDays <= 14) rows.push({ id: `${item.id}-overstock`, item, type: 'Overstock', message: `${item.stock} ${item.unit} on hand vs. ${item.expectedUsageBeforeExpiry} ${item.unit} expected use before expiry.`, tone: 'orange' });
      if (item.stock < item.expectedUsage) rows.push({ id: `${item.id}-understock`, item, type: 'Understock', message: `Forecast usage (${item.expectedUsage} ${item.unit}) exceeds stock (${item.stock} ${item.unit}).`, tone: 'blue' });
    });
    return rows;
  }, []);
  const riskExposure = ingredientCatalog.reduce((sum, item) => {
    const quantityAtRisk = item.expiryInDays <= 7 ? Math.max(0, item.stock - item.expectedUsageBeforeExpiry) : 0;
    return sum + quantityAtRisk * item.costPerUnit;
  }, 0);

  return <div className="page-stack">
    <div className="subnav-row">
      <div className="subnav-title"><span className="subnav-icon"><ShieldAlert size={17} /></span><div><strong>Inventory risk overview</strong><span>Stock · expiry · demand · historical waste</span></div></div>
      <button className="button-secondary" type="button" onClick={onOpenFinancials}><CircleDollarSign size={16} /> Open cost &amp; savings <ArrowUpRight size={15} /></button>
    </div>

    <div className="stats-grid four">
      <StatCard label="High-risk ingredients" value={highCount} detail="Require preventive action" icon={AlertTriangle} tone="red" />
      <StatCard label="Medium risk" value={mediumCount} detail="Monitor stock and usage" icon={CalendarClock} tone="orange" />
      <StatCard label="Understock alerts" value={understockCount} detail="May affect forecast demand" icon={ShoppingCart} tone="blue" />
      <StatCard label="Inventory value at risk" value={formatLKR(riskExposure, { compact: true })} detail="Estimated near-expiry stock exposure" icon={Wallet} tone="purple" />
    </div>

    <Panel className="process-panel" title="Waste-risk detection flow" subtitle="As proposed in the presentation, expiry risk is evaluated alongside demand and waste history.">
      <div className="formula-flow">
        <span><Package size={15} /> Stock level</span><b>+</b><span><CalendarClock size={15} /> Expiry date</span><b>+</b><span><ClipboardList size={15} /> Predicted demand</span><b>+</b><span><TrendingDown size={15} /> Historical waste</span><b>→</b><span className="formula-result"><ShieldAlert size={15} /> Risk score &amp; action</span>
      </div>
    </Panel>

    <Panel title="Ingredient inventory" subtitle="Select an ingredient to see the factors behind its simulated risk score." action={<span className="micro-tag">Illustrative scores · 0–100</span>}>
      <div className="table-wrap">
        <table className="inventory-table">
          <thead><tr><th>Ingredient</th><th>Current stock</th><th>Expiry</th><th>Expected use / 7d</th><th>Waste risk</th><th>Status</th></tr></thead>
          <tbody>{ingredientCatalog.map((item) => (
            <tr className={selectedId === item.id ? 'selected-row' : ''} key={item.id} onClick={() => setSelectedId(item.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedId(item.id); }}>
              <td><div className="table-primary">{item.name}</div><div className="table-secondary">Unit cost {formatLKR(item.costPerUnit)} / {item.unit}</div></td>
              <td><strong>{item.stock}</strong> <span className="muted">{item.unit}</span></td>
              <td><div className="table-primary">{item.expiryInDays === 0 ? 'Today' : `${item.expiryInDays} days`}</div><div className="table-secondary">Remaining shelf life</div></td>
              <td>{item.expectedUsage} <span className="muted">{item.unit}</span></td>
              <td><div className="risk-cell"><strong>{item.riskScore}</strong><div className="risk-meter"><span className={riskTone(item.risk)} style={{ width: `${item.riskScore}%` }} /></div><StatusBadge tone={riskTone(item.risk)}>{item.risk}</StatusBadge></div></td>
              <td><StatusBadge tone={item.status.toLowerCase().includes('understock') ? 'blue' : item.risk === 'High' ? 'red' : item.risk === 'Medium' ? 'orange' : 'green'}>{item.status}</StatusBadge></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Panel>

    <div className="two-column-grid">
      <Panel title={`${selected.name}: risk explanation`} subtitle="Why this item received its current classification.">
        <div className="selected-risk-score"><div className={`big-score ${riskTone(selected.risk)}`}>{selected.riskScore}<small>/100</small></div><div><StatusBadge tone={riskTone(selected.risk)}>{selected.risk} waste risk</StatusBadge><p>Simulated, rule-informed demonstration score — not a trained model output.</p></div></div>
        <div className="factor-list">{selected.factors.map((factor, index) => <div className="factor-item" key={factor}><span>{String(index + 1).padStart(2, '0')}</span>{factor}</div>)}</div>
        <div className="risk-data-strip"><div><span>Current stock</span><strong>{selected.stock} {selected.unit}</strong></div><div><span>Expected usage</span><strong>{selected.expectedUsage} {selected.unit}</strong></div><div><span>Days to expiry</span><strong>{selected.expiryInDays} days</strong></div></div>
      </Panel>
      <Panel title="Preventive recommendations" subtitle="Actions are derived from the displayed mock inventory conditions.">
        <div className="recommendation-list">
          <div className="recommendation-item"><span className="recommendation-icon red"><CalendarClock size={17} /></span><div><strong>{selected.expiryInDays <= 3 ? `Prioritise ${selected.name}` : `Plan usage for ${selected.name}`}</strong><p>{selected.recommendation}</p></div></div>
          <div className="recommendation-item"><span className="recommendation-icon orange"><ShoppingCart size={17} /></span><div><strong>Align purchasing with demand</strong><p>Review current stock against the forecast before placing the next order.</p></div></div>
          <div className="recommendation-item"><span className="recommendation-icon green"><CheckCircle2 size={17} /></span><div><strong>Apply FEFO rotation</strong><p>Use first-expiring stock first and monitor repeated waste in the historical records.</p></div></div>
        </div>
      </Panel>
    </div>

    <Panel title="Generated inventory alerts" subtitle={`${alertRows.length} demonstration alerts across the current inventory records.`}>
      <div className="alert-list">
        {alertRows.map((alert) => <button className="alert-row" key={alert.id} type="button" onClick={() => setSelectedId(alert.item.id)}>
          <span className={`alert-icon ${alert.tone}`}><AlertTriangle size={17} /></span>
          <span className="alert-content"><strong>{alert.type}: {alert.item.name}</strong><small>{alert.message}</small></span>
          <StatusBadge tone={alert.tone}>{alert.type}</StatusBadge>
          <ArrowUpRight size={15} className="alert-arrow" />
        </button>)}
      </div>
    </Panel>
    <Notice>Stock, expiry, demand, and waste-history values are mock records. Risk scores and recommendations are explanatory prototype logic; the presentation describes a future rules + ML hybrid engine with SHAP/LIME explanations.</Notice>
  </div>;
}

function FinancialAnalysis({ wasteRecords, setWasteRecords }) {
  const [period, setPeriod] = useState('month');
  const [reductionPercent, setReductionPercent] = useState(20);
  const filtered = useMemo(() => filterRecords(wasteRecords, period), [wasteRecords, period]);
  const totalCost = useMemo(() => sumBy(filtered, costFor), [filtered]);
  const potentialSavings = totalCost * (Number(reductionPercent) / 100);
  const qtyWasted = sumBy(filtered, (record) => Number(record.quantity) || 0);
  const avgRecordCost = filtered.length ? totalCost / filtered.length : 0;

  const byCategory = useMemo(() => {
    const totals = new Map();
    filtered.forEach((record) => totals.set(record.category, (totals.get(record.category) || 0) + costFor(record)));
    return [...totals.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const byIngredient = useMemo(() => {
    const totals = new Map();
    filtered.forEach((record) => {
      const existing = totals.get(record.item) || { label: record.item, value: 0, records: 0, itemIds: new Set() };
      existing.value += costFor(record);
      existing.records += 1;
      existing.itemIds.add(record.itemId);
      totals.set(record.item, existing);
    });
    return [...totals.values()].map((item) => ({ ...item, itemIds: [...item.itemIds] })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const trend = useMemo(() => {
    const grouped = new Map();
    filtered.forEach((record) => grouped.set(record.date, (grouped.get(record.date) || 0) + costFor(record)));
    return [...grouped.entries()].sort(([dateA], [dateB]) => dateA.localeCompare(dateB)).map(([date, value]) => ({ date, value }));
  }, [filtered]);

  const inventoryRisk = useMemo(() => ingredientCatalog.map((item) => {
    const atRiskQuantity = item.expiryInDays <= 7 ? Math.max(0, item.stock - item.expectedUsageBeforeExpiry) : 0;
    return { ...item, atRiskQuantity, atRiskValue: atRiskQuantity * item.costPerUnit };
  }).filter((item) => item.atRiskValue > 0).sort((a, b) => b.atRiskValue - a.atRiskValue), []);
  const inventoryRiskTotal = sumBy(inventoryRisk, (item) => item.atRiskValue);

  const priorities = useMemo(() => ingredientCatalog.map((item) => {
    const recordedLoss = sumBy(filtered.filter((record) => record.itemId === item.id), costFor);
    const atRiskQuantity = item.expiryInDays <= 7 ? Math.max(0, item.stock - item.expectedUsageBeforeExpiry) : 0;
    const atRiskValue = atRiskQuantity * item.costPerUnit;
    return { item, recordedLoss, atRiskValue, rankScore: recordedLoss + atRiskValue };
  }).filter((entry) => entry.rankScore > 0).sort((a, b) => b.rankScore - a.rankScore).slice(0, 4), [filtered]);

  const updateRecord = (id, key, value) => {
    const num = value === '' ? '' : Math.max(0, Number(value) || 0);
    setWasteRecords((records) => records.map((record) => record.id === id ? { ...record, [key]: num } : record));
  };
  const maxCategory = Math.max(1, ...byCategory.map((row) => row.value));
  const maxIngredient = Math.max(1, ...byIngredient.map((row) => row.value));
  const maxTrend = Math.max(1, ...trend.map((row) => row.value));
  const periodLabel = period === 'day' ? 'today' : period === 'week' ? 'the last 7 days' : 'the last 30 days';

  return <div className="page-stack">
    <div className="subnav-row">
      <div className="subnav-title"><span className="subnav-icon finance"><CircleDollarSign size={17} /></span><div><strong>AI cost &amp; savings calculator</strong><span>Financial view inside Component 2</span></div></div>
      <div className="segmented-control" role="group" aria-label="Reporting period">{periodOptions.map((option) => <button key={option.id} className={period === option.id ? 'active' : ''} type="button" onClick={() => setPeriod(option.id)}>{option.label}</button>)}</div>
    </div>

    <div className="stats-grid four finance-stats">
      <StatCard label="Recorded waste cost" value={formatLKR(totalCost, { compact: true })} detail={`Calculated from ${filtered.length} records · ${periodLabel}`} icon={CircleDollarSign} tone="red" />
      <StatCard label="Estimated potential savings" value={formatLKR(potentialSavings, { compact: true })} detail={`${reductionPercent}% illustrative reduction assumption`} icon={Coins} tone="green" />
      <StatCard label="Inventory value at risk" value={formatLKR(inventoryRiskTotal, { compact: true })} detail="Separate from waste already recorded" icon={ShieldAlert} tone="orange" />
      <StatCard label="Waste records" value={filtered.length} detail={`${qtyWasted.toLocaleString('en-LK', { maximumFractionDigits: 2 })} total units / quantities`} icon={ClipboardList} tone="blue" />
    </div>

    <Notice tone="warning">Recorded waste cost is based only on waste logs in the selected period. Inventory value at risk is a separate exposure estimate, and potential savings are hypothetical—not guaranteed or observed savings.</Notice>

    <div className="two-column-grid finance-chart-grid">
      <Panel title="Highest-cost wasted items" subtitle="Ranked by calculated loss: quantity wasted × purchase cost per unit.">
        {byIngredient.length ? <div className="horizontal-bar-chart">{byIngredient.slice(0, 5).map((row) => <BarLine key={row.label} label={row.label} value={row.value} max={maxIngredient} valueLabel={formatLKR(row.value)} subLabel={`${row.records} record${row.records === 1 ? '' : 's'}`} />)}</div> : <div className="empty-chart">No recorded waste for this period.</div>}
      </Panel>
      <Panel title="Loss by waste category" subtitle="Shows the recorded financial contribution of each reason.">
        {byCategory.length ? <div className="category-bars">{byCategory.map((row, index) => <div className="category-row" key={row.label}><div className="category-head"><span><i className={`category-dot c-${index % 4}`} />{row.label}</span><strong>{formatLKR(row.value)}</strong></div><div className="category-track"><span className={`category-fill c-${index % 4}`} style={{ width: `${(row.value / maxCategory) * 100}%` }} /></div><small>{totalCost ? `${((row.value / totalCost) * 100).toFixed(1)}% of selected-period waste cost` : '0% of selected-period waste cost'}</small></div>)}</div> : <div className="empty-chart">No category costs to display.</div>}
      </Panel>
    </div>

    <Panel title="Waste-cost trend" subtitle={`Daily recorded waste cost during ${periodLabel}.`}>
      {trend.length ? <div className="trend-chart" aria-label="Recorded waste cost by date">
        {trend.map((point) => <div className="trend-column" key={point.date} title={`${formatDate(point.date)}: ${formatLKR(point.value)}`}><div className="trend-bar-wrap"><div className="trend-bar" style={{ height: `${Math.max(5, (point.value / maxTrend) * 100)}%` }} /></div><strong>{formatLKR(point.value, { compact: true })}</strong><span>{new Date(`${point.date}T00:00:00`).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' })}</span></div>)}
      </div> : <div className="empty-chart">No trend data in this reporting window.</div>}
    </Panel>

    <div className="two-column-grid saving-grid">
      <Panel title="Estimated savings scenario" subtitle="Adjust the assumed reduction rate to explore a prevention scenario.">
        <div className="savings-result"><div><span>Estimated potential savings</span><strong>{formatLKR(potentialSavings)}</strong><small>Based on {formatLKR(totalCost)} recorded waste cost</small></div><div className="savings-ring" style={{ '--percentage': `${reductionPercent * 3.6}deg` }}><span>{reductionPercent}%</span></div></div>
        <label className="range-label"><span>Assumed waste reduction</span><strong>{reductionPercent}%</strong></label>
        <input className="savings-range" type="range" min="0" max="50" step="5" value={reductionPercent} onChange={(event) => setReductionPercent(Number(event.target.value))} />
        <div className="range-scale"><span>0%</span><span>25%</span><span>50%</span></div>
        <p className="helper-copy">This is a configurable what-if assumption, not a validated AI prediction. If no waste is recorded in the selected period, estimated savings remain Rs. 0.</p>
      </Panel>
      <Panel title="Observed savings comparison" subtitle="Actual savings require comparable before-and-after intervention records.">
        <div className="observed-empty"><span className="observed-icon"><Info size={21} /></span><strong>Not available in this demo dataset</strong><p>No adjusted baseline and post-intervention comparison records are provided, so observed savings cannot be calculated honestly.</p><div className="formula-chip">Adjusted baseline cost − post-intervention cost</div></div>
      </Panel>
    </div>

    <Panel title="Inventory value at risk" subtitle="Purchase value of estimated stock that may remain unused before near-term expiry. Not counted as waste cost unless later recorded as waste.">
      <div className="risk-value-list">
        {inventoryRisk.map((item) => <div className="risk-value-row" key={item.id}><div className="risk-value-name"><span className={`risk-value-icon ${item.risk === 'High' ? 'high' : 'medium'}`}><Package size={16} /></span><div><strong>{item.name}</strong><small>{item.atRiskQuantity} {item.unit} estimated at risk · expiry in {item.expiryInDays} days</small></div></div><StatusBadge tone={item.risk === 'High' ? 'red' : 'orange'}>{item.risk} risk</StatusBadge><strong className="risk-value-amount">{formatLKR(item.atRiskValue)}</strong></div>)}
      </div>
      <div className="risk-total-row"><span>Total estimated inventory exposure</span><strong>{formatLKR(inventoryRiskTotal)}</strong></div>
    </Panel>

    <Panel title="Prioritised prevention opportunities" subtitle="Priority combines recorded waste cost in the selected period and separate near-expiry inventory exposure.">
      {priorities.length ? <div className="priority-list">{priorities.map(({ item, recordedLoss, atRiskValue }, index) => <div className="priority-row" key={item.id}><span className="priority-rank">{index + 1}</span><div className="priority-main"><strong>{item.name}</strong><p>{recordedLoss > 0 ? `Recorded loss: ${formatLKR(recordedLoss)}. ` : 'No recorded waste cost in this period. '}{atRiskValue > 0 ? `Additional inventory exposure: ${formatLKR(atRiskValue)}. ` : ''}{item.recommendation}</p></div><div className="priority-values"><span>Waste cost <strong>{formatLKR(recordedLoss)}</strong></span><span>At risk <strong>{formatLKR(atRiskValue)}</strong></span></div></div>)}</div> : <div className="empty-chart">No financial priorities in this reporting period.</div>}
    </Panel>

    <Panel title="Waste records & calculated costs" subtitle="Demo records are editable. Changing quantity or unit purchase cost recalculates the cost and dashboard totals instantly." action={<span className="micro-tag">No duplicate record IDs</span>}>
      {filtered.length ? <div className="table-wrap"><table className="waste-table">
        <thead><tr><th>Item &amp; date</th><th>Quantity wasted</th><th>Unit</th><th>Unit purchase cost</th><th>Reason</th><th>Calculated loss</th></tr></thead>
        <tbody>{filtered.map((record) => <tr key={record.id}>
          <td><div className="table-primary">{record.item}</div><div className="table-secondary">{record.id} · {formatDate(record.date)}</div></td>
          <td><input className="table-number-input" type="number" min="0" step="0.1" aria-label={`Quantity wasted for ${record.item}`} value={record.quantity} onChange={(event) => updateRecord(record.id, 'quantity', event.target.value)} /></td>
          <td>{record.unit}</td>
          <td><label className="unit-cost-input"><span>Rs.</span><input type="number" min="0" step="1" aria-label={`Unit purchase cost for ${record.item}`} value={record.unitCost} onChange={(event) => updateRecord(record.id, 'unitCost', event.target.value)} /></label></td>
          <td><StatusBadge tone={record.category === 'Expired stock' ? 'red' : record.category === 'Spoilage' ? 'orange' : 'neutral'}>{record.category}</StatusBadge></td>
          <td><strong>{formatLKR(costFor(record))}</strong></td>
        </tr>)}</tbody>
        <tfoot><tr><td colSpan="5">Total recorded waste cost ({periodLabel})</td><td><strong>{formatLKR(totalCost)}</strong></td></tr></tfoot>
      </table></div> : <div className="empty-chart">No waste records exist for this reporting period. Recorded cost and estimated savings are Rs. 0.</div>}
    </Panel>

    <Notice>AI-assisted priorities in this prototype are transparent, rule-based examples. The final system could combine risk outputs and financial history, but this interface does not run an AI model or establish causal savings.</Notice>
  </div>;
}

export default function InventoryRiskPage({ wasteRecords, setWasteRecords, selectedDate }) {
  const [section, setSection] = useState('risk');
  return <div className="page-stack inventory-theme">
    <PageHeading
      eyebrow="Component 02 · Detect risk before food is lost"
      title="Inventory & waste risk"
      description="Connect stock levels and expiry dates with forecast usage and historical waste. Use the same inventory context to understand recorded losses and possible savings."
      actions={<div className="section-switch"><button type="button" className={section === 'risk' ? 'active' : ''} onClick={() => setSection('risk')}><ShieldAlert size={15} /> Risk overview</button><button type="button" className={section === 'finance' ? 'active' : ''} onClick={() => setSection('finance')}><CircleDollarSign size={15} /> Cost &amp; savings</button></div>}
    />
    {section === 'risk' && <StockPlannerPanel selectedDate={selectedDate} />}
    {section === 'risk' ? <RiskOverview onOpenFinancials={() => setSection('finance')} /> : <FinancialAnalysis wasteRecords={wasteRecords} setWasteRecords={setWasteRecords} />}
  </div>;
}
