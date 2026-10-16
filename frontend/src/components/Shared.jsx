import React from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import { cx } from '../utils.js';

export function PageHeading({ eyebrow, title, description, actions }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, detail, icon: Icon, tone = 'green', trend }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{Icon && <Icon size={19} strokeWidth={1.8} />}</div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-detail">{trend && <span className="trend-chip"><ArrowUpRight size={13} />{trend}</span>}{detail}</div>
      </div>
    </article>
  );
}

export function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={cx('panel', className)}>
      {(title || subtitle || action) && (
        <div className="panel-heading">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action && <div className="panel-action">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Notice({ children, tone = 'info' }) {
  return <div className={`notice ${tone}`}><Info size={16} /> <span>{children}</span></div>;
}

export function EmptyState({ title, description }) {
  return <div className="empty-state"><span className="empty-dot" /><strong>{title}</strong><p>{description}</p></div>;
}

export function FlowStrip({ items }) {
  return (
    <div className="flow-strip">
      {items.map((item, index) => (
        <React.Fragment key={item}>
          <div className="flow-step"><span>{String(index + 1).padStart(2, '0')}</span>{item}</div>
          {index < items.length - 1 && <div className="flow-arrow" aria-hidden="true">→</div>}
        </React.Fragment>
      ))}
    </div>
  );
}
