// Mobile screens — iOS-feel (status bar, large titles, bottom tab bar)

const StatusBar = () => (
  <div className="mob-status">
    <span>9:41</span>
    <span className="mob-status-right">
      <Icon name="wifi" size={13} />
      <Icon name="battery" size={13} />
    </span>
  </div>
);

const TabBar = ({ active = 'home' }) => {
  const tabs = [
    { id: 'home',   label: 'Today',  icon: 'calendar' },
    { id: 'week',   label: 'Week',   icon: 'bar-chart-2' },
    { id: 'me',     label: 'Me',     icon: 'user' },
  ];
  return (
    <div className="mob-tabbar">
      {tabs.map(t => (
        <div key={t.id} className={`mob-tab ${active === t.id ? 'active' : ''}`}>
          <Icon name={t.icon} size={22} />
          <span>{t.label}</span>
        </div>
      ))}
      {/* iOS home indicator */}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 4, background: 'var(--ink-1000)', borderRadius: 999,
        opacity: 0.85,
      }} />
    </div>
  );
};

// Small magenta round FAB pinned bottom-right just above the tab bar.
const MobileFAB = () => (
  <div style={{
    position: 'absolute', bottom: 96, right: 18,
    width: 60, height: 60, borderRadius: 999,
    background: 'var(--tropical-magenta)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 14px 36px rgba(173,26,172,0.45), 0 2px 6px rgba(11,11,18,0.12)',
  }}>
    <Icon name="play" size={22} fill="#fff" />
  </div>
);

// Docked running-timer widget — sits directly above the tab bar, full-width.
const MobileMiniPlayer = ({ bottom = 76 }) => (
  <div style={{
    position: 'absolute', left: 8, right: 8, bottom,
    padding: 8,
    background: '#fff',
    border: '1px solid var(--ink-200)',
    borderRadius: 18,
    boxShadow: '0 14px 36px rgba(11,11,18,0.16)',
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 999,
      background: PROJECTS[0].color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      flex: '0 0 auto',
    }}>UPF</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: 999,
          background: 'var(--koha-red)',
          boxShadow: '0 0 0 3px rgba(228,0,43,0.22)',
          animation: 'tlPulse 1.6s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
          letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums',
        }}>01:42:18</span>
      </div>
      <div style={{
        fontSize: 11.5, color: 'var(--ink-600)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>Upflex · Map redesign</div>
    </div>
    <button style={{
      width: 36, height: 36, borderRadius: 999,
      background: 'var(--ink-100)', color: 'var(--ink-1000)',
      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flex: '0 0 auto',
    }}>
      <Icon name="pause" size={14} fill="currentColor" />
    </button>
    <button style={{
      width: 36, height: 36, borderRadius: 999,
      background: 'var(--ink-1000)', color: '#fff',
      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flex: '0 0 auto',
    }}>
      <Icon name="square" size={12} fill="#fff" />
    </button>
  </div>
);

// ----- Mobile A: Daily log (today)
const MobileDailyLog = () => (
  <div className="mob">
    <StatusBar />
    <div className="mob-topbar" style={{ borderBottom: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: 'var(--tropical-magenta)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16,
          letterSpacing: '-0.04em',
        }}>c</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>
          Hours<span style={{ color: 'var(--tropical-magenta)' }}>.</span>
        </div>
      </div>
      <div className={`avatar pink`} style={{ width: 30, height: 30, fontSize: 11 }}>DP</div>
    </div>
    <div className="mob-content" style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
      <div>
        <div className="a-mono" style={{ marginBottom: 4 }}>TUESDAY 19 MAY</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32,
          letterSpacing: '-0.025em', margin: 0, lineHeight: 1.05,
        }}>
          <span style={{ color: 'var(--tropical-magenta)' }}>8.0h</span> logged today.
        </h2>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-600)' }}>
          1 draft to submit before 5pm.
        </div>
        <div style={{ marginTop: 12 }}>
          <Bar pct={(8/24)*100} />
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)', letterSpacing: '0.04em' }}>
            16 H REMAINING IN 24 H CAP
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
        {DAILY_ENTRIES.slice(0, 4).map(e => (
          <div key={e.id} className="card" style={{
            padding: '12px 14px',
            display: 'grid', gridTemplateColumns: '4px 1fr auto', gap: 12,
            alignItems: 'center',
          }}>
            <div style={{ width: 4, alignSelf: 'stretch', background: e.project.color, borderRadius: 2 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5 }}>{e.project.name}</span>
                <span style={{ color: 'var(--ink-400)' }}>·</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.task}</span>
              </div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusPill status={e.status} />
              </div>
            </div>
            <Hours h={e.hours.toFixed(1)} big />
          </div>
        ))}
      </div>

      {/* FAB: start timer app-wide */}
      <MobileFAB />
    </div>
    <TabBar active="home" />
  </div>
);

