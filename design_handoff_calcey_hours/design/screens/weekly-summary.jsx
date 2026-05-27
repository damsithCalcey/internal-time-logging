// Weekly summary — 3 variations: table grid, heatmap, stacked bar
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_DATES = ['18', '19', '20', '21', '22', '23', '24'];

// (project) × (day) matrix of hours
const WEEK_MATRIX = [
  { project: PROJECTS[0], cells: [3.0, 4.0, 2.5, 5.0, 4.0, 0,   0  ] }, // Upflex
  { project: PROJECTS[2], cells: [2.0, 2.0, 3.5, 1.5, 2.0, 0,   0  ] }, // PayPal
  { project: PROJECTS[1], cells: [1.5, 0.5, 1.0, 1.0, 0.5, 0,   0  ] }, // Nelly
  { project: PROJECTS[4], cells: [1.0, 0.5, 1.0, 0,   0.5, 0,   0  ] }, // Internal
];

const weekColTotal = (i) => WEEK_MATRIX.reduce((s, r) => s + r.cells[i], 0);
const weekRowTotal = (r) => r.cells.reduce((s, n) => s + n, 0);
const weekGrandTotal = () => WEEK_MATRIX.reduce((s, r) => s + weekRowTotal(r), 0);

const WeeklyHeader = ({ groupBy = 'project', setGroupBy }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 10px 6px 6px', background: '#fff',
      border: '1px solid var(--ink-200)', borderRadius: 999,
    }}>
      <button className="icon-btn" style={{ width: 28, height: 28, borderRadius: 999, border: 'none' }}>
        <Icon name="chevron-left" size={14} />
      </button>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
        Week 21 · 18–24 May 2026
      </div>
      <button className="icon-btn" style={{ width: 28, height: 28, borderRadius: 999, border: 'none' }}>
        <Icon name="chevron-right" size={14} />
      </button>
    </div>
    <button className="btn btn-soft btn-sm">This week</button>
    <div style={{ flex: 1 }} />
    <div style={{
      display: 'inline-flex', padding: 3, background: 'var(--ink-100)', borderRadius: 999,
      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5,
    }}>
      {['project', 'task'].map(g => (
        <span key={g} style={{
          padding: '6px 14px', borderRadius: 999,
          background: groupBy === g ? '#fff' : 'transparent',
          color: groupBy === g ? 'var(--ink-1000)' : 'var(--ink-600)',
          boxShadow: groupBy === g ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          textTransform: 'capitalize',
        }}>by {g}</span>
      ))}
    </div>
  </div>
);

const WeeklyStats = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
    {[
      { label: 'Week total',     value: weekGrandTotal().toFixed(1), suffix: 'h', accent: true },
      { label: 'Avg per workday', value: (weekGrandTotal()/5).toFixed(1), suffix: 'h' },
      { label: 'Top project',    value: 'Upflex', suffix: '· 18.5h', text: true },
      { label: 'Submitted',      value: '21 / 22', suffix: 'entries', text: true },
    ].map((s, i) => (
      <div key={i} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="a-overline">{s.label}</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: s.text ? 24 : 38, letterSpacing: '-0.02em', lineHeight: 1.05,
          color: s.accent ? 'var(--tropical-magenta)' : 'var(--ink-1000)',
          fontVariantNumeric: 'tabular-nums',
        }}>{s.value}
          <span style={{ fontSize: 13, color: 'var(--ink-500)', fontWeight: 600, marginLeft: 4 }}>{s.suffix}</span>
        </div>
      </div>
    ))}
  </div>
);

