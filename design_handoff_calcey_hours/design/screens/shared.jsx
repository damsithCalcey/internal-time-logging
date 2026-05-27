// Shared chrome + helpers for all artboards.
// Everything lives on window so other Babel files can read it.

const Icon = ({ name, size = 16, color, style }) => (
  <i data-feather={name} style={{ width: size, height: size, color, ...style }} />
);

// ---- mock data ----
const TEAM = {
  me: { id: 'u1', name: 'Dilani Perera', role: 'Senior Engineer', initials: 'DP', avatar: 'pink' },
  manager: { id: 'u2', name: 'Ruwan Jayasekera', role: 'Engineering Manager', initials: 'RJ', avatar: 'ink' },
  peers: [
    { id: 'u3', name: 'Tharindu Silva', role: 'Frontend Engineer', initials: 'TS', avatar: 'sky' },
    { id: 'u4', name: 'Anika Fernando', role: 'Product Designer', initials: 'AF', avatar: 'pink' },
    { id: 'u5', name: 'Kavindu Bandara', role: 'QA Engineer', initials: 'KB', avatar: 'ink' },
    { id: 'u6', name: 'Sahani Wickramaratne', role: 'Backend Engineer', initials: 'SW', avatar: 'sky' },
    { id: 'u7', name: 'Nuwan Gunawardena', role: 'DevOps', initials: 'NG', avatar: 'pink' },
  ],
};

const PROJECTS = [
  { id: 'p1', name: 'Upflex', color: 'var(--tropical-magenta)', code: 'UPF', tasks: ['Bookings API', 'Map redesign', 'iOS refresh', 'Stripe migration'] },
  { id: 'p2', name: 'Nelly Fashion', color: 'var(--paradise-pink)', code: 'NEL', tasks: ['Checkout flow', 'PIM integration', 'Localization (DE)', 'A/B framework'] },
  { id: 'p3', name: 'PayPal · Mosaic', color: 'var(--kingfisher-blue)', code: 'PYP', tasks: ['Identity service', 'Risk dashboard', 'Webhook reliability'] },
  { id: 'p4', name: 'Fresh Fitness Food', color: 'var(--sky-blue)', code: 'FFF', tasks: ['Macro engine', 'Subscription portal'] },
  { id: 'p5', name: 'Internal · Hours', color: 'var(--ink-700)', code: 'INT', tasks: ['Calcey Hours rollout', 'Estimation review'] },
];

// ---- App-shell components (desktop) ----
const Sidebar = ({ active = 'daily', role = 'employee', timerRunning = false, timer }) => {
  const employeeItems = [
    { id: 'daily',   label: 'Daily log',     icon: 'calendar' },
    { id: 'weekly',  label: 'Weekly summary', icon: 'bar-chart-2' },
    { id: 'history', label: 'My entries',    icon: 'list' },
  ];
  const managerItems = [
    { id: 'approvals', label: 'Approval queue', icon: 'inbox', badge: 12 },
    { id: 'projects',  label: 'Projects',       icon: 'folder' },
    { id: 'team',      label: 'Team',           icon: 'users' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">c</div>
        <div className="sidebar-brand-name">Calcey Hours<span className="dot">.</span></div>
      </div>

      <div>
        <div className="sidebar-section-label">Log time</div>
        <nav className="nav-list">
          {employeeItems.map(it => (
            <div key={it.id} className={`nav-item ${active === it.id ? 'active' : ''}`}>
              <Icon name={it.icon} size={18} />
              <span>{it.label}</span>
              {it.badge && <span className="badge">{it.badge}</span>}
            </div>
          ))}
        </nav>
      </div>

      {role === 'manager' && (
        <div>
          <div className="sidebar-section-label">Manage</div>
          <nav className="nav-list">
            {managerItems.map(it => (
              <div key={it.id} className={`nav-item ${active === it.id ? 'active' : ''}`}>
                <Icon name={it.icon} size={18} />
                <span>{it.label}</span>
                {it.badge && <span className="badge">{it.badge}</span>}
              </div>
            ))}
          </nav>
        </div>
      )}

      <div className="sidebar-spacer" />

      {timerRunning && timer && (
        <div style={{
          padding: '14px 12px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(173,26,172,0.22), rgba(223,70,97,0.18))',
          border: '1px solid rgba(173,26,172,0.4)',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999,
              background: 'var(--tropical-magenta)',
              boxShadow: '0 0 0 4px rgba(173,26,172,0.25)',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)',
            }}>Timer running</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 28, color: '#fff', letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}>{timer?.elapsed || '01:42:18'}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            {timer?.project || 'Upflex'} · {timer?.task || 'Bookings API'}
          </div>
          <button className="btn btn-sm" style={{
            background: 'rgba(255,255,255,0.92)', color: 'var(--ink-1000)', justifyContent: 'center',
          }}>
            <Icon name="square" size={11} />
            <span>Stop timer</span>
          </button>
        </div>
      )}

      <div className="sidebar-user">
        <div className={`avatar ${role === 'manager' ? 'ink' : 'pink'}`}>
          {role === 'manager' ? TEAM.manager.initials : TEAM.me.initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="sidebar-user-name" style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {role === 'manager' ? TEAM.manager.name : TEAM.me.name}
          </div>
          <div className="sidebar-user-role">{role === 'manager' ? 'Manager' : 'Employee'}</div>
        </div>
        <Icon name="more-vertical" size={14} color="rgba(255,255,255,0.5)" />
      </div>
    </aside>
  );
};