// ----- Mobile A2: Today with timer running (docked mini player above tabs)
const MobileDailyLogRunning = () => (
  <div className="mob">
    <StatusBar />
    <div className="mob-topbar" style={{ borderBottom: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: 'var(--tropical-magenta)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16,
          letterSpacing: '-0.04em',
        }}>c</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>
          Hours<span style={{ color: 'var(--tropical-magenta)' }}>.</span>
        </div>
      </div>
      <div className={`avatar pink`} style={{ width: 30, height: 30, fontSize: 11 }}>DP</div>
    </div>
    <div className="mob-content" style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden', paddingBottom: 86 }}>
      <div>
        <div className="a-mono" style={{ marginBottom: 4 }}>TUESDAY 19 MAY</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32,
          letterSpacing: '-0.025em', margin: 0, lineHeight: 1.05,
        }}>
          <span style={{ color: 'var(--tropical-magenta)' }}>8.0h</span> logged today.
        </h2>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-600)' }}>
          Plus 1h 42m on the running timer.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
        {DAILY_ENTRIES.slice(0, 4).map(e => (
          <div key={e.id} className="card" style={{
            padding: '12px 14px',
            display: 'grid', gridTemplateColumns: '4px 1fr auto', gap: 12,
            alignItems: 'center',
          }}>
            <div style={{ width: 4, alignSelf: 'stretch', background: e.project.color, borderRadius: 2 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5 }}>{e.project.name}</span>
                <span style={{ color: 'var(--ink-400)' }}>·</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.task}</span>
              </div>
              <div style={{ marginTop: 4 }}><StatusPill status={e.status} /></div>
            </div>
            <Hours h={e.hours.toFixed(1)} big />
          </div>
        ))}
      </div>
    </div>

    {/* Docked mini player above tab bar */}
    <MobileMiniPlayer />
    <TabBar active="home" />
  </div>
);

// ----- Mobile B: Time entry (simple form, no mad-lib)
const MobileTimeEntry = () => (
  <div className="mob">
    <StatusBar />
    <div className="mob-topbar">
      <Icon name="chevron-left" size={20} color="var(--ink-1000)" />
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Log time</div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--tropical-magenta)' }}>Save</span>
    </div>
    <div className="mob-content" style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
      <div className="a-mono" style={{ letterSpacing: '0.12em' }}>NEW ENTRY · TUESDAY 19 MAY</div>

      {/* Project */}
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--ink-700)', marginBottom: 6 }}>PROJECT</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', background: '#fff',
          border: '1px solid var(--ink-200)', borderRadius: 12,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: PROJECTS[0].color }} />
          <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Upflex</span>
          <Icon name="chevron-down" size={14} color="var(--ink-500)" />
        </div>
      </div>

      {/* Task */}
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--ink-700)', marginBottom: 6 }}>TASK</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', background: '#fff',
          border: '1px solid var(--ink-200)', borderRadius: 12,
        }}>
          <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Map redesign</span>
          <Icon name="chevron-down" size={14} color="var(--ink-500)" />
        </div>
      </div>

      {/* Hours + Date row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--ink-700)', marginBottom: 6 }}>HOURS</div>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: '#fff', border: '1px solid var(--ink-200)', borderRadius: 12,
            overflow: 'hidden', height: 46,
          }}>
            <button style={{ width: 40, height: '100%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="minus" size={14} />
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>
              2.5<span style={{ fontSize: 12, color: 'var(--ink-500)', marginLeft: 2 }}>h</span>
            </div>
            <button style={{ width: 40, height: '100%', border: 'none', background: 'var(--tropical-magenta)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={14} />
            </button>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--ink-700)', marginBottom: 6 }}>DATE</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 14px', background: '#fff',
            border: '1px solid var(--ink-200)', borderRadius: 12,
            height: 46,
          }}>
            <Icon name="calendar" size={14} color="var(--ink-500)" />
            <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Today</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--ink-700)', marginBottom: 6 }}>NOTES</div>
        <div style={{
          padding: 14, background: '#fff', border: '1px solid var(--ink-200)',
          borderRadius: 12, fontSize: 13.5, color: 'var(--ink-700)', lineHeight: 1.5,
          minHeight: 84,
        }}>
          Cluster pin marker with hover affordance; reviewed accessibility against WCAG contrast notes. PR up.
        </div>
      </div>

      {/* Submit */}
      <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
        Save &amp; submit
        <Icon name="arrow-right" size={15} />
      </button>
      <button style={{
        background: 'transparent', border: 'none',
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5,
        color: 'var(--ink-600)', textAlign: 'center', padding: 4,
      }}>Save as draft</button>
    </div>
  </div>
);

