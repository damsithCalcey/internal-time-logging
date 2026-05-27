// Daily log — 3 variations: Table, Card list, Timeline.

const DAILY_ENTRIES = [
  { id: 1, project: PROJECTS[0], task: 'Map redesign',         hours: 2.5, status: 'approved',  notes: 'Implemented cluster pin marker with hover affordance. Reviewed with Anika.' },
  { id: 2, project: PROJECTS[0], task: 'Bookings API',         hours: 1.5, status: 'submitted', notes: 'PR #1242 — idempotency key on POST /bookings.' },
  { id: 3, project: PROJECTS[2], task: 'Identity service',     hours: 2.0, status: 'submitted', notes: 'Pair with Sahani on OIDC discovery doc edge cases.' },
  { id: 4, project: PROJECTS[4], task: 'Estimation review',    hours: 0.5, status: 'draft',     notes: 'Reviewed Q3 estimates with RJ. Notes in Notion.' },
  { id: 5, project: PROJECTS[1], task: 'A/B framework',        hours: 1.0, status: 'rejected',  notes: 'Touched Nelly briefly — flag this with RJ; project not assigned.' },
  { id: 6, project: PROJECTS[0], task: 'Stripe migration',     hours: 0.5, status: 'amended',   notes: 'Cleanup of stale webhook secrets in staging.' },
];

const DailyHeader = ({ totalH = 8.0 }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
    gap: 16, marginBottom: 24,
  }}>
    <div className="card" style={{
      padding: '20px 24px',
      background: 'var(--ink-1000)',
      color: '#fff', border: 'none',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div className="a-overline" style={{ color: 'rgba(255,255,255,0.5)' }}>Tuesday · May 19</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: 56, letterSpacing: '-0.03em', lineHeight: 0.95,
          color: 'var(--tropical-magenta)',
          fontVariantNumeric: 'tabular-nums',
        }}>{totalH.toFixed(1)}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>/ 24h</div>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
        16 hours of budget remaining today
      </div>
    </div>
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="a-overline">Approved</div>
      <Hours h="2.5" big />
      <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>1 entry · Upflex</div>
    </div>
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="a-overline">Submitted</div>
      <Hours h="3.5" big />
      <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>2 entries · awaiting RJ</div>
    </div>
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="a-overline">Drafts</div>
      <Hours h="0.5" big />
      <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>1 entry · submit by 5pm</div>
    </div>
  </div>
);

const DayToolbar = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 10px 6px 6px', background: '#fff',
      border: '1px solid var(--ink-200)', borderRadius: 999,
    }}>
      <button className="icon-btn" style={{ width: 28, height: 28, borderRadius: 999, border: 'none' }}>
        <Icon name="chevron-left" size={14} />
      </button>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
        Tue 19 May 2026
      </div>
      <button className="icon-btn" style={{ width: 28, height: 28, borderRadius: 999, border: 'none' }}>
        <Icon name="chevron-right" size={14} />
      </button>
    </div>
    <button className="btn btn-soft btn-sm">
      <Icon name="calendar" size={12} />
      Today
    </button>
    <div style={{ flex: 1 }} />
    <button className="btn btn-ghost btn-sm">
      <Icon name="upload" size={12} />
      Submit all drafts
    </button>
    <button className="btn btn-primary btn-sm">
      <Icon name="plus" size={12} />
      Log time
    </button>
  </div>
);

window.DAILY_ENTRIES = DAILY_ENTRIES;
window.DailyHeader = DailyHeader;
window.DayToolbar = DayToolbar;
