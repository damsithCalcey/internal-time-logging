// Auth screen — clean, centered single form.
const AuthLogin = () => (
  <div style={{
    width: '100%', height: '100%',
    background: 'var(--ink-50)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 48,
    fontFamily: 'var(--font-body)',
  }}>
    <div style={{
      width: 420,
      background: '#fff',
      borderRadius: 'var(--radius-2xl)',
      border: '1px solid var(--ink-200)',
      padding: '44px 48px 40px',
      boxShadow: 'var(--shadow-md)',
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: 'var(--tropical-magenta)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 900, color: '#fff',
          fontSize: 20, letterSpacing: '-0.04em',
        }}>c</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
        }}>Calcey Hours<span style={{ color: 'var(--tropical-magenta)' }}>.</span></div>
      </div>

      <div>
        <h2 className="a-h2" style={{ marginBottom: 6 }}>Welcome back.</h2>
        <p style={{ color: 'var(--ink-600)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          Use your Calcey email. Accounts are provisioned by your manager.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="field-label">Work email</label>
          <input className="field-input" defaultValue="dilani.perera@calcey.com" />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label className="field-label">Password</label>
            <a style={{
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
              color: 'var(--tropical-magenta)', textDecoration: 'none',
            }}>Forgot?</a>
          </div>
          <input className="field-input" type="password" defaultValue="•••••••••••" />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-700)', marginTop: 2 }}>
          <span style={{
            width: 18, height: 18, borderRadius: 5,
            background: 'var(--tropical-magenta)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--tropical-magenta)',
          }}>
            <Icon name="check" size={11} color="#fff" />
          </span>
          Keep me signed in on this device
        </label>

        <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          Sign in
          <Icon name="arrow-right" size={15} />
        </button>
      </div>

      <div style={{
        paddingTop: 20, borderTop: '1px solid var(--ink-200)',
        fontSize: 12.5, color: 'var(--ink-500)', textAlign: 'center',
      }}>
        Stuck? Ping <span style={{ color: 'var(--ink-1000)', fontWeight: 600 }}>#hours-help</span> on Slack.
      </div>
    </div>
  </div>
);

window.AuthLogin = AuthLogin;
