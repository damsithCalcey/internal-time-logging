// Projects admin + amended state + on-behalf-of. Flat surfaces — no gradients.

const PROJECT_ROWS = [
  { p: PROJECTS[0], tasks: 4, members: 8,  hoursWk: 142, hot: true },
  { p: PROJECTS[1], tasks: 4, members: 6,  hoursWk: 96 },
  { p: PROJECTS[2], tasks: 3, members: 11, hoursWk: 188, hot: true },
  { p: PROJECTS[3], tasks: 2, members: 4,  hoursWk: 64 },
  { p: PROJECTS[4], tasks: 2, members: 3,  hoursWk: 18 },
];

// Variation A — Projects admin (manager)
const ProjectsAdmin = () => (
  <div className="app">
    <Sidebar active="projects" role="manager" />
    <div className="main">
      <Topbar title="Projects" meta="MANAGER · 14 ACTIVE">
        <button className="btn btn-primary btn-sm">
          <Icon name="plus" size={12} />New project
        </button>
      </Topbar>
      <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="a-overline">Active projects</div>
            <div className="a-num">14</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>3 added this quarter</div>
          </div>
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="a-overline">Logged this week</div>
            <div className="a-num"><span className="accent">508</span></div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>hours across the team</div>
          </div>
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="a-overline">Tasks</div>
            <div className="a-num">36</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>open across projects</div>
          </div>
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="a-overline">Team</div>
            <div className="a-num">28</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>engineers, designers, QA</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, overflow: 'hidden' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ink-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="a-h4">All projects</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-soft btn-sm">
                  <Icon name="filter" size={11} />Filter
                </button>
                <button className="btn btn-soft btn-sm">
                  <Icon name="search" size={11} />Search
                </button>
              </div>
            </div>
            <table className="tbl">
              <thead><tr>
                <th>Project</th>
                <th style={{ width: 70 }}>Tasks</th>
                <th style={{ width: 110 }}>Members</th>
                <th style={{ width: 100 }}>This wk</th>
                <th style={{ width: 50 }}></th>
              </tr></thead>
              <tbody>
                {PROJECT_ROWS.map((r, i) => (
                  <tr key={r.p.id} className={i === 0 ? 'hl' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: r.p.color, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.04em',
                        }}>{r.p.code}</div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5 }}>{r.p.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)' }}>
                            {r.hot ? 'ACTIVE · ON TRACK' : 'ACTIVE'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><Hours h={r.tasks} /></td>
                    <td>
                      <div style={{ display: 'flex' }}>
                        {[TEAM.me, ...TEAM.peers].slice(0, Math.min(r.members, 4)).map((u, idx) => (
                          <div key={u.id} className={`avatar ${u.avatar}`} style={{ width: 24, height: 24, fontSize: 9.5, marginLeft: idx === 0 ? 0 : -6, border: '2px solid #fff' }}>
                            {u.initials}
                          </div>
                        ))}
                        {r.members > 4 && (
                          <div style={{
                            width: 24, height: 24, borderRadius: 999,
                            background: 'var(--ink-200)', color: 'var(--ink-700)',
                            fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginLeft: -6, border: '2px solid #fff',
                          }}>+{r.members - 4}</div>
                        )}
                      </div>
                    </td>
                    <td><Hours h={r.hoursWk} /></td>
                    <td><Icon name="chevron-right" size={14} color="var(--ink-400)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right panel — selected project detail. Flat header. */}
          <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--ink-200)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: PROJECTS[0].color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}>UPF</div>
                  <div className="a-overline" style={{ color: 'var(--ink-600)' }}>UPF · ACTIVE</div>
                </div>
                <Icon name="more-horizontal" size={16} color="var(--ink-500)" />
              </div>
              <div className="a-h2" style={{ marginTop: 12 }}>Upflex</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-600)', marginTop: 4, lineHeight: 1.45 }}>
                On-demand workspace bookings — globe-spanning marketplace and mobile apps.
              </div>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
              <div>
                <div className="a-overline" style={{ marginBottom: 10 }}>Tasks · 4</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PROJECTS[0].tasks.map((t, i) => (
                    <div key={t} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', background: 'var(--ink-50)',
                      borderRadius: 10,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--tropical-magenta)' }} />
                      <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 13.5 }}>{t}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)' }}>{[18, 24, 12, 38][i]}h</span>
                    </div>
                  ))}
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', background: 'transparent',
                    border: '1px dashed var(--ink-300)', borderRadius: 10,
                    color: 'var(--ink-600)', fontFamily: 'var(--font-display)',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}>
                    <Icon name="plus" size={12} />Add task
                  </button>
                </div>
              </div>
              <div>
                <div className="a-overline" style={{ marginBottom: 10 }}>Assigned · 8</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[TEAM.me, ...TEAM.peers].map(u => (
                    <div key={u.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px 4px 4px', background: 'var(--ink-50)',
                      borderRadius: 999, border: '1px solid var(--ink-200)',
                    }}>
                      <div className={`avatar ${u.avatar}`} style={{ width: 20, height: 20, fontSize: 9 }}>{u.initials}</div>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 500 }}>{u.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Variation B — On-behalf-of entry (manager) — simple form, no mad-lib
const OnBehalfOfEntry = () => (
  <div className="app">
    <Sidebar active="approvals" role="manager" />
    <div className="main">
      <Topbar title="Log on behalf" meta="MANAGER · NEW ENTRY" />
      <div style={{ padding: '28px 28px 0', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Heading */}
        <div>
          <div className="a-overline" style={{ marginBottom: 6 }}>Manager mode</div>
          <h2 className="a-h1" style={{ margin: 0 }}>Log on behalf of an employee.</h2>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-600)', maxWidth: '64ch' }}>
            The entry is attributed to the employee, not you. They'll see it on their daily log with a
            small <em>submitted by Ruwan</em> tag.
          </p>
        </div>

        {/* Form */}
        <div className="card card-pad">
          <Field label="Employee" hint="Required">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px 10px 10px', background: '#fff',
              border: '1.5px solid var(--paradise-pink)', borderRadius: 10,
            }}>
              <div className={`avatar pink`} style={{ width: 28, height: 28, fontSize: 11 }}>TS</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Tharindu Silva</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)' }}>FRONTEND ENGINEER · UPF, PYP</div>
              </div>
              <Icon name="chevron-down" size={14} color="var(--ink-500)" />
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
            <Field label="Date">
              <SelectField value="Monday 18 May 2026" icon="calendar" />
            </Field>
            <Field label="Hours" hint="Tharindu's daily budget · 4 / 24h">
              <HoursStepper value="4.0" />
            </Field>
            <Field label="Project">
              <SelectField value="PayPal · Mosaic" dotColor={PROJECTS[2].color} />
            </Field>
            <Field label="Task">
              <SelectField value="Identity service" />
            </Field>
          </div>

          <div style={{ marginTop: 20 }}>
            <Field label="Manager note" hint="Optional · why are you logging on Tharindu's behalf?">
              <textarea className="field-input" style={{ minHeight: 90, resize: 'none' }} defaultValue="Tharindu was at the PayPal Mosaic onsite — capturing the 4h he spent on identity-service edge cases. He's still on a flight; will sync up tomorrow." />
            </Field>
          </div>
        </div>

        {/* Audit notice */}
        <div className="card card-pad" style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: 'var(--magenta-100)', borderColor: 'transparent',
        }}>
          <Icon name="shield" size={16} color="var(--magenta-800)" style={{ marginTop: 2, flex: '0 0 auto' }} />
          <div style={{ fontSize: 13, color: 'var(--magenta-800)', lineHeight: 1.5 }}>
            <strong>Audited action.</strong> This entry will be tagged <span style={{ fontFamily: 'var(--font-mono)' }}>SUBMITTED_BY=RUWAN.J</span>.
            The 24-hour cap is applied to Tharindu's day, not yours.
          </div>
        </div>

        {/* Action bar */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--ink-200)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          display: 'flex', alignItems: 'center', gap: 12,
          marginLeft: -28, marginRight: -28,
        }}>
          <Icon name="user-plus" size={14} color="var(--ink-500)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)' }}>
            RUWAN.J ON BEHALF OF TS · 19 MAY 14:08
          </span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost">Cancel</button>
          <button className="btn btn-primary">
            Submit on behalf
            <Icon name="arrow-right" size={13} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Variation C — Amended entry detail (employee view) — flat banner, no hero gradient
