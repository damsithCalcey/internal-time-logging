// Approval queue — 3 variations: Inbox, Kanban, Table. Manager view.

const PENDING = [
  { id: 'e1', user: TEAM.peers[0], project: PROJECTS[0], task: 'Bookings API',     hours: 4.0, date: 'Tue 19 May', notes: 'Idempotency on POST /bookings; updated SDK in three downstream apps.', age: '14m' },
  { id: 'e2', user: TEAM.peers[1], project: PROJECTS[1], task: 'Checkout flow',    hours: 2.5, date: 'Tue 19 May', notes: 'Address autocomplete; Stripe error states; analytics events.', age: '32m' },
  { id: 'e3', user: TEAM.me,       project: PROJECTS[0], task: 'Map redesign',     hours: 2.5, date: 'Tue 19 May', notes: 'Cluster pin marker; hover affordance with WCAG contrast.', age: '1h' },
  { id: 'e4', user: TEAM.peers[3], project: PROJECTS[2], task: 'Identity service', hours: 6.0, date: 'Mon 18 May', notes: 'OIDC discovery doc — testing edge cases against IdP fixtures.', age: '3h' },
  { id: 'e5', user: TEAM.peers[2], project: PROJECTS[3], task: 'Macro engine',     hours: 3.5, date: 'Mon 18 May', notes: 'Caloric calc accuracy on 17 fixtures. Failing on FFF-Day-Pass.', age: '4h' },
  { id: 'e6', user: TEAM.peers[4], project: PROJECTS[2], task: 'Risk dashboard',   hours: 1.5, date: 'Mon 18 May', notes: 'Investigated alert spike on auth provider region us-east-1.', age: '6h' },
];

const APPROVED_TODAY = [
  { id: 'a1', user: TEAM.peers[0], project: PROJECTS[2], task: 'Webhook reliability', hours: 3.0 },
  { id: 'a2', user: TEAM.peers[1], project: PROJECTS[1], task: 'PIM integration',     hours: 4.5 },
  { id: 'a3', user: TEAM.peers[2], project: PROJECTS[0], task: 'iOS refresh',         hours: 2.0 },
];

