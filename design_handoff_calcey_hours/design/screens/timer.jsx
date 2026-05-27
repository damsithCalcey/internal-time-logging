// Timer is now app-wide, surfaced via a FAB → mini-player morph in the
// bottom-right corner. No dedicated nav item; the daily log is the canvas.

const TimerCommon = () => (
  <>
    <DailyHeader totalH={6.5} />
    <DayToolbar />
    <div className="card" style={{ overflow: 'hidden' }}>
      <table className="tbl">
        <thead><tr>
          <th style={{ width: '40%' }}>Project · task</th>
          <th style={{ width: '90px' }}>Hours</th>
          <th>Notes</th>
          <th style={{ width: '120px' }}>Status</th>
        </tr></thead>
        <tbody>
          {DAILY_ENTRIES.slice(0, 4).map(e => (
            <tr key={e.id}>
              <td><ProjectChip project={e.project} task={e.task} /></td>
              <td><Hours h={e.hours.toFixed(1)} /></td>
              <td style={{ color: 'var(--ink-600)', fontSize: 13, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</td>
              <td><StatusPill status={e.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

// State A — Idle. FAB visible bottom-right.
const TimerIdleFAB = () => (
  <div className="app" style={{ position: 'relative' }}>
    <Sidebar active="daily" />
    <div className="main">
      <Topbar title="Daily log" meta="EMPLOYEE · TUE 19 MAY" />
      <div style={{ padding: '24px 28px 0', overflow: 'hidden' }}>
        <TimerCommon />
      </div>
    </div>
    <div style={{ position: 'absolute', right: 28, bottom: 28, zIndex: 20 }}>
      <TimerFab />
    </div>
  </div>
);

// State B — Picker open. FAB tapped, popover above.
const TimerPickerOpen = () => (
  <div className="app" style={{ position: 'relative' }}>
    <Sidebar active="daily" />
    <div className="main">
      <Topbar title="Daily log" meta="EMPLOYEE · TUE 19 MAY" />
      <div style={{ padding: '24px 28px 0', overflow: 'hidden' }}>
        <TimerCommon />
      </div>
    </div>
    {/* Scrim — subtle, just enough to push focus onto the picker */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(11,11,18,0.18)',
      zIndex: 15,
    }} />
    <div style={{
      position: 'absolute', right: 28, bottom: 96, zIndex: 25,
    }}>
      <StartTimerPicker />
    </div>
    <div style={{ position: 'absolute', right: 28, bottom: 28, zIndex: 25 }}>
      <TimerFab />
    </div>
  </div>
);

// State C — Running. Mini player visible.
const TimerRunningMini = () => (
  <div className="app" style={{ position: 'relative' }}>
    <Sidebar active="daily" />
    <div className="main">
      <Topbar title="Daily log" meta="EMPLOYEE · TUE 19 MAY" />
      <div style={{ padding: '24px 28px 0', overflow: 'hidden' }}>
        <TimerCommon />
      </div>
    </div>
    <div style={{ position: 'absolute', right: 28, bottom: 28, zIndex: 20 }}>
      <MiniPlayer />
    </div>
  </div>
);

// State D — Stop-pending-save modal
const TimerStopModal = () => (
  <div className="app" style={{ position: 'relative' }}>
    <Sidebar active="daily" />
    <div className="main">
      <Topbar title="Daily log" meta="STOPPED · PENDING SAVE" />
      <div style={{ padding: '24px 28px 0', overflow: 'hidden', filter: 'blur(2px) brightness(0.96)' }}>
        <TimerCommon />
      </div>
    </div>
    {/* Scrim */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(11,11,18,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 520, background: '#fff',
        borderRadius: 'var(--radius-2xl)', padding: 32,
        boxShadow: 'var(--shadow-xl)',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="a-overline">Timer stopped</div>
          <Icon name="x" size={16} color="var(--ink-500)" />
        </div>
        <h2 className="a-h2">You worked 1h 42m on Upflex.</h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-600)', margin: 0, lineHeight: 1.5 }}>
          We rounded that to the nearest half-hour. Adjust hours or notes before saving, or discard if it was a mis-start.
        </p>
        <div style={{
          padding: 18, borderRadius: 16,
          background: 'var(--ink-50)',
          display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: PROJECTS[0].color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
            UPF
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Upflex · Map redesign</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)' }}>
              EXACT 1.70 h · ROUNDED TO 1.5 h
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="minus" size={12} /></button>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
              fontVariantNumeric: 'tabular-nums', minWidth: 50, textAlign: 'center',
            }}>1.5</div>
            <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="plus" size={12} /></button>
          </div>
        </div>
        <textarea className="field-input" placeholder="What did you get done? (optional)" style={{ minHeight: 80, resize: 'none' }} defaultValue="Cluster pin marker; hover affordance review with Anika." />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <button className="btn btn-ghost btn-sm">Discard timer</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-soft">Save as draft</button>
            <button className="btn btn-primary">
              Save &amp; submit
              <Icon name="arrow-right" size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { TimerIdleFAB, TimerPickerOpen, TimerRunningMini, TimerStopModal });
