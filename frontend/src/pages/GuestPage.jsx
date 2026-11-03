import React from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import BrandMark from '../components/BrandMark.jsx';
import { initialSurplusListings } from '../data/mockData.js';
import { formatLKR } from '../utils.js';

export default function GuestPage({ onNavigate }) {
  return <div className="guest-page">
    <header className="guest-header"><button className="auth-brand-link" onClick={() => onNavigate('home')}><BrandMark /><span><strong>SmartPlate</strong><small>Surplus marketplace</small></span></button><button className="button-primary" onClick={() => onNavigate('user-login')}>Sign in</button></header>
    <main className="guest-main"><button className="signin-text-button" onClick={() => onNavigate('home')}><ArrowLeft size={15} /> Back to home</button><h1>Browse surplus food</h1><p>Sample listings. Sign in to place a bid.</p><div className="guest-listings">{initialSurplusListings.map(listing => <article className="guest-listing" key={listing.id}><span className="guest-food-icon"><ShoppingBag size={26} /></span><span className={`status-badge ${listing.status === 'open' ? 'green' : 'neutral'}`}>{listing.status === 'open' ? 'Open sample' : 'Closed sample'}</span><h2>{listing.name}</h2><p>{listing.quantity}</p><small>Starting price</small><strong>{formatLKR(listing.referencePrice)}</strong><button className="button-primary" onClick={() => onNavigate('user-login')}>{listing.status === 'open' ? 'Sign in to bid' : 'Sign in to explore'}</button></article>)}</div></main>
  </div>;
}
