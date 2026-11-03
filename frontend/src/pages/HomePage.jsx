import React from 'react';
import BrandMark from '../components/BrandMark.jsx';
import { ArrowRight, Check, ChefHat, ChevronRight, ShieldAlert, ShieldCheck, ShoppingBag } from 'lucide-react';
import './HomePage.css';

const FEATURES = [
  { icon: ChefHat, tone: 'green', title: 'Demand forecasting', text: 'Predict how many portions each dish will sell, so the kitchen prepares the right quantity.' },
  { icon: ShieldAlert, tone: 'orange', title: 'Inventory & waste risk', text: 'Spot ingredients nearing expiry early and protect stock value before it is lost.' },
  { icon: ShoppingBag, tone: 'blue', title: 'Surplus bidding', text: 'List unavoidable surplus and let customers bid, recovering value instead of binning food.' },
];

const STATS = [
  { value: 'Daily', label: 'demand forecasts' },
  { value: 'Early', label: 'expiry alerts' },
  { value: 'Smart', label: 'surplus recovery' },
];

export default function HomePage({ onNavigate }) {
  return <div className="home smartplate-home">
    <header className="home-nav">
      <button type="button" className="home-logo" onClick={() => onNavigate('home')}>
        <BrandMark />
        <span><strong>SmartPlate</strong><small>Restaurant intelligence</small></span>
      </button>
      <nav aria-label="Website navigation">
        <a href="#features">Features</a>
        <a href="#how">How it works</a>
        <button type="button" className="home-link" onClick={() => onNavigate('admin-login')}>For restaurants</button>
        <button type="button" className="home-cta small" onClick={() => onNavigate('user-login')}>Log in</button>
      </nav>
    </header>

    <section className="home-hero home-hero-simple">
      <div className="hero-copy">
        <span className="hero-pill"><span className="sp-pill-dot" /> A smarter way to serve</span>
        <h1>Better planning.<br /><em>Less waste.</em><br />More possibility.</h1>
        <div className="hero-actions">
          <button type="button" className="home-cta" onClick={() => onNavigate('admin-login')}>Open your dashboard <ArrowRight size={17} /></button>
          <button type="button" className="home-cta ghost" onClick={() => onNavigate('user-login')}>Find surplus food <ChevronRight size={17} /></button>
        </div>
        <div className="sp-hero-note"><Check size={15} /> Thoughtful tools, from kitchen to community.</div>
        <div className="hero-stats">{STATS.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
      </div>

    </section>

    <section className="home-section" id="features">
      <span className="section-eyebrow">LESS GUESSWORK. MORE GOOD.</span>
      <h2>Everything your kitchen needs.<br />Nothing it doesn’t.</h2>
      <p className="sp-section-intro">Three connected tools to help you make the most of every ingredient.</p>
      <div className="feature-grid">
        {FEATURES.map(({ icon: Icon, tone, title, text }, index) => <article key={title} className="feature-card">
          <div className="sp-feature-top"><span className={`feature-icon ${tone}`}><Icon size={23} /></span><span>0{index + 1}</span></div>
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

    <footer className="home-footer"><span>SmartPlate · Research prototype</span><span>J26 · IT · 461</span></footer>
  </div>;
}
