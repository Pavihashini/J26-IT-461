import React, { useEffect, useState } from 'react';
import { Bell, ChefHat, Leaf, LayoutDashboard, Loader2, LogOut, ShieldAlert, ShoppingBag, Sprout } from 'lucide-react';
import DemandForecastPage from './pages/DemandForecastPage.jsx';
import InventoryRiskPage from './pages/InventoryRiskPage.jsx';
import SurplusBiddingPage from './pages/SurplusBiddingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import WelcomeBanner from './components/WelcomeBanner.jsx';
import { initialDishes, initialWasteRecords, isoDaysFromNow } from './data/mockData.js';
import { fetchCurrentUser, fetchHealth, getStoredToken, setSessionToken } from './services/api.js';

const navigation = [
  { id: 'forecast', label: 'Demand forecasting', detail: 'Prepare the right quantity', icon: ChefHat, number: '01', roles: ['admin'] },
  { id: 'inventory', label: 'Inventory & waste risk', detail: 'Protect stock value', icon: ShieldAlert, number: '02', roles: ['admin'] },
  { id: 'surplus', label: 'Surplus bidding', detail: 'Recover value from surplus', icon: ShoppingBag, number: '03', roles: ['user'] },
];

function Dashboard({ user, onLogout }) {
  const allowedNavigation = navigation.filter((item) => item.roles.includes(user.role));
  const [backendStatus, setBackendStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState(allowedNavigation[0]?.id);
  const initialForecastDate = isoDaysFromNow(1);
  const [selectedDate, setSelectedDate] = useState(initialForecastDate);
  const [prepQuantities, setPrepQuantities] = useState(() => {
    const date = new Date(`${initialForecastDate}T12:00:00`);
    const day = date.getDay();
    const multiplier = day === 0 || day === 6 ? 1.12 : day === 5 ? 1.06 : day === 1 ? 0.94 : 1;
    return Object.fromEntries(initialDishes.map((dish) => [dish.id, Math.ceil(dish.predicted * multiplier * (1 + dish.safetyPercent / 100))]));
  });
  const [wasteRecords, setWasteRecords] = useState(initialWasteRecords);
  const activeSection = allowedNavigation.find((item) => item.id === activeTab) || allowedNavigation[0];

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
        {allowedNavigation.map((item) => {
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
        <div className="topbar-right"><span className={`backend-status ${backendStatus}`} role="status"><span className="backend-status-dot" /> {backendStatusLabel}</span><span className="demo-chip"><span className="demo-chip-dot" /> DEMO DATA</span>{user.role === 'admin' && <button className="icon-button" type="button" title="Demo alerts are shown in the selected component" onClick={() => setActiveTab('inventory')}><Bell size={18} /><span className="notification-dot" /></button>}<div className="profile-summary"><span className="profile-avatar">{initials(user.full_name)}</span><div><strong>{user.full_name}</strong><small>{user.role === 'admin' ? 'Restaurant admin' : 'Registered user'}</small></div><button className="icon-button" type="button" title="Log out" aria-label="Log out" onClick={onLogout}><LogOut size={17} /></button></div></div>
      </header>

      <div className="content-area">
        <WelcomeBanner user={user} section={activeSection} />

        {user.role === 'admin' && <>
          <div className={activeTab === 'forecast' ? 'page-visible' : 'page-hidden'}><DemandForecastPage selectedDate={selectedDate} setSelectedDate={setSelectedDate} prepQuantities={prepQuantities} setPrepQuantities={setPrepQuantities} /></div>
          <div className={activeTab === 'inventory' ? 'page-visible' : 'page-hidden'}><InventoryRiskPage wasteRecords={wasteRecords} setWasteRecords={setWasteRecords} selectedDate={selectedDate} /></div>
        </>}
        {user.role === 'user' && <div className="page-visible"><SurplusBiddingPage isActive /></div>}
      </div>
      <footer className="app-footer"><span>Root &amp; Reuse · Research prototype</span><span><i /> Frontend simulation only</span><span>J26 · IT · 461</span></footer>
    </main>
  </div>;
}

const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U';

export default function App() {
  const [session, setSession] = useState({ status: getStoredToken() ? 'checking' : 'signed-out', user: null });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return undefined;
    let isCurrent = true;
    setSessionToken(token);
    fetchCurrentUser()
      .then((user) => {
        if (isCurrent) setSession({ status: 'signed-in', user });
      })
      .catch(() => {
        setSessionToken(null);
        if (isCurrent) setSession({ status: 'signed-out', user: null });
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const signOut = (message = '') => {
    setSessionToken(null);
    setNotice(message);
    setSession({ status: 'signed-out', user: null });
  };

  useEffect(() => {
    const handleExpired = () => signOut('Your session has expired. Please log in again.');
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  if (session.status === 'checking') {
    return <div className="auth-shell"><div className="model-loading"><Loader2 size={18} className="spin" /> Loading…</div></div>;
  }

  if (session.status === 'signed-out') {
    return <AuthPage notice={notice} onAuthenticated={({ access_token: token, user }) => {
      setSessionToken(token);
      setNotice('');
      setSession({ status: 'signed-in', user });
    }} />;
  }

  return <Dashboard key={session.user.id} user={session.user} onLogout={() => signOut()} />;
}
