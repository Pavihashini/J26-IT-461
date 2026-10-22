import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, BadgeCheck, Clock3, Gavel, PackageCheck, Percent, ShieldCheck, ShoppingBag, TimerReset, TrendingUp, Trophy, Users, Zap } from 'lucide-react';
import { initialSurplusListings, ingredientCatalog } from '../data/mockData.js';
import { BID_WINDOW, bidWindowState, formatHMS, formatLKR, maximumBid, startingBid, timeRemaining } from '../utils.js';
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
  const [bidInput, setBidInput] = useState(() => String(Math.min(maximumBid(initialSurplusListings[0].referencePrice), initialSurplusListings[0].highestBid + 50)));
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  const [now, setNow] = useState(() => new Date());
  const [demoOverride, setDemoOverride] = useState(false);

  useEffect(() => {
    if (!isActive) return undefined;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [isActive]);

  const windowState = bidWindowState(now);
  const windowLive = demoOverride || windowState.phase === 'open';
  const canBid = (listing) => listing.status === 'open' && windowLive;
  const countdownText = (listing) => {
    if (listing.status !== 'open') return 'Ended';
    if (demoOverride) return 'Demo mode';
    if (windowState.phase === 'open') return timeRemaining(windowState.seconds);
    if (windowState.phase === 'before') return `Opens in ${formatHMS(windowState.seconds)}`;
    return 'Closed today';
  };

  const selected = listings.find((item) => item.id === selectedId) || listings[0];
  const linkedIngredient = ingredientCatalog.find((item) => item.id === selected.sourceIngredientId);
  const minBid = selected.highestBid ? selected.highestBid + 1 : startingBid(selected.referencePrice);
  const maxBid = maximumBid(selected.referencePrice);
  const currentWinner = useMemo(() => selected.bids.length ? [...selected.bids].sort((a, b) => b.amount - a.amount)[0] : null, [selected.bids]);
  const openListings = listings.filter((item) => item.status === 'open').length;
  const totalBids = listings.reduce((sum, listing) => sum + listing.bids.length, 0);

  const chooseListing = (listing) => {
    setSelectedId(listing.id);
    setBidInput(String(Math.min(maximumBid(listing.referencePrice), listing.highestBid ? listing.highestBid + 50 : startingBid(listing.referencePrice))));
    setBidError('');
    setBidSuccess('');
  };

  const placeBid = (event) => {
    event.preventDefault();
    const amount = Number(bidInput);
    if (selected.status !== 'open') {
      setBidError('This auction has ended. Additional bids are not accepted.');
      setBidSuccess('');
      return;
    }
    if (!windowLive) {
      setBidError(`Bids are only accepted between ${BID_WINDOW.label}.`);
      setBidSuccess('');
      return;
    }
    if (!Number.isFinite(amount) || amount < minBid) {
      setBidError(selected.highestBid ? `Enter a bid greater than ${formatLKR(selected.highestBid)}.` : `The starting bid is ${formatLKR(minBid)}.`);
      setBidSuccess('');
      return;
    }
    if (amount > maxBid) {
      setBidError(`The maximum bid is ${formatLKR(maxBid)} (30% off the meal price).`);
      setBidSuccess('');
      return;
    }
    const bid = { id: `local-${Date.now()}`, bidder: 'You (demo)', amount, at: clockNow() };
    const reachedMax = amount >= maxBid;
    setListings((previous) => previous.map((listing) => listing.id === selected.id ? { ...listing, highestBid: amount, bids: [bid, ...listing.bids], status: reachedMax ? 'closed' : listing.status } : listing));
    setBidError('');
    setBidSuccess(reachedMax ? `Your bid of ${formatLKR(amount)} reached the maximum, so you won this meal and the auction is closed.` : `Your mock bid of ${formatLKR(amount)} was added to this local demonstration.`);
  };

  const closeSelected = () => {
    setListings((previous) => previous.map((listing) => listing.id === selected.id ? { ...listing, status: 'closed' } : listing));
    setBidError('');
    setBidSuccess('The demonstration bidding window has been closed.');
  };

  return <div className="page-stack">
    <PageHeading
      eyebrow="Component 03 · Recover value from unavoidable surplus"
      title="Time limited surplus food bidding and recovery"
      description="Simulate an automatically-created surplus listing, accept valid bids for a limited time, and award the item to the highest valid bid when the window closes."
      actions={<span className="live-demo-label"><span className="pulse-dot" /> Local demo timer</span>}
    />

    <div className="stats-grid three">
      <article className="stat-card"><div className="stat-icon green"><ShoppingBag size={19} /></div><div className="stat-body"><div className="stat-label">Demo surplus listings</div><div className="stat-value">{listings.length}</div><div className="stat-detail">Linked to inventory-risk scenarios</div></div></article>
      <article className="stat-card"><div className="stat-icon blue"><Activity size={19} /></div><div className="stat-body"><div className="stat-label">Open auctions</div><div className="stat-value">{openListings}</div><div className="stat-detail">Countdown runs locally in this tab</div></div></article>
      <article className="stat-card"><div className="stat-icon orange"><Gavel size={19} /></div><div className="stat-body"><div className="stat-label">Bid activity</div><div className="stat-value">{totalBids}</div><div className="stat-detail">Includes seeded and user demo bids</div></div></article>
    </div>

    <section className={`window-banner ${windowLive ? 'live' : ''}`} aria-label="Bidding window">
      <div className="window-icon"><Clock3 size={22} /></div>
      <div className="window-copy">
        <strong>Bidding window · {BID_WINDOW.label}</strong>
        <span>{demoOverride ? 'Demo mode is on, so bids are accepted at any time.' : windowState.phase === 'open' ? `Open now. ${timeRemaining(windowState.seconds)} left to bid.` : windowState.phase === 'before' ? `Opens in ${formatHMS(windowState.seconds)}. Come back at 9:00 PM to bid.` : 'Closed for today. Bidding reopens at 9:00 PM tomorrow.'}</span>
      </div>
      <div className="window-rules"><span><Percent size={13} /> Start at 20% of price</span><span><TrendingUp size={13} /> Max bid 70% (30% off)</span></div>
      <label className="demo-toggle"><input type="checkbox" checked={demoOverride} onChange={(event) => { setDemoOverride(event.target.checked); setBidError(''); setBidSuccess(''); }} /><span className="toggle-track" /> Demo: ignore time window</label>
    </section>

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
            return <button type="button" className={`listing-card ${selected.id === listing.id ? 'selected' : ''} ${listing.status === 'closed' ? 'is-closed' : ''}`} key={listing.id} onClick={() => chooseListing(listing)}>
              <div className="listing-card-top"><span className="food-thumb"><PackageCheck size={21} /></span><StatusBadge tone={listing.status === 'open' ? 'green' : 'neutral'}>{listing.status === 'open' ? 'Bidding open' : 'Closed'}</StatusBadge></div>
              <strong>{listing.name}</strong><span className="listing-quantity">{listing.quantity}</span>
              <div className="listing-price-grid"><div><small>Meal price</small><b>{formatLKR(listing.referencePrice)}</b></div><div><small>Highest bid</small><b>{listing.highestBid ? formatLKR(listing.highestBid) : 'No bids'}</b></div></div>
              <div className="listing-range"><Percent size={13} /> Bid range {formatLKR(startingBid(listing.referencePrice))} – {formatLKR(maximumBid(listing.referencePrice))}</div>
              <div className="listing-bottom"><span><Clock3 size={14} /> {countdownText(listing)}</span>{listing.status === 'closed' && <small>{winner ? `Winner ${winner.bidder}` : 'No bids received'}</small>}</div>
            </button>;
          })}
        </div>
      </Panel>

      <div className="auction-detail-column">
        <Panel className="auction-detail-panel" title="Live bidding room" subtitle="Bids and countdown are managed by React state in this browser only.">
          <div className="auction-item-heading"><div className="auction-item-icon"><ShoppingBag size={23} /></div><div><span className="eyebrow">{selected.id} · {selected.quantity}</span><h2>{selected.name}</h2><p>Meal price: <strong>{formatLKR(selected.referencePrice)}</strong></p></div><StatusBadge tone={canBid(selected) ? 'green' : 'neutral'}>{selected.status !== 'open' ? 'Closed' : canBid(selected) ? 'Bidding open' : 'Window closed'}</StatusBadge></div>
          <div className="bid-highlight-grid"><div><span>Current highest bid</span><strong>{selected.highestBid > 0 ? formatLKR(selected.highestBid) : 'No bids yet'}</strong><small>{currentWinner ? `Leading: ${currentWinner.bidder}` : 'Waiting for the first valid bid'}</small></div><div className={`countdown-box ${canBid(selected) && !demoOverride ? '' : 'closed'}`}><Clock3 size={17} /><span>{selected.status !== 'open' ? 'Bidding ended' : demoOverride ? 'Demo mode' : windowState.phase === 'open' ? 'Time remaining' : windowState.phase === 'before' ? 'Window opens in' : 'Closed for today'}</span><strong>{selected.status !== 'open' ? '00:00' : demoOverride ? 'Open' : windowState.phase === 'open' ? timeRemaining(windowState.seconds) : windowState.phase === 'before' ? formatHMS(windowState.seconds) : '00:00'}</strong></div></div>
          <div className="source-link-note"><span className={`risk-bullet ${linkedIngredient?.risk === 'High' ? 'high' : 'medium'}`} /><div><strong>Inventory context</strong><p>{selected.sourceLabel}. This listing is a predefined example related to Component 2; it is not automatically generated by a live risk service.</p></div></div>

          <div className="bid-range-strip">
            <div><small>Starting bid</small><b>{formatLKR(startingBid(selected.referencePrice))}</b><span>20% of meal price</span></div>
            <div className="range-bar" aria-hidden="true"><i style={{ width: `${selected.highestBid ? Math.min(100, Math.max(4, ((selected.highestBid - startingBid(selected.referencePrice)) / (maxBid - startingBid(selected.referencePrice))) * 100)) : 0}%` }} /></div>
            <div className="range-max"><small>Maximum bid</small><b>{formatLKR(maxBid)}</b><span>30% discount</span></div>
          </div>

          <form className="bid-form" onSubmit={placeBid} noValidate>
            <label htmlFor="bid-amount">Your bid amount (LKR)</label>
            <div className="bid-input-row"><div className="currency-input"><span>Rs.</span><input id="bid-amount" type="number" min={minBid} max={maxBid} step="1" value={bidInput} onChange={(event) => { setBidInput(event.target.value); setBidError(''); setBidSuccess(''); }} disabled={!canBid(selected)} /></div><button className="button-primary" type="submit" disabled={!canBid(selected)}><Gavel size={16} /> Place bid</button></div>
            <div className="form-helper">{!windowLive && selected.status === 'open' ? `Bidding is only open ${BID_WINDOW.label}.` : selected.highestBid ? `Bid between ${formatLKR(minBid)} and ${formatLKR(maxBid)}. Reaching ${formatLKR(maxBid)} wins the meal instantly.` : `Place a bid between ${formatLKR(minBid)} and ${formatLKR(maxBid)}.`}</div>
            {bidError && <div className="form-message error" role="alert">{bidError}</div>}
            {bidSuccess && <div className="form-message success" role="status">{bidSuccess}</div>}
            {selected.status === 'open' && windowLive && <button className="text-button close-auction" type="button" onClick={closeSelected}><TimerReset size={14} /> End this demo auction now</button>}
          </form>

          {selected.status === 'closed' && <div className={`auction-result ${currentWinner ? 'has-winner' : 'no-winner'}`}><div className="result-icon">{currentWinner ? <Trophy size={21} /> : <Clock3 size={21} />}</div><div><strong>{currentWinner ? 'Auction complete — highest valid bid wins' : 'Auction closed — no bids received'}</strong><p>{currentWinner ? `${currentWinner.bidder} leads at ${formatLKR(currentWinner.amount)} for ${selected.quantity}. This is the highest valid bid recorded in the demo.` : 'No valid bids were placed before the bidding window closed, so there is no winner.'}</p></div></div>}
        </Panel>

        <Panel title="Recent bid activity" subtitle={`${selected.bids.length} bid${selected.bids.length === 1 ? '' : 's'} in this listing's local history.`}>
          {selected.bids.length ? <div className="bid-activity-list">{[...selected.bids].sort((a, b) => b.at.localeCompare(a.at)).map((bid, index) => <div className="bid-activity-row" key={bid.id}><span className={`bid-avatar ${bid.bidder === 'You (demo)' ? 'you' : ''}`}>{bid.bidder === 'You (demo)' ? 'Y' : bid.bidder.replace(/\D/g, '').slice(-2) || 'C'}</span><div className="bid-activity-main"><strong>{bid.bidder}</strong><small>{bid.at}{index === 0 && bid.amount === selected.highestBid ? ' · Most recent' : ''}</small></div><strong className="bid-activity-amount">{formatLKR(bid.amount)}</strong>{bid.amount === selected.highestBid && <BadgeCheck size={17} className="highest-icon" />}</div>)}</div> : <div className="empty-chart">No valid bids were submitted for this listing.</div>}
        </Panel>
      </div>
    </div>

    <Notice>The 9:00–9:15 PM window uses this device's clock. Countdowns, bidder identities, and bid updates are simulated in the browser. This prototype does not use WebSockets, does not connect multiple customers, and does not process real payments or reservations.</Notice>
  </div>;
}
