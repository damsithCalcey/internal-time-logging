// Time entry form — clean, simple field form. No mad-lib.

const TimeEntryForm = () => (
  <div className="app">
    <Sidebar active="daily" />
    <div className="main">
      <Topbar title="Log time" meta="NEW ENTRY · TUE 19 MAY" />
      <div style={{ padding: '28px 28px 0', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Heading + daily budget */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div className="a-overline" style={{ marginBottom: 6 }}>New time entry</div>
            <h2 className="a-h1" style={{ margin: 0 }}>Log your hours.</h2>
          </div>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="a-overline">Today · daily budget</span>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                color: 'var(--ink-700)', fontVariantNumeric: 'tabular-nums',
              }}>5.5 / 24h</span>
            </div>
            <Bar pct={(5.5 / 24) * 100} />
            <div style={{
              marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10.5,
              color: 'var(--ink-500)', letterSpacing: '0.04em',
            }}>
              18.5 H REMAINING IN YOUR BUDGET
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <Field label="Date">
              <SelectField value="Tuesday 19 May 2026" icon="calendar" />
            </Field>
            <Field label="Hours" hint="Increments of 0.5">
              <HoursStepper value="2.5" />
            </Field>
            <Field label="Project">
              <SelectField value="Upflex" dotColor={PROJECTS[0].color} />
            </Field>
            <Field label="Task">
              <SelectField value="Map redesign" />
            </Field>
          </div>
          <Field label="Notes" hint="Optional · 248 / 500">
            <textarea className="field-input" style={{
              minHeight: 110, resize: 'none', fontFamily: 'var(--font-body)',
              fontSize: 14, lineHeight: 1.55, padding: 14,
            }} defaultValue="Implemented the new cluster pin marker with hover affordance. Reviewed accessibility against WCAG contrast notes Anika sent. PR up at github.com/calcey/upflex/pull/2118 — ready for review tomorrow." />
          </Field>
        </div>

        {/* Validation summary */}
        <div className="card card-pad">
          <div className="a-overline" style={{ marginBottom: 12 }}>Validation</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              'Hours is a multiple of 0.5',
              'Date is today or earlier',
              'You are assigned to Upflex',
              'Daily total under 24h cap',
            ].map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-800)' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 999,
                  background: 'var(--status-success)',
                  color: '#fff', flex: '0 0 auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="check" size={11} />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div style={{
          position: 'sticky', bottom: 0,
          marginTop: 'auto',
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--ink-200)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          display: 'flex', alignItems: 'center', gap: 12,
          marginLeft: -28, marginRight: -28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="clock" size={14} color="var(--ink-500)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)' }}>
              Auto-saved 4s ago · draft #d-2718
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost">Cancel</button>
          <button className="btn btn-soft">Save as draft</button>
          <button className="btn btn-primary">
            Save &amp; submit
            <Icon name="arrow-right" size={13} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ---- Form primitives ----
const Field = ({ label, hint, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink-800)' }}>{label}</span>
      {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)' }}>{hint}</span>}
    </div>
    {children}
  </label>
);

const SelectField = ({ value, icon, dotColor }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', background: '#fff',
    border: '1px solid var(--ink-300)', borderRadius: 10,
    fontSize: 14, color: 'var(--ink-1000)',
    cursor: 'pointer',
  }}>
    {dotColor && <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flex: '0 0 auto' }} />}
    {icon && <Icon name={icon} size={14} color="var(--ink-500)" />}
    <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500 }}>{value}</span>
    <Icon name="chevron-down" size={14} color="var(--ink-500)" />
  </div>
);

const HoursStepper = ({ value }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 0,
    border: '1px solid var(--ink-300)', borderRadius: 10,
    background: '#fff', overflow: 'hidden',
  }}>
    <button style={{
      width: 40, height: 42, background: 'transparent', border: 'none',
      borderRight: '1px solid var(--ink-200)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--ink-700)',
    }}><Icon name="minus" size={14} /></button>
    <div style={{
      flex: 1, textAlign: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
      fontVariantNumeric: 'tabular-nums',
    }}>{value}<span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600, marginLeft: 3 }}>h</span></div>
    <button style={{
      width: 40, height: 42, background: 'transparent', border: 'none',
      borderLeft: '1px solid var(--ink-200)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--ink-700)',
    }}><Icon name="plus" size={14} /></button>
  </div>
);

Object.assign(window, { TimeEntryForm, Field, SelectField, HoursStepper });