// ----- Mobile C: Timer running
const MobileTimer = () => (
  <div className="mob" style={{ background: 'var(--ink-1000)', color: '#fff' }}>
    <div className="mob-status" style={{ background: 'transparent', color: '#fff' }}>
      <span>9:41</span>
      <span className="mob-status-right" style={{ color: '#fff' }}>
        <Icon name="wifi" size={13} />
        <Icon name="battery" size={13} />
      </span>
    </div>
    <div className="mob-topbar" style={{ background: 'transparent', borderBottom: 'none', color: '#fff' }}>
      <Icon name="chevron-left" size={20} />
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Timer</div>
      <Icon name="more-horizontal" size={18} />
    </div>
    <div className="mob-content" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      overflow: 'hidden', textAlign: 'center', padding: '20px 16px',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)',
      }}>RUNNING · STARTED 9:32 AM</div>

      {/* Big ring */}
      <div style={{ position: 'relative', width: 240, height: 240 }}>
        <svg viewBox="0 0 240 240" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="120" cy="120" r="108" stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" />
          <circle cx="120" cy="120" r="108" stroke="var(--tropical-magenta)" strokeWidth="14" fill="none"
            strokeDasharray="678.5" strokeDashoffset="245" strokeLinecap="round" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 44,
            letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          }}>01:42:18</div>
          <div style={{
            marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10.5,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
          }}>OF YOUR DAY · 1.7 H</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: PROJECTS[0].color }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em' }}>Upflex</span>
        </div>
        <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)' }}>Map redesign</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 'auto' }}>
        <button style={{
          width: 56, height: 56, borderRadius: 999,
          background: 'rgba(255,255,255,0.08)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="edit-2" size={18} />
        </button>
        <button style={{
          width: 84, height: 84, borderRadius: 999,
          background: '#fff', color: 'var(--ink-1000)',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 18px 48px rgba(255,255,255,0.25)',
        }}>
          <Icon name="square" size={26} fill="currentColor" />
        </button>
        <button style={{
          width: 56, height: 56, borderRadius: 999,
          background: 'rgba(255,255,255,0.08)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="pause" size={18} />
        </button>
      </div>
    </div>
    {/* Minimize affordance — tap to dock back to mini player */}
    <div style={{
      flex: '0 0 56px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      paddingBottom: 16,
    }}>
      <div style={{
        width: 44, height: 36, borderRadius: 12,
        background: 'rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.7)',
      }}>
        <Icon name="chevron-down" size={18} />
      </div>
    </div>
  </div>
);

// ----- Mobile D: Weekly summary (table-style, carries the desktop choice)
const MobileWeekly = () => (
  <div className="mob">
    <StatusBar />
    <div className="mob-topbar" style={{ borderBottom: 'none' }}>
      <Icon name="chevron-left" size={20} color="var(--ink-1000)" />
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Week 21</div>
      <Icon name="filter" size={18} color="var(--ink-700)" />
    </div>
    <div className="mob-content" style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
      <div>
        <div className="a-mono" style={{ marginBottom: 4 }}>18 — 24 MAY 2026</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 52,
            letterSpacing: '-0.03em', color: 'var(--tropical-magenta)',
            fontVariantNumeric: 'tabular-nums', lineHeight: 0.95,
          }}>{weekGrandTotal().toFixed(1)}</span>
          <span style={{ fontSize: 16, color: 'var(--ink-500)', fontWeight: 600 }}>h this week</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--ink-600)' }}>
          Avg <strong>{(weekGrandTotal()/5).toFixed(1)} h</strong> per workday · 21 of 22 entries submitted
        </div>
      </div>

      {/* Day totals row */}
      <div className="card" style={{ padding: '10px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {WEEK_DAYS.map((d, i) => {
            const total = weekColTotal(i);
            const isOff = total === 0;
            return (
              <div key={d} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '6px 0',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  color: isOff ? 'var(--ink-300)' : 'var(--ink-1000)',
                  fontVariantNumeric: 'tabular-nums',
                }}>{isOff ? '—' : total.toFixed(1)}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9.5,
                  color: 'var(--ink-500)', letterSpacing: '0.04em',
                }}>{d.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="a-mono">BY PROJECT</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {WEEK_MATRIX.map(row => (
          <div key={row.project.id} className="card" style={{
            padding: '12px 14px',
            display: 'grid', gridTemplateColumns: '4px 1fr auto', gap: 12,
            alignItems: 'center',
          }}>
            <div style={{ width: 4, alignSelf: 'stretch', background: row.project.color, borderRadius: 2 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{row.project.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-500)', marginTop: 2 }}>
                {row.cells.filter(h => h > 0).length} DAYS
              </div>
            </div>
            <Hours h={weekRowTotal(row).toFixed(1)} big />
          </div>
        ))}
      </div>
    </div>
    <TabBar active="week" />
  </div>
);

Object.assign(window, { MobileDailyLog, MobileDailyLogRunning, MobileTimeEntry, MobileTimer, MobileWeekly });