const Topbar = ({ title, meta, children }) => (
  <div className="topbar">
    <div>
      <div className="topbar-title">{title}</div>
      {meta && <div className="topbar-meta">{meta}</div>}
    </div>
    <div className="topbar-right">
      {children}
      <div className="icon-btn"><Icon name="search" size={15} /></div>
      <div className="icon-btn"><Icon name="bell" size={15} /></div>
    </div>
  </div>
);

// Project chip (dot + name) used everywhere
const ProjectChip = ({ project, task }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
    <span style={{
      width: 8, height: 8, borderRadius: 999, background: project.color, flex: '0 0 auto',
    }} />
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5,
        color: 'var(--ink-1000)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{project.name}</div>
      {task && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5,
          color: 'var(--ink-500)', letterSpacing: '0.04em',
        }}>{task}</div>
      )}
    </div>
  </div>
);

const StatusPill = ({ status }) => {
  const map = {
    draft:     { c: 'pill-draft',     l: 'Draft' },
    submitted: { c: 'pill-submitted', l: 'Submitted' },
    approved:  { c: 'pill-approved',  l: 'Approved' },
    rejected:  { c: 'pill-rejected',  l: 'Rejected' },
    amended:   { c: 'pill-amended',   l: 'Amended' },
  };
  const m = map[status] || map.draft;
  return (
    <span className={`pill ${m.c}`}>
      <span className="dot" />
      {m.l}
    </span>
  );
};

// Hours number with the trailing "h" small
const Hours = ({ h, big = false }) => (
  <span style={{
    fontFamily: 'var(--font-display)',
    fontWeight: big ? 800 : 700,
    fontSize: big ? 22 : 14,
    letterSpacing: big ? '-0.02em' : '-0.01em',
    color: 'var(--ink-1000)',
    fontVariantNumeric: 'tabular-nums',
  }}>
    {h}<span style={{
      fontSize: big ? 14 : 11, color: 'var(--ink-500)',
      fontWeight: 600, marginLeft: 2,
    }}>h</span>
  </span>
);

// Photo placeholder block (color)
const PhotoBlock = ({ tone = 'magenta', label, height = 80 }) => {
  const tones = {
    magenta:    'linear-gradient(135deg, var(--magenta-400), var(--magenta-800))',
    pink:       'linear-gradient(135deg, var(--paradise-pink), var(--magenta-600))',
    sky:        'linear-gradient(135deg, var(--sky-blue), var(--kingfisher-blue))',
    kingfisher: 'linear-gradient(135deg, var(--kingfisher-blue), var(--kingfisher-800))',
    ink:        'linear-gradient(135deg, var(--ink-700), var(--ink-1000))',
  };
  return (
    <div style={{
      height, borderRadius: 14, background: tones[tone] || tones.magenta,
      display: 'flex', alignItems: 'flex-end', padding: 14, color: '#fff',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
      letterSpacing: '-0.02em',
    }}>{label}</div>
  );
};

// Tiny inline bar / progress
const Bar = ({ pct, color = 'var(--tropical-magenta)', height = 6 }) => (
  <div style={{ background: 'var(--ink-100)', borderRadius: 999, height, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 999 }} />
  </div>
);

// ---- App-wide timer surface ----------------------------------------
// Two morphing states pinned to the bottom-right corner of the app:
//   TimerFab     — idle. Click to open the picker.
//   MiniPlayer   — running. Pause + stop.
// StartTimerPicker is the popover that opens above the FAB on click.

