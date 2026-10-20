import React, { useEffect, useState } from 'react';
import { CalendarDays, ChefHat, Clock3, Coffee, Moon, ShieldCheck, UserRound, Utensils } from 'lucide-react';

const COPY = {
  admin: {
    venue: 'GREEN ROOM BISTRO · KITCHEN DASHBOARD',
    badge: 'Restaurant admin',
    icon: ShieldCheck,
    text: 'Plan today’s preparation, protect stock value, and keep waste under control with a connected view of demand and inventory risk.',
  },
  user: {
    venue: 'GREEN ROOM BISTRO · SURPLUS MARKET',
    badge: 'Registered guest',
    icon: UserRound,
    text: 'Freshly prepared surplus from the kitchen, offered at a better price. Browse the listings and place your bid before the window closes.',
  },
};

// The part of the restaurant day, used for the greeting and the service label.
function serviceFor(date) {
  const hour = date.getHours();
  if (hour < 11) return { greeting: 'Good morning', label: 'Breakfast service', icon: Coffee };
  if (hour < 16) return { greeting: 'Good afternoon', label: 'Lunch service', icon: Utensils };
  if (hour < 21) return { greeting: 'Good evening', label: 'Dinner service', icon: Utensils };
  return { greeting: 'Good evening', label: 'Late service', icon: Moon };
}

function ServingArt() {
  return <svg className="welcome-art" viewBox="0 0 240 150" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M62 38c0-8 6-10 6-18M80 40c0-8 6-10 6-18M98 38c0-8 6-10 6-18" opacity=".5" />
      <path d="M44 112c0-38 30-62 76-62s76 24 76 62z" />
      <circle cx="120" cy="44" r="6" />
      <path d="M62 112c2-22 14-38 30-46" opacity=".5" />
      <path d="M28 122h184" />
      <path d="M40 134h160" opacity=".5" />
      <path d="M12 60v32M7 60v12a5 5 0 0 0 10 0V60M12 92v34" />
      <path d="M226 60c-7 8-9 20-9 32h9v34M226 60v32" />
    </g>
    <g fill="currentColor" opacity=".18">
      <ellipse cx="120" cy="122" rx="92" ry="4" />
      <path d="M170 30c10-2 18 4 20 14-10 2-18-4-20-14z" />
      <path d="M184 52c8-4 17-1 21 7-9 4-18 1-21-7z" />
    </g>
  </svg>;
}

export default function WelcomeBanner({ user, section }) {
  const [now, setNow] = useState(() => new Date());
  const SectionIcon = section.icon;
  const copy = COPY[user.role] || COPY.user;
  const RoleIcon = copy.icon;
  const service = serviceFor(now);
  const ServiceIcon = service.icon;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="welcome-banner" aria-label="Welcome">
    <ServingArt />

    <div className="welcome-main">
      <div className="welcome-eyebrow"><span className="welcome-icon"><ChefHat size={16} /></span> {copy.venue}</div>
      <h2>{service.greeting}, {user.full_name.split(' ')[0]} <span aria-hidden="true">✦</span></h2>
      <p>{copy.text}</p>
      <div className="welcome-chips">
        <span className="welcome-chip role"><RoleIcon size={13} /> {copy.badge}</span>
        <span className="welcome-chip service"><ServiceIcon size={13} /> {service.label}</span>
        <span className="welcome-chip"><SectionIcon size={13} /> {section.label}</span>
      </div>
    </div>

    <div className="welcome-date-card">
      <div className="welcome-date-top"><CalendarDays size={14} /> {now.toLocaleDateString('en-LK', { weekday: 'long' })}</div>
      <strong>{now.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
      <div className="welcome-date-time"><Clock3 size={13} /> {now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
    </div>
  </section>;
}