// Variation A — Table grid (canonical)
const WeeklyTable = () => (
  <div className="app">
    <Sidebar active="weekly" />
    <div className="main">
      <Topbar title="Weekly summary" meta="EMPLOYEE · WEEK 21" />
      <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <WeeklyHeader groupBy="project" />
        <WeeklyStats />
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Project</th>
                {WEEK_DAYS.map((d, i) => (
                  <th key={d} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <span>{d}</span>
                      <span style={{ color: 'var(--ink-400)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{WEEK_DATES[i]}</span>
                    </div>
                  </th>
                ))}
                <th style={{ textAlign: 'right' }}>Week</th>
              </tr>
            </thead>
            <tbody>
              {WEEK_MATRIX.map(row => (
                <tr key={row.project.id}>
                  <td><ProjectChip project={row.project} /></td>
                  {row.cells.map((h, i) => (
                    <td key={i} style={{ textAlign: 'right', color: h === 0 ? 'var(--ink-300)' : 'var(--ink-900)', fontWeight: h > 0 ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>
                      {h === 0 ? '—' : h.toFixed(1)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right' }}><Hours h={weekRowTotal(row).toFixed(1)} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--ink-50)' }}>
                <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>Day total</td>
                {WEEK_DAYS.map((_, i) => (
                  <td key={i} style={{ textAlign: 'right' }}>
                    <Hours h={weekColTotal(i).toFixed(1)} />
                  </td>
                ))}
                <td style={{ textAlign: 'right' }}><Hours h={weekGrandTotal().toFixed(1)} big /></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// Variation B — Heatmap-grid
const WeeklyHeatmap = () => {
  const max = 5;
  const heatColor = (h) => {
    if (h === 0) return 'var(--ink-50)';
    const t = h / max;
    // interpolate magenta-100 → tropical-magenta
    const alpha = 0.15 + t * 0.85;
    return `rgba(173, 26, 172, ${alpha})`;
  };
  return (
    <div className="app">
      <Sidebar active="weekly" />
      <div className="main">
        <Topbar title="Weekly summary" meta="EMPLOYEE · WEEK 21 · HEATMAP" />
        <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <WeeklyHeader groupBy="project" />
          <WeeklyStats />
          <div className="card card-pad">
            <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(7, 1fr) 80px', gap: 8, alignItems: 'center' }}>
              <div />
              {WEEK_DAYS.map((d, i) => (
                <div key={d} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{d}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)' }}>{WEEK_DATES[i]}</div>
                </div>
              ))}
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)', letterSpacing: '0.06em' }}>WEEK</div>

              {WEEK_MATRIX.map(row => (
                <React.Fragment key={row.project.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: row.project.color }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5 }}>{row.project.name}</span>
                  </div>
                  {row.cells.map((h, i) => (
                    <div key={i} className="heat-cell" style={{
                      background: heatColor(h),
                      color: h > 2.5 ? '#fff' : 'var(--ink-700)',
                      border: h === 0 ? '1px dashed var(--ink-200)' : 'none',
                    }}>
                      {h > 0 ? h.toFixed(1) : ''}
                    </div>
                  ))}
                  <div style={{ textAlign: 'right' }}><Hours h={weekRowTotal(row).toFixed(1)} big /></div>
                </React.Fragment>
              ))}

              {/* Day total */}
              <div style={{
                paddingTop: 12, marginTop: 6, borderTop: '1px solid var(--ink-200)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--ink-700)',
                gridColumn: '1 / 2',
              }}>Day total</div>
              {WEEK_DAYS.map((_, i) => (
                <div key={i} style={{
                  textAlign: 'center', paddingTop: 12, marginTop: 6, borderTop: '1px solid var(--ink-200)',
                }}>
                  <Hours h={weekColTotal(i).toFixed(1)} />
                </div>
              ))}
              <div style={{
                textAlign: 'right', paddingTop: 12, marginTop: 6, borderTop: '1px solid var(--ink-200)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22,
                  color: 'var(--tropical-magenta)', letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>{weekGrandTotal().toFixed(1)}<span style={{ color: 'var(--ink-500)', fontSize: 14, fontWeight: 600 }}>h</span></span>
              </div>
            </div>

            {/* legend */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)' }}>
              <span>LIGHT DAY</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0.5, 1.5, 2.5, 3.5, 4.5].map(h => (
                  <div key={h} style={{ width: 24, height: 12, borderRadius: 3, background: heatColor(h) }} />
                ))}
              </div>
              <span>FULL DAY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Variation C — Stacked bar chart
const WeeklyStacked = () => {
  const maxDay = Math.max(...WEEK_DAYS.map((_, i) => weekColTotal(i))) || 1;
  return (
    <div className="app">
      <Sidebar active="weekly" />
      <div className="main">
        <Topbar title="Weekly summary" meta="EMPLOYEE · WEEK 21 · STACKED" />
        <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <WeeklyHeader groupBy="project" />
          <WeeklyStats />
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 200px', gap: 20, alignItems: 'flex-end', height: 280 }}>
              {/* Y-axis */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-400)', alignItems: 'flex-end', paddingRight: 6 }}>
                <span>10h</span><span>8h</span><span>6h</span><span>4h</span><span>2h</span><span>0</span>
              </div>
              {/* Bars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14, alignItems: 'flex-end', height: '100%', borderBottom: '1px solid var(--ink-200)', position: 'relative' }}>
                {/* gridlines */}
                {[0.2, 0.4, 0.6, 0.8].map(g => (
                  <div key={g} style={{ position: 'absolute', left: 0, right: 0, bottom: `${g*100}%`, height: 1, background: 'var(--ink-100)' }} />
                ))}
                {WEEK_DAYS.map((d, i) => {
                  const total = weekColTotal(i);
                  return (
                    <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6, position: 'relative' }}>
                      {total > 0 && (
                        <div style={{
                          position: 'absolute', bottom: `calc(${(total/10)*100}% + 6px)`,
                          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11.5,
                          color: 'var(--ink-700)', fontVariantNumeric: 'tabular-nums',
                        }}>{total.toFixed(1)}</div>
                      )}
                      <div style={{ width: '70%', maxWidth: 50, height: `${(total/10)*100}%`, display: 'flex', flexDirection: 'column-reverse', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                        {WEEK_MATRIX.map(row => row.cells[i] > 0 && (
                          <div key={row.project.id} style={{
                            background: row.project.color,
                            height: `${(row.cells[i]/total)*100}%`,
                            opacity: 0.92,
                          }} />
                        ))}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
                        color: total === 0 ? 'var(--ink-400)' : 'var(--ink-700)',
                      }}>{d}</div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', justifyContent: 'flex-end', paddingBottom: 24 }}>
                <div className="a-overline">By project</div>
                {WEEK_MATRIX.map(row => (
                  <div key={row.project.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 4, background: row.project.color }} />
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-800)' }}>{row.project.name}</span>
                    <Hours h={weekRowTotal(row).toFixed(1)} />
                  </div>
                ))}
                <div style={{
                  marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--ink-200)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                }}>
                  <span className="a-overline">Total</span>
                  <Hours h={weekGrandTotal().toFixed(1)} big />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { WeeklyTable, WeeklyHeatmap, WeeklyStacked });
