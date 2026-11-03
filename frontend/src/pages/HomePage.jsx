import React, { useEffect, useRef, useState } from 'react';
import BrandMark from '../components/BrandMark.jsx';
import { ArrowRight, Check, ChefHat, ChevronRight, Home, Leaf, Menu, ShieldAlert, ShieldCheck, ShoppingBag, UserRound, X } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const header = useRef(null);
  const navigate = (view) => { setMenuOpen(false); onNavigate(view); };

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    };
    const onOutsideClick = (event) => {
      if (!header.current?.contains(event.target)) setMenuOpen(false);
    };
    const media = window.matchMedia('(min-width: 901px)');
    const onResize = () => { if (media.matches) setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutsideClick);
    media.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutsideClick);
      media.removeEventListener('change', onResize);
    };
  }, [menuOpen]);

  return <div className="home smartplate-home" id="top">
    <header className="home-nav sp-site-header" ref={header}>
      <div className="sp-header-inner">
        <a className="home-logo" href="#top" aria-label="SmartPlate home" onClick={() => setMenuOpen(false)}>
          <BrandMark />
          <span><strong>SmartPlate<span className="sp-brand-dot">.</span></strong><small>Restaurant intelligence</small></span>
        </a>
        <nav id="smartplate-navigation" className={`sp-header-navigation ${menuOpen ? 'is-open' : ''}`} aria-label="Website navigation">
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
          <button type="button" className="home-link" onClick={() => navigate('admin-login')}><ShieldCheck size={15} /> For restaurants</button>
        </nav>
        <div className="sp-header-actions">
          <button type="button" className="home-cta small sp-sign-in" onClick={() => navigate('user-login')}>Sign in</button>
          <button type="button" className="home-cta small sp-register" onClick={() => navigate('user-register')}>Register</button>
          <button type="button" className="sp-menu-toggle" ref={menuButton} aria-expanded={menuOpen} aria-controls="smartplate-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
    </header>

    <section className="home-hero home-hero-burger">
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
      <div className="sp-hero-photo"><img src="/images/smartplate-burger.jpg" alt="" aria-hidden="true" width="1920" height="1080" fetchPriority="high" decoding="async" /></div>
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

    <footer className="home-footer sp-site-footer">
      <div className="sp-footer-inner">
        <div className="sp-footer-heading">
          <a href="#top" className="sp-footer-logo" aria-label="SmartPlate home"><BrandMark /><strong>SmartPlate</strong></a>
          <div className="sp-footer-divider" aria-hidden="true" />
          <nav className="sp-footer-shortcuts" aria-label="Quick links">
            <a href="#top" aria-label="Back to home" title="Home"><Home size={19} /></a>
            <a href="#features" aria-label="Explore features" title="Features"><Leaf size={19} /></a>
            <a href="#how" aria-label="See how it works" title="How it works"><ChefHat size={20} /></a>
            <button type="button" onClick={() => navigate('admin-login')} aria-label="Restaurant portal" title="Restaurant portal"><ShieldCheck size={19} /></button>
            <button type="button" onClick={() => navigate('user-login')} aria-label="Customer portal" title="Customer portal"><UserRound size={19} /></button>
          </nav>
        </div>
        <div className="sp-footer-columns">
          <nav className="sp-footer-links" aria-label="About SmartPlate">
            <h2>About</h2>
            <a href="#features">About SmartPlate</a>
            <a href="#features">Our features</a>
            <a href="#how">How it works</a>
          </nav>
          <nav className="sp-footer-links" aria-label="Explore food">
            <h2>Explore</h2>
            <button type="button" onClick={() => navigate('user-login')}>Surplus marketplace</button>
            <button type="button" onClick={() => navigate('user-login')}>Browse meals</button>
            <a href="#how">Food waste prevention</a>
          </nav>
          <nav className="sp-footer-links" aria-label="For restaurants">
            <h2>For restaurants</h2>
            <button type="button" onClick={() => navigate('admin-login')}>Restaurant dashboard</button>
            <button type="button" onClick={() => navigate('admin-login')}>Demand forecasting</button>
            <button type="button" onClick={() => navigate('admin-login')}>Inventory &amp; waste risk</button>
          </nav>
          <nav className="sp-footer-links" aria-label="My account">
            <h2>My account</h2>
            <button type="button" onClick={() => navigate('user-login')}>Sign in</button>
            <button type="button" onClick={() => navigate('user-register')}>Register</button>
          </nav>
        </div>
      </div>
    </footer>
  </div>;
}