const TimerFab = ({ style }) => (
  <button title="Start timer" style={{
    height: 56, padding: '0 22px 0 18px', borderRadius: 999,
    background: 'var(--tropical-magenta)', color: '#fff', border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 10,
    boxShadow: '0 18px 40px rgba(173,26,172,0.36), 0 4px 10px rgba(11,11,18,0.10)',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em',
    ...style,
  }}>
    <span style={{
      width: 30, height: 30, borderRadius: 999, background: 'rgba(255,255,255,0.18)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name="play" size={14} fill="#fff" />
    </span>
    Start timer
  </button>
);

const StartTimerPicker = ({ style }) => (
  <div style={{
    width: 360, background: '#fff',
    borderRadius: 20, border: '1px solid var(--ink-200)',
    boxShadow: '0 24px 64px rgba(11,11,18,0.20), 0 6px 16px rgba(11,11,18,0.06)',
    padding: 18,
    display: 'flex', flexDirection: 'column', gap: 14,
    ...style,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--tropical-magenta)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-600)' }}>
          New timer
        </span>
      </div>
      <Icon name="x" size={14} color="var(--ink-500)" />
    </div>
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--ink-700)', marginBottom: 6 }}>Project</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', background: '#fff',
        border: '1px solid var(--ink-300)', borderRadius: 10,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: PROJECTS[0].color }} />
        <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Upflex</span>
        <Icon name="chevron-down" size={14} color="var(--ink-500)" />
      </div>
    </div>
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--ink-700)', marginBottom: 6 }}>Task</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', background: '#fff',
        border: '1px solid var(--ink-300)', borderRadius: 10,
      }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Map redesign</span>
        <Icon name="chevron-down" size={14} color="var(--ink-500)" />
      </div>
    </div>
    {/* Recent shortcuts */}
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--ink-500)', marginBottom: 8 }}>RECENT</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          [PROJECTS[0], 'Map redesign'],
          [PROJECTS[2], 'Identity service'],
          [PROJECTS[0], 'Bookings API'],
        ].map(([p, t], i) => (
          <button key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 8px', background: 'transparent',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            textAlign: 'left',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: p.color }} />
            <span style={{ fontSize: 12.5, fontFamily: 'var(--font-display)', fontWeight: 500 }}>{p.name}</span>
            <span style={{ color: 'var(--ink-400)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>{t}</span>
          </button>
        ))}
      </div>
    </div>
    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
      <Icon name="play" size={13} fill="#fff" />
      Start timer
    </button>
  </div>
);

const MiniPlayer = ({ style }) => (
  <div style={{
    padding: 10,
    background: '#fff',
    borderRadius: 999,
    boxShadow: '0 20px 56px rgba(11,11,18,0.18), 0 4px 14px rgba(173,26,172,0.18)',
    border: '1px solid var(--ink-200)',
    display: 'flex', alignItems: 'center', gap: 14,
    minWidth: 460,
    ...style,
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 999,
      background: PROJECTS[0].color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
      flex: '0 0 auto',
      boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.18)',
    }}>UPF</div>
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 7, height: 7, borderRadius: 999,
          background: 'var(--koha-red)',
          boxShadow: '0 0 0 3px rgba(228,0,43,0.22)',
          animation: 'tlPulse 1.6s ease-in-out infinite',
          flex: '0 0 auto',
        }} />
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24,
          letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums',
          color: 'var(--ink-1000)', lineHeight: 1,
        }}>01:42:18</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-500)',
          marginLeft: 2,
        }}>REC</span>
      </div>
      <div style={{
        fontSize: 12.5, color: 'var(--ink-600)', marginTop: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontFamily: 'var(--font-display)', fontWeight: 500,
      }}>Upflex · Map redesign</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
      <button title="Pause" style={{
        width: 42, height: 42, borderRadius: 999,
        background: 'var(--ink-100)', color: 'var(--ink-1000)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="pause" size={16} fill="currentColor" />
      </button>
      <button title="Stop &amp; save" style={{
        height: 42, padding: '0 18px 0 16px', borderRadius: 999,
        background: 'var(--ink-1000)', color: '#fff',
        border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
        boxShadow: '0 6px 18px rgba(11,11,18,0.18)',
      }}>
        <Icon name="square" size={12} fill="#fff" />
        Stop
      </button>
    </div>
  </div>
);

// keyframes — injected once
if (typeof document !== 'undefined' && !document.getElementById('tl-keyframes')) {
  const s = document.createElement('style');
  s.id = 'tl-keyframes';
  s.textContent = `
    @keyframes tlPulse {
      0%,100% { box-shadow: 0 0 0 3px rgba(228,0,43,0.22); }
      50%     { box-shadow: 0 0 0 7px rgba(228,0,43,0); }
    }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  Icon, TEAM, PROJECTS, Sidebar, Topbar, ProjectChip, StatusPill, Hours, PhotoBlock, Bar,
  TimerFab, MiniPlayer, StartTimerPicker,
});
