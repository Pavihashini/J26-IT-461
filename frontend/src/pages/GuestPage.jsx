import React, { useState } from 'react';
import { ArrowLeft, Leaf } from 'lucide-react';
import BrandMark from '../components/BrandMark.jsx';
import { initialSurplusListings } from '../data/mockData.js';
import { formatLKR } from '../utils.js';
import './GuestPage.css';

const categories = ['All dishes', ...new Set(initialSurplusListings.map((listing) => listing.category))];

export default function GuestPage({ onNavigate }) {
  const [category, setCategory] = useState('All dishes');
  const listings = category === 'All dishes'
    ? initialSurplusListings
    : initialSurplusListings.filter((listing) => listing.category === category);

  return <div className="guest-page">
    <header className="guest-header">
      <button type="button" className="auth-brand-link" onClick={() => onNavigate('home')}><BrandMark /><span><strong>SmartPlate</strong><small>Surplus marketplace</small></span></button>
      <button type="button" className="button-primary" onClick={() => onNavigate('user-login')}>Sign in</button>
    </header>
    <main className="guest-main">
      <button type="button" className="signin-text-button" onClick={() => onNavigate('home')}><ArrowLeft size={15} /> Back to home</button>
      <div className="guest-menu-heading">
        <h1>Browse surplus food</h1>
      </div>
      <nav className="guest-category-filters" aria-label="Food categories">
        {categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>
          {item}<span>{item === 'All dishes' ? initialSurplusListings.length : initialSurplusListings.filter((listing) => listing.category === item).length}</span>
        </button>)}
      </nav>
      <p className="guest-results-count" aria-live="polite">{listings.length} {listings.length === 1 ? 'dish' : 'dishes'}{category === 'All dishes' ? ' on our menu' : ` in ${category.toLowerCase()}`}</p>
      <div className="guest-listings">
        {listings.map((listing, index) => <article className="guest-listing" key={listing.id}>
          <div className="guest-listing-photo">
            <img src={listing.image} alt={listing.imageAlt || listing.name} width="800" height="520" loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />
            <span className={`status-badge ${listing.status === 'open' ? 'green' : 'neutral'}`}>{listing.status === 'open' ? 'Open sample' : 'Closed sample'}</span>
          </div>
          <div className="guest-listing-body">
            <div className="guest-listing-category"><span>{listing.category}</span>{listing.vegetarian && <span className="guest-vegetarian"><Leaf size={12} /> Vegetarian</span>}</div>
            <h2>{listing.name}</h2>
            <div className="guest-listing-price"><div><small>Sample starting price</small><strong>{formatLKR(listing.referencePrice)}</strong></div><span>{listing.quantity}</span></div>
            <button type="button" className="button-primary" onClick={() => onNavigate('user-login')}>{listing.status === 'open' ? 'Sign in to bid' : 'Sign in to explore'}</button>
          </div>
        </article>)}
      </div>
    </main>
  </div>;
}
