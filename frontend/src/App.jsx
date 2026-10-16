import React, { useEffect, useState } from 'react';
import { Activity, Bell, CalendarDays, ChefHat, CircleDollarSign, ClipboardCheck, Leaf, LayoutDashboard, ShieldAlert, ShoppingBag, Sprout, Utensils, Wallet } from 'lucide-react';
import DemandForecastPage from './pages/DemandForecastPage.jsx';
import InventoryRiskPage from './pages/InventoryRiskPage.jsx';
import SurplusBiddingPage from './pages/SurplusBiddingPage.jsx';
import { initialDishes, initialWasteRecords, isoDaysFromNow } from './data/mockData.js';
import { fetchHealth } from './services/api.js';

const navigation = [
  { id: 'forecast', label: 'Demand forecasting', detail: 'Prepare the right quantity', icon: ChefHat, number: '01' },
  { id: 'inventory', label: 'Inventory & waste risk', detail: 'Protect stock value', icon: ShieldAlert, number: '02' },
  { id: 'surplus', label: 'Surplus bidding', detail: 'Recover value from surplus', icon: ShoppingBag, number: '03' },
];

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('forecast');
  const initialForecastDate = isoDaysFromNow(1);
  const [selectedDate, setSelectedDate] = useState(initialForecastDate);
  const [prepQuantities, setPrepQuantities] = useState(() => {
    const date = new Date(`${initialForecastDate}T12:00:00`);
    const day = date.getDay();
    const multiplier = day === 0 || day === 6 ? 1.12 : day === 5 ? 1.06 : day === 1 ? 0.94 : 1;
    return Object.fromEntries(initialDishes.map((dish) => [dish.id, Math.ceil(dish.predicted * multiplier * (1 + dish.safetyPercent / 100))]));
  });
  const [wasteRecords, setWasteRecords] = useState(initialWasteRecords);
  const activeSection = navigation.find((item) => item.id === activeTab) || navigation[0];
  const ActiveIcon = activeSection.icon;

  useEffect(() => {
    let isCurrent = true;

    fetchHealth()
      .then(() => {
        if (isCurrent) setBackendStatus('connected');
      })
      .catch(() => {
        if (isCurrent) setBackendStatus('disconnected');
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const backendStatusLabel = {
    checking: 'Checking backend',
    connected: 'Backend connected',
    disconnected: 'Backend disconnected',
  }[backendStatus];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup"><div className="brand-mark"><Sprout size={22} strokeWidth={2} /></div><div><strong>Root &amp; Reuse</strong><span>Restaurant intelligence</span></div></div>
      <div className="workspace-switch"><span className="workspace-logo">GR</span><div><small>WORKSPACE</small><strong>Green Room Bistro</strong></div><span className="workspace-chevron">⌄</span></div>
      <div className="nav-label">RESEARCH COMPONENTS</div>
      <nav className="main-navigation" aria-label="Main components">
        {navigation.map((item) => {
          const Icon = item.icon;
          return <button type="button" key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)} aria-current={activeTab === item.id ? 'page' : undefined}>
            <span className="nav-icon"><Icon size={19} strokeWidth={1.8} /></span><span className="nav-copy"><strong>{item.label}</strong><small>{item.detail}</small></span><span className="nav-number">{item.number}</span>
          </button>;
        })}
      </nav>
      <div className="sidebar-spacer" />
      <div className="prevention-card"><div className="prevention-icon"><Leaf size={18} /></div><strong>Prevent first. Recover second.</strong><p>Forecast demand, protect stock, and recover value from unavoidable surplus.</p><div className="prevention-flow"><span>Prevent</span><i>→</i><span>Detect</span><i>→</i><span>Recover</span></div></div>
      <div className="sidebar-footer"><span className="avatar-small">J26</span><div><strong>Final-year research</strong><small>Frontend prototype · v1.0</small></div><span className="status-dot" title="Demo ready" /></div>
    </aside>

    <main className="main-shell">
      <header className="topbar">
        <div className="breadcrumb"><LayoutDashboard size={15} /><span>Workspace</span><span className="crumb-divider">/</span><strong>{activeSection.label}</strong></div>
        <div className="topbar-right"><span className={`backend-status ${backendStatus}`} role="status"><span className="backend-status-dot" /> {backendStatusLabel}</span><span className="demo-chip"><span className="demo-chip-dot" /> DEMO DATA</span><button className="icon-button" type="button" title="Demo alerts are shown in the selected component" onClick={() => setActiveTab('inventory')}><Bell size={18} /><span className="notification-dot" /></button><div className="profile-summary"><span className="profile-avatar">GM</span><div><strong>General Manager</strong><small>Restaurant admin</small></div></div></div>
      </header>

      <div className="content-area">
        <div className="welcome-strip"><div><div className="welcome-eyebrow"><span className="welcome-icon"><ActiveIcon size={15} /></span> PROACTIVE FOOD WASTE PREVENTION</div><h2>Good afternoon, Manager <span>✦</span></h2><p>Make clearer kitchen decisions with a connected view of demand, inventory risk, and surplus recovery.</p></div><div className="welcome-date"><CalendarDays size={16} /><div><span>DEMO DATE</span><strong>{new Date().toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div></div></div>

        <div className={activeTab === 'forecast' ? 'page-visible' : 'page-hidden'}><DemandForecastPage selectedDate={selectedDate} setSelectedDate={setSelectedDate} prepQuantities={prepQuantities} setPrepQuantities={setPrepQuantities} /></div>
        <div className={activeTab === 'inventory' ? 'page-visible' : 'page-hidden'}><InventoryRiskPage wasteRecords={wasteRecords} setWasteRecords={setWasteRecords} /></div>
        <div className={activeTab === 'surplus' ? 'page-visible' : 'page-hidden'}><SurplusBiddingPage isActive={activeTab === 'surplus'} /></div>
      </div>
      <footer className="app-footer"><span>Root &amp; Reuse · Research prototype</span><span><i /> Frontend simulation only</span><span>J26 · IT · 461</span></footer>
    </main>
  </div>;
}
