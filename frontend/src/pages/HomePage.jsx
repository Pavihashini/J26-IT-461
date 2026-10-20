import React from 'react';
import { ArrowRight, ChefHat, Leaf, ShieldAlert, ShieldCheck, ShoppingBag, Sprout } from 'lucide-react';

const FEATURES = [
  { icon: ChefHat, tone: 'green', title: 'Demand forecasting', text: 'Predict how many portions each dish will sell, so the kitchen prepares the right quantity.' },
  { icon: ShieldAlert, tone: 'orange', title: 'Inventory & waste risk', text: 'Spot ingredients nearing expiry early and protect stock value before it is lost.' },
  { icon: ShoppingBag, tone: 'blue', title: 'Surplus bidding', text: 'List unavoidable surplus and let customers bid, recovering value instead of binning food.' },
];

const STATS = [
  { value: 'Daily', label: 'demand forecasts' },
  { value: 'Early', label: 'expiry alerts' },
  { value: 'Live', label: 'surplus auctions' },
];

export default function HomePage({ onNavigate }) {
  return <div className="home">
    <header className="home-nav">
      <button type="button" className="home-logo" onClick={() => onNavigate('home')}>
        <span className="brand-mark"><Sprout size={22} strokeWidth={2} /></span>
        <span><strong>Root &amp; Reuse</strong><small>Restaurant intelligence</small></span>
      </button>
      <nav>
        <a href="#features">Features</a>
        <a href="#how">How it works</a>
        <button type="button" className="home-link" onClick={() => onNavigate('admin-login')}>Admin</button>
        <button type="button" className="home-cta small" onClick={() => onNavigate('user-login')}>Log in</button>
      </nav>
    </header>

    <section className="home-hero">
      <span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" />
      <div className="hero-copy">
        <span className="hero-pill"><Leaf size={14} /> Proactive food waste prevention</span>
        <h1>Cook what you'll sell.<br /><em>Rescue</em> what you won't.</h1>
        <p>Root &amp; Reuse helps restaurants forecast demand, catch waste risk early and sell surplus food to people who want it.</p>
        <div className="hero-actions">
          <button type="button" className="home-cta" onClick={() => onNavigate('user-login')}>Browse surplus food <ArrowRight size={16} /></button>
          <button type="button" className="home-cta ghost" onClick={() => onNavigate('admin-login')}><ShieldCheck size={16} /> Admin dashboard</button>
        </div>
        <div className="hero-stats">{STATS.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="float-card fc-main">
          <span className="fc-tag">Surplus · ends in 42m</span>
          <strong>Roasted veg lasagna</strong>
          <small>Green Room Bistro · 6 portions</small>
          <div className="fc-bid"><span>Current bid</span><b>$4.50</b></div>
        </div>
        <div className="float-card fc-risk"><ShieldAlert size={18} /><div><strong>Spinach · 2 days left</strong><small>High waste risk</small></div></div>
        <div className="float-card fc-forecast"><ChefHat size={18} /><div><strong>Tomorrow's demand</strong><small>+12% · prep 48 portions</small></div></div>
      </div>
    </section>

    <section className="home-section" id="features">
      <span className="section-eyebrow">What it does</span>
      <h2>One platform, from kitchen to customer</h2>
      <div className="feature-grid">
        {FEATURES.map(({ icon: Icon, tone, title, text }) => <article key={title} className="feature-card">
          <span className={`feature-icon ${tone}`}><Icon size={22} /></span>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>)}
      </div>
    </section>

    <section className="home-section flow" id="how">
      <span className="section-eyebrow">How it works</span>
      <h2>Prevent first. Recover second.</h2>
      <ol className="flow-steps">
        <li><b>1</b><strong>Prevent</strong><span>Forecast demand and prepare the right quantity.</span></li>
        <li><b>2</b><strong>Detect</strong><span>Flag stock at risk of expiring before it is wasted.</span></li>
        <li><b>3</b><strong>Recover</strong><span>Auction unavoidable surplus to nearby customers.</span></li>
      </ol>
    </section>

    <section className="home-section portals">
      <button type="button" className="portal-card customer" onClick={() => onNavigate('user-login')}>
        <span className="portal-icon"><ShoppingBag size={24} /></span>
        <div><strong>I'm a customer</strong><span>Find surplus meals and place bids.</span></div>
        <ArrowRight size={20} />
      </button>
      <button type="button" className="portal-card admin" onClick={() => onNavigate('admin-login')}>
        <span className="portal-icon"><ShieldCheck size={24} /></span>
        <div><strong>I run a restaurant</strong><span>Forecast, monitor stock and list surplus.</span></div>
        <ArrowRight size={20} />
      </button>
    </section>

    <footer className="home-footer"><span>Root &amp; Reuse · Research prototype</span><span>J26 · IT · 461</span></footer>
  </div>;
}
