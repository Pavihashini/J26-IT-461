import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, BadgeCheck, Clock3, Gavel, PackageCheck, ShieldCheck, ShoppingBag, TimerReset, TrendingUp, Trophy, Users, Zap } from 'lucide-react';
import { initialSurplusListings, ingredientCatalog } from '../data/mockData.js';
import { formatLKR, timeRemaining } from '../utils.js';
import { FlowStrip, Notice, PageHeading, Panel, StatusBadge } from '../components/Shared.jsx';

function clockNow() {
  return new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

const noveltyItems = [
  { icon: Zap, title: 'Automatic surplus listing', text: 'Triggered by Component 2. Surplus detected by inventory-risk analysis becomes a listing without manual entry.' },
  { icon: Users, title: 'Real-time customer bidding', text: 'Customers compete on live surplus items, and the highest bid updates as bids arrive.' },
  { icon: Clock3, title: 'Time-boxed auction', text: 'Each listing has a fixed bidding window, so unsold stock is resolved before it spoils.' },
  { icon: TrendingUp, title: 'Dynamic pricing instead of fixed discounting', text: 'Demand sets the final price through bidding rather than a preset markdown.' },
];

export default function SurplusBiddingPage({ isActive = true }) {
  const [listings, setListings] = useState(() => initialSurplusListings.map((item) => ({ ...item, bids: [...item.bids] })));
  const [selectedId, setSelectedId] = useState('S-201');
  const [bidInput, setBidInput] = useState('1000');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  useEffect(() => {
    if (!isActive) return undefined;
    const timer = window.setInterval(() => {
      setListings((previous) => previous.map((listing) => {
        if (listing.status !== 'open') return listing;
        const nextSeconds = Math.max(0, listing.remainingSeconds - 1);
        return { ...listing, remainingSeconds: nextSeconds, status: nextSeconds === 0 ? 'closed' : 'open' };
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isActive]);

  const selected = listings.find((item) => item.id === selectedId) || listings[0];
  const linkedIngredient = ingredientCatalog.find((item) => item.id === selected.sourceIngredientId);
  const currentWinner = useMemo(() => selected.bids.length ? [...selected.bids].sort((a, b) => b.amount - a.amount)[0] : null, [selected.bids]);
  const openListings = listings.filter((item) => item.status === 'open').length;
  const totalBids = listings.reduce((sum, listing) => sum + listing.bids.length, 0);

  const chooseListing = (listing) => {
    setSelectedId(listing.id);
    setBidInput(String(Math.max(listing.highestBid + 50, listing.referencePrice)));
    setBidError('');
    setBidSuccess('');
  };

  const placeBid = (event) => {
    event.preventDefault();
    const amount = Number(bidInput);
    if (selected.status !== 'open' || selected.remainingSeconds <= 0) {
      setBidError('This bidding window has closed. Additional bids are not accepted.');
      setBidSuccess('');
      return;
    }
    if (!Number.isFinite(amount) || amount <= selected.highestBid) {
      setBidError(`Enter a valid amount greater than ${formatLKR(selected.highestBid)}.`);
      setBidSuccess('');
      return;
    }
    const bid = { id: `local-${Date.now()}`, bidder: 'You (demo)', amount, at: clockNow() };
    setListings((previous) => previous.map((listing) => listing.id === selected.id ? { ...listing, highestBid: amount, bids: [bid, ...listing.bids] } : listing));
    setBidError('');
    setBidSuccess(`Your mock bid of ${formatLKR(amount)} was added to this local demonstration.`);
  };

  const closeSelected = () => {
    setListings((previous) => previous.map((listing) => listing.id === selected.id ? { ...listing, status: 'closed', remainingSeconds: 0 } : listing));
    setBidError('');
    setBidSuccess('The demonstration bidding window has been closed.');
  };

  return <div className="page-stack">
    <PageHeading
      eyebrow="Component 03 · Recover value from unavoidable surplus"
      title="Surplus pricing & bidding"
      description="Simulate an automatically-created surplus listing, accept valid bids for a limited time, and award the item to the highest valid bid when the window closes."
      actions={<span className="live-demo-label"><span className="pulse-dot" /> Local demo timer</span>}
    />

    <div className="stats-grid three">
      <article className="stat-card"><div className="stat-icon green"><ShoppingBag size={19} /></div><div className="stat-body"><div className="stat-label">Demo surplus listings</div><div className="stat-value">{listings.length}</div><div className="stat-detail">Linked to inventory-risk scenarios</div></div></article>
      <article className="stat-card"><div className="stat-icon blue"><Activity size={19} /></div><div className="stat-body"><div className="stat-label">Open auctions</div><div className="stat-value">{openListings}</div><div className="stat-detail">Countdown runs locally in this tab</div></div></article>
      <article className="stat-card"><div className="stat-icon orange"><Gavel size={19} /></div><div className="stat-body"><div className="stat-label">Bid activity</div><div className="stat-value">{totalBids}</div><div className="stat-detail">Includes seeded and user demo bids</div></div></article>
    </div>

    <Panel className="process-panel" title="Surplus recovery workflow" subtitle="Second prevention layer: recover value if some surplus remains despite demand and inventory planning.">
      <FlowStrip items={['Surplus detected', 'Listing created', 'Timed bidding', 'Highest valid bid wins']} />
    </Panel>

    <Panel className="novelty-panel" title="Research novelty" subtitle="What makes this component different from conventional markdown-based surplus handling.">
      <div className="novelty-grid">
        {noveltyItems.map(({ icon: Icon, title, text }) => <article className="novelty-card" key={title}><span className="novelty-icon"><Icon size={18} /></span><div><strong>{title}</strong><p>{text}</p></div></article>)}
      </div>
    </Panel>

    <div className="auction-layout">
      <Panel title="Surplus listings" subtitle="Choose a mock listing to view and place a bid." className="listing-panel">
        <div className="listing-list">
          {listings.map((listing) => {
            const winner = listing.bids.length ? [...listing.bids].sort((a, b) => b.amount - a.amount)[0] : null;
            return <button type="button" className={`listing-card ${selected.id === listing.id ? 'selected' : ''}`} key={listing.id} onClick={() => chooseListing(listing)}>
              <div className="listing-card-top"><span className="food-thumb"><PackageCheck size={21} /></span><StatusBadge tone={listing.status === 'open' ? 'green' : 'neutral'}>{listing.status === 'open' ? 'Bidding open' : 'Closed'}</StatusBadge></div>
              <strong>{listing.name}</strong><span className="listing-quantity">{listing.quantity}</span>
              <div className="listing-price-grid"><div><small>Reference</small><b>{formatLKR(listing.referencePrice)}</b></div><div><small>Highest bid</small><b>{listing.highestBid ? formatLKR(listing.highestBid) : 'No bids'}</b></div></div>
              <div className="listing-bottom"><span><Clock3 size={14} /> {listing.status === 'open' ? timeRemaining(listing.remainingSeconds) : 'Ended'}</span>{listing.status === 'closed' && <small>{winner ? `Winner ${winner.bidder}` : 'No bids received'}</small>}</div>
            </button>;
          })}
        </div>
      </Panel>

      <div className="auction-detail-column">
        <Panel className="auction-detail-panel" title="Live bidding room" subtitle="Bids and countdown are managed by React state in this browser only.">
          <div className="auction-item-heading"><div className="auction-item-icon"><ShoppingBag size={23} /></div><div><span className="eyebrow">{selected.id} · {selected.quantity}</span><h2>{selected.name}</h2><p>Reference price: <strong>{formatLKR(selected.referencePrice)}</strong></p></div><StatusBadge tone={selected.status === 'open' ? 'green' : 'neutral'}>{selected.status === 'open' ? 'Live demo' : 'Closed'}</StatusBadge></div>
          <div className="bid-highlight-grid"><div><span>Current highest bid</span><strong>{selected.highestBid > 0 ? formatLKR(selected.highestBid) : 'No bids yet'}</strong><small>{currentWinner ? `Leading: ${currentWinner.bidder}` : 'Waiting for the first valid bid'}</small></div><div className={`countdown-box ${selected.status !== 'open' ? 'closed' : ''}`}><Clock3 size={17} /><span>{selected.status === 'open' ? 'Time remaining' : 'Bidding ended'}</span><strong>{selected.status === 'open' ? timeRemaining(selected.remainingSeconds) : '00:00'}</strong></div></div>
          <div className="source-link-note"><span className={`risk-bullet ${linkedIngredient?.risk === 'High' ? 'high' : 'medium'}`} /><div><strong>Inventory context</strong><p>{selected.sourceLabel}. This listing is a predefined example related to Component 2; it is not automatically generated by a live risk service.</p></div></div>

          <form className="bid-form" onSubmit={placeBid}>
            <label htmlFor="bid-amount">Your bid amount (LKR)</label>
            <div className="bid-input-row"><div className="currency-input"><span>Rs.</span><input id="bid-amount" type="number" min={selected.highestBid + 1} step="1" value={bidInput} onChange={(event) => { setBidInput(event.target.value); setBidError(''); setBidSuccess(''); }} disabled={selected.status !== 'open'} /></div><button className="button-primary" type="submit" disabled={selected.status !== 'open'}><Gavel size={16} /> Place bid</button></div>
            <div className="form-helper">Bid must exceed the current highest bid of {formatLKR(selected.highestBid)}.</div>
            {bidError && <div className="form-message error" role="alert">{bidError}</div>}
            {bidSuccess && <div className="form-message success" role="status">{bidSuccess}</div>}
            {selected.status === 'open' && <button className="text-button close-auction" type="button" onClick={closeSelected}><TimerReset size={14} /> End this demo auction now</button>}
          </form>

          {selected.status === 'closed' && <div className={`auction-result ${currentWinner ? 'has-winner' : 'no-winner'}`}><div className="result-icon">{currentWinner ? <Trophy size={21} /> : <Clock3 size={21} />}</div><div><strong>{currentWinner ? 'Auction complete — highest valid bid wins' : 'Auction closed — no bids received'}</strong><p>{currentWinner ? `${currentWinner.bidder} leads at ${formatLKR(currentWinner.amount)} for ${selected.quantity}. This is the highest valid bid recorded in the demo.` : 'No valid bids were placed before the bidding window closed, so there is no winner.'}</p></div></div>}
        </Panel>

        <Panel title="Recent bid activity" subtitle={`${selected.bids.length} bid${selected.bids.length === 1 ? '' : 's'} in this listing's local history.`}>
          {selected.bids.length ? <div className="bid-activity-list">{[...selected.bids].sort((a, b) => b.at.localeCompare(a.at)).map((bid, index) => <div className="bid-activity-row" key={bid.id}><span className={`bid-avatar ${bid.bidder === 'You (demo)' ? 'you' : ''}`}>{bid.bidder === 'You (demo)' ? 'Y' : bid.bidder.replace(/\D/g, '').slice(-2) || 'C'}</span><div className="bid-activity-main"><strong>{bid.bidder}</strong><small>{bid.at}{index === 0 && bid.amount === selected.highestBid ? ' · Most recent' : ''}</small></div><strong className="bid-activity-amount">{formatLKR(bid.amount)}</strong>{bid.amount === selected.highestBid && <BadgeCheck size={17} className="highest-icon" />}</div>)}</div> : <div className="empty-chart">No valid bids were submitted for this listing.</div>}
        </Panel>
      </div>
    </div>

    <Notice>Countdowns, bidder identities, and bid updates are simulated in the browser. This prototype does not use WebSockets, does not connect multiple customers, and does not process real payments or reservations.</Notice>
  </div>;
}