const AmendedEntryView = () => (
  <div className="app">
    <Sidebar active="history" />
    <div className="main">
      <Topbar title="Time entry detail" meta="ENTRY #2718 · AMENDED" />
      <div style={{ padding: '28px 28px 0', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '14px 24px',
            background: 'var(--magenta-100)', color: 'var(--magenta-800)',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 13.5,
          }}>
            <Icon name="edit-3" size={14} />
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Ruwan Jayasekera</span>
              {' '}amended this entry on <strong>Tue 19 May, 14:08</strong>.
              <span style={{ marginLeft: 6, opacity: 0.7 }}>You cannot edit an amended entry; reach out if you'd like to discuss.</span>
            </div>
          </div>
          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="a-overline">Mon 18 May 2026 · Upflex</div>
                <h2 className="a-h2" style={{ marginTop: 4 }}>Bookings API · Stripe migration</h2>
              </div>
              <StatusPill status="amended" />
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
              border: '1px solid var(--ink-200)',
              borderRadius: 16, overflow: 'hidden',
            }}>
              <div style={{ padding: '20px 24px', background: 'var(--ink-50)', borderRight: '1px solid var(--ink-200)' }}>
                <div className="a-overline" style={{ marginBottom: 6 }}>Original · you</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, letterSpacing: '-0.02em', color: 'var(--ink-700)', textDecoration: 'line-through', textDecorationColor: 'var(--ink-300)' }}>5.0</span>
                  <span style={{ color: 'var(--ink-500)', fontSize: 15, fontWeight: 600 }}>hours</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-600)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                  SUBMITTED MON 18 MAY 17:46
                </div>
              </div>
              <div style={{ padding: '20px 24px', background: '#fff' }}>
                <div className="a-overline" style={{ marginBottom: 6, color: 'var(--magenta-800)' }}>Amended · Ruwan J.</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, letterSpacing: '-0.02em', color: 'var(--tropical-magenta)' }}>4.0</span>
                  <span style={{ color: 'var(--ink-500)', fontSize: 15, fontWeight: 600 }}>hours</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-600)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                  AMENDED TUE 19 MAY 14:08
                </div>
              </div>
            </div>

            <div>
              <div className="a-overline" style={{ marginBottom: 8 }}>Your notes</div>
              <div style={{
                padding: 16, background: 'var(--ink-50)', borderRadius: 12,
                fontSize: 14, color: 'var(--ink-800)', lineHeight: 1.55,
              }}>
                Webhook secret rotation and downstream consumer updates — pair with Sahani on the OIDC discovery
                doc edge cases. PR #2118 ready for review.
              </div>
            </div>

            <div>
              <div className="a-overline" style={{ marginBottom: 8 }}>Manager note</div>
              <div style={{
                padding: 16, background: 'var(--magenta-100)', borderRadius: 12,
                fontSize: 14, color: 'var(--magenta-800)', lineHeight: 1.55,
                borderLeft: '3px solid var(--tropical-magenta)',
              }}>
                Adjusted to 4h — the Stripe migration block ended at 13:30 per the standup notes, not 14:30.
                Looks like the timer ran for an extra hour after wrap-up. Approved as amended.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { ProjectsAdmin, OnBehalfOfEntry, AmendedEntryView });
