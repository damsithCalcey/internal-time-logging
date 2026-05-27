// Daily log — 3 variations sharing the same data.

// Variation A — Table
const DailyLogTable = () => (
  <div className="app">
    <Sidebar active="daily" />
    <div className="main">
      <Topbar title="Daily log" meta="EMPLOYEE · TUE 19 MAY">
        <button className="btn btn-soft btn-sm">
          <Icon name="play" size={12} />Start timer
        </button>
      </Topbar>
      <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <DailyHeader totalH={8.0} />
        <DayToolbar />
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '34%' }}>Project · task</th>
                <th style={{ width: '90px' }}>Hours</th>
                <th>Notes</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '90px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {DAILY_ENTRIES.map(e => (
                <tr key={e.id} className={e.id === 4 ? 'hl' : ''}>
                  <td><ProjectChip project={e.project} task={e.task} /></td>
                  <td><Hours h={e.hours.toFixed(1)} /></td>
                  <td style={{ color: 'var(--ink-600)', fontSize: 13, maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</td>
                  <td><StatusPill status={e.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      <div className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="edit-2" size={13} /></div>
                      <div className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="more-horizontal" size={13} /></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--ink-50)' }}>
                <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--ink-700)' }}>Day total</td>
                <td><Hours h="8.0" big /></td>
                <td colSpan={3} style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                  6 entries · within daily 24h cap
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// Variation B — Card list, rich notes inline
const DailyLogCards = () => (
  <div className="app">
    <Sidebar active="daily" />
    <div className="main">
      <Topbar title="Daily log" meta="EMPLOYEE · TUE 19 MAY" />
      <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <DailyHeader totalH={8.0} />
        <DayToolbar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {DAILY_ENTRIES.slice(0, 4).map(e => (
            <div key={e.id} className="card" style={{
              padding: '18px 22px',
              display: 'grid', gridTemplateColumns: '6px 1fr auto', gap: 18,
              alignItems: 'center', overflow: 'hidden',
            }}>
              <div style={{ width: 6, alignSelf: 'stretch', background: e.project.color, borderRadius: 3 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="a-h4">{e.project.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-400)' }}>·</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14, color: 'var(--ink-700)' }}>{e.task}</span>
                  <StatusPill status={e.status} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-600)', maxWidth: '64ch' }}>{e.notes}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <Hours h={e.hours.toFixed(1)} big />
                <div style={{ display: 'flex', gap: 4 }}>
                  <div className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="edit-2" size={13} /></div>
                  <div className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="more-horizontal" size={13} /></div>
                </div>
              </div>
            </div>
          ))}
          <div style={{
            padding: '14px 22px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--ink-100)',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--ink-300)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--ink-600)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-1000)' }}>2 more entries</span> · 1 rejected, 1 amended
            </div>
            <button className="btn btn-soft btn-sm">Show all</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Variation C — Timeline (vertical, time-of-day-less but rhythmic)
const DailyLogTimeline = () => {
  // arrange entries with a virtual rail
  const entries = DAILY_ENTRIES;
  return (
    <div className="app">
      <Sidebar active="daily" />
      <div className="main">
        <Topbar title="Daily log" meta="EMPLOYEE · TUE 19 MAY" />
        <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <DailyHeader totalH={8.0} />
          <DayToolbar />
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, overflow: 'hidden' }}>
            {/* Left: day visualization */}
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div className="a-overline">Day at a glance</div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-600)' }}>
                  Mostly Upflex today, with a chunk of pairing on PayPal in the afternoon.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
                {[1.0, 1.5, 2.0, 0.5, 0.5, 2.5, 0, 0].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                    <div style={{
                      width: '100%', height: `${(h/2.5)*100}%`, minHeight: 4,
                      background: h > 0 ? PROJECTS[i % 4].color : 'var(--ink-100)',
                      borderRadius: 6, opacity: h > 0 ? 1 : 0.4,
                    }} />
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-500)' }}>
                      {9 + i}{i < 3 ? 'a' : 'p'}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--ink-100)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {PROJECTS.slice(0, 4).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                    <span style={{ flex: 1, color: 'var(--ink-800)' }}>{p.name}</span>
                    <Hours h={(Math.random() * 3 + 0.5).toFixed(1)} />
                  </div>
                ))}
              </div>
            </div>
            {/* Right: timeline */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 8, bottom: 8, left: 18,
                width: 2, background: 'var(--ink-200)',
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {entries.map(e => (
                  <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '38px 1fr', gap: 0, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 999,
                      background: '#fff', border: `2px solid ${e.project.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                      color: e.project.color, letterSpacing: '0.04em',
                      flex: '0 0 38px',
                    }}>{e.project.code}</div>
                    <div className="card" style={{
                      padding: '12px 16px', marginLeft: 14,
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="a-h4">{e.project.name}</span>
                          <span style={{ color: 'var(--ink-400)' }}>·</span>
                          <span style={{ fontSize: 13, color: 'var(--ink-700)', fontWeight: 500 }}>{e.task}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</div>
                      </div>
                      <Hours h={e.hours.toFixed(1)} big />
                      <StatusPill status={e.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DailyLogTable, DailyLogCards, DailyLogTimeline });