const ApprovalHeader = ({ activeFilter = 'submitted' }) => (
  <>
    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
      <div className="card card-pad" style={{
        background: 'var(--ink-1000)',
        color: '#fff', border: 'none',
      }}>
        <div className="a-overline" style={{ color: 'rgba(255,255,255,0.5)' }}>Pending</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 44, color: 'var(--tropical-magenta)', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>12</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>entries · 32.5 h</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>Oldest waiting 6 hours</div>
      </div>
      <div className="card card-pad">
        <div className="a-overline">Approved today</div>
        <Hours h="48.5" big />
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>14 entries · 6 people</div>
      </div>
      <div className="card card-pad">
        <div className="a-overline">Median response</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>2.4<span style={{ fontSize: 14, color: 'var(--ink-500)', fontWeight: 600, marginLeft: 4 }}>hrs</span></span>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>This week · 1h faster than last</div>
      </div>
      <div className="card card-pad">
        <div className="a-overline">Your team</div>
        <div style={{ display: 'flex', marginTop: 6 }}>
          {[TEAM.me, ...TEAM.peers].slice(0, 6).map((u, i) => (
            <div key={u.id} className={`avatar ${u.avatar}`} style={{ width: 32, height: 32, fontSize: 11, marginLeft: i === 0 ? 0 : -6, border: '2px solid #fff' }}>
              {u.initials}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 6 }}>6 active reports</div>
      </div>
    </div>
    {/* Filters */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{
        display: 'inline-flex', background: 'var(--ink-100)', padding: 3, borderRadius: 999,
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5,
      }}>
        {[
          { id: 'submitted', label: 'Submitted', count: 12 },
          { id: 'approved',  label: 'Approved',  count: 14 },
          { id: 'rejected',  label: 'Rejected',  count: 2  },
          { id: 'amended',   label: 'Amended',   count: 3  },
        ].map(f => (
          <span key={f.id} style={{
            padding: '7px 14px', borderRadius: 999,
            background: activeFilter === f.id ? '#fff' : 'transparent',
            color: activeFilter === f.id ? 'var(--ink-1000)' : 'var(--ink-600)',
            boxShadow: activeFilter === f.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {f.label}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 6px',
              borderRadius: 999, background: activeFilter === f.id ? 'var(--ink-100)' : 'var(--ink-200)',
              color: 'var(--ink-700)',
            }}>{f.count}</span>
          </span>
        ))}
      </div>
      <button className="btn btn-soft btn-sm">
        <Icon name="users" size={12} />All users
      </button>
      <button className="btn btn-soft btn-sm">
        <Icon name="calendar" size={12} />This week
      </button>
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost btn-sm">
        <Icon name="check-square" size={12} />Approve visible
      </button>
    </div>
  </>
);

// Variation A — Inbox (Linear/Superhuman vibe — rich rows)
const ApprovalsInbox = () => (
  <div className="app">
    <Sidebar active="approvals" role="manager" />
    <div className="main">
      <Topbar title="Approval queue" meta="MANAGER · 12 PENDING">
        <button className="btn btn-primary btn-sm">
          <Icon name="plus" size={12} />Log on behalf
        </button>
      </Topbar>
      <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ApprovalHeader activeFilter="submitted" />
        <div className="card" style={{ overflow: 'hidden' }}>
          {PENDING.map((e, i) => (
            <div key={e.id} style={{
              padding: '14px 22px',
              display: 'grid', gridTemplateColumns: '40px 220px 1fr 90px auto', gap: 18,
              alignItems: 'center',
              borderBottom: i === PENDING.length - 1 ? 'none' : '1px solid var(--ink-100)',
            }}>
              <div className={`avatar ${e.user.avatar}`}>{e.user.initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.user.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)', letterSpacing: '0.04em' }}>
                  {e.date.toUpperCase()} · {e.age} AGO
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: e.project.color }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5 }}>{e.project.name}</span>
                  <span style={{ color: 'var(--ink-400)' }}>·</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-700)' }}>{e.task}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.notes}
                </div>
              </div>
              <Hours h={e.hours.toFixed(1)} big />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-soft btn-sm" style={{ padding: '6px 10px' }}>
                  <Icon name="x" size={12} />Reject
                </button>
                <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                  <Icon name="check" size={12} />Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Variation B — Kanban (Submitted | Needs note | Approved today)
const ApprovalsKanban = () => {
  const cols = [
    { id: 'sub',  title: 'Submitted',     accent: 'var(--kingfisher-blue)', items: PENDING.slice(0, 3) },
    { id: 'esc',  title: 'Needs my note', accent: 'var(--paradise-pink)',   items: PENDING.slice(3, 5) },
    { id: 'ok',   title: 'Approved today',accent: 'var(--status-success)',  items: APPROVED_TODAY },
  ];
  return (
    <div className="app">
      <Sidebar active="approvals" role="manager" />
      <div className="main">
        <Topbar title="Approval queue" meta="MANAGER · KANBAN" />
        <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ApprovalHeader activeFilter="submitted" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, overflow: 'hidden' }}>
            {cols.map(col => (
              <div key={col.id} style={{
                background: 'var(--ink-100)',
                borderRadius: 'var(--radius-xl)',
                padding: 14,
                display: 'flex', flexDirection: 'column', gap: 10,
                minHeight: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: col.accent }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{col.title}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)' }}>{col.items.length}</span>
                  </div>
                  <Icon name="more-horizontal" size={14} color="var(--ink-500)" />
                </div>
                {col.items.map(e => (
                  <div key={e.id} className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={`avatar ${e.user.avatar}`} style={{ width: 26, height: 26, fontSize: 10.5 }}>{e.user.initials}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5, flex: 1 }}>{e.user.name}</div>
                      <Hours h={e.hours.toFixed(1)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: e.project.color }} />
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5 }}>{e.project.name}</span>
                      <span style={{ color: 'var(--ink-400)' }}>·</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-700)' }}>{e.task}</span>
                    </div>
                    {e.notes && (
                      <div style={{ fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.4 }}>
                        {e.notes.length > 70 ? e.notes.slice(0, 70) + '…' : e.notes}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-500)', letterSpacing: '0.04em', flex: 1 }}>
                        {(e.age || '—').toUpperCase()} {e.age ? 'AGO' : ''}
                      </span>
                      {col.id !== 'ok' ? (
                        <>
                          <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="x" size={11} /></button>
                          <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                            <Icon name="check" size={11} />OK
                          </button>
                        </>
                      ) : (
                        <span className="pill pill-approved" style={{ fontSize: 9.5, padding: '3px 8px' }}><span className="dot" />Approved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Variation C — Table (dense)
const ApprovalsTable = () => (
  <div className="app">
    <Sidebar active="approvals" role="manager" />
    <div className="main">
      <Topbar title="Approval queue" meta="MANAGER · DENSE TABLE" />
      <div style={{ padding: '24px 28px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ApprovalHeader activeFilter="submitted" />
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead><tr>
              <th style={{ width: 36 }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--ink-400)', display: 'inline-block' }} />
              </th>
              <th>User</th>
              <th>Date</th>
              <th>Project · task</th>
              <th style={{ width: 80 }}>Hours</th>
              <th>Notes</th>
              <th style={{ width: 80 }}>Aged</th>
              <th style={{ width: 200, textAlign: 'right' }}></th>
            </tr></thead>
            <tbody>
              {PENDING.map((e, i) => (
                <tr key={e.id} className={i === 0 ? 'hl' : ''}>
                  <td>
                    <span style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: '1.5px solid var(--ink-400)',
                      background: i === 0 ? 'var(--tropical-magenta)' : 'transparent',
                      borderColor: i === 0 ? 'var(--tropical-magenta)' : 'var(--ink-400)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i === 0 && <Icon name="check" size={10} color="#fff" />}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={`avatar ${e.user.avatar}`} style={{ width: 26, height: 26, fontSize: 10.5 }}>{e.user.initials}</div>
                      <span style={{ fontWeight: 600 }}>{e.user.name.split(' ')[0]} {e.user.name.split(' ')[1][0]}.</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-600)' }}>{e.date}</td>
                  <td><ProjectChip project={e.project} task={e.task} /></td>
                  <td><Hours h={e.hours.toFixed(1)} /></td>
                  <td style={{ color: 'var(--ink-600)', fontSize: 13, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)' }}>{e.age}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn btn-soft btn-sm" style={{ padding: '5px 10px' }}>
                        <Icon name="x" size={11} />Reject
                      </button>
                      <button className="btn btn-primary btn-sm" style={{ padding: '5px 12px' }}>
                        <Icon name="check" size={11} />Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { ApprovalsInbox, ApprovalsKanban, ApprovalsTable });
