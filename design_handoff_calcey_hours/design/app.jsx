// Main app — assembles all screens into a design canvas.
// Each screen lives in window.* (see screens/*.jsx).

// Phone bezel for mobile artboards
const PhoneBezel = ({ children }) => (
  <div style={{
    width: '100%', height: '100%',
    padding: 10,
    background: '#0b0b12',
    borderRadius: 44,
    boxShadow: '0 24px 80px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Notch */}
    <div style={{
      position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
      width: 110, height: 28, background: '#000', borderRadius: 14, zIndex: 5,
    }} />
    <div style={{
      width: '100%', height: '100%',
      borderRadius: 34, overflow: 'hidden',
      background: 'var(--ink-50)',
    }}>
      {children}
    </div>
  </div>
);

// Desktop window chrome (subtle, browser-ish)
const BrowserChrome = ({ children }) => (
  <div style={{
    width: '100%', height: '100%',
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{
      height: 36, flex: '0 0 36px',
      background: 'var(--ink-100)', borderBottom: '1px solid var(--ink-200)',
      display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px',
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#FF5F57' }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#FEBC2E' }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#28C840' }} />
      </div>
      <div style={{
        flex: 1, height: 22, background: '#fff', border: '1px solid var(--ink-200)',
        borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--status-success)' }} />
        hours.calcey.com
      </div>
    </div>
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{children}</div>
  </div>
);

const W = 1280, H = 820;            // desktop artboard
const MW = 392, MH = 844;           // mobile artboard

const App = () => (
  <DesignCanvas>
    {/* ============ INTRO / OVERVIEW ============ */}
    <DCSection
      id="overview"
      title="Calcey Hours — converged direction"
      subtitle="Internal time-logging app · BRD v1.3 · MVP · May 2026"
    >
      <DCArtboard id="cover" label="Cover" width={W} height={H}>
        <CoverBoard />
      </DCArtboard>
      <DCArtboard id="system" label="System notes" width={W} height={H}>
        <SystemBoard />
      </DCArtboard>
    </DCSection>

    {/* ============ AUTH ============ */}
    <DCSection
      id="auth"
      title="01 · Sign in"
      subtitle="Single centered form. Manager-provisioned accounts."
    >
      <DCArtboard id="auth-desktop" label="Sign in" width={W} height={H}>
        <BrowserChrome><AuthLogin /></BrowserChrome>
      </DCArtboard>
    </DCSection>

    {/* ============ DAILY LOG ============ */}
    <DCSection
      id="daily"
      title="02 · Daily log"
      subtitle="Table view. Flat row highlight."
    >
      <DCArtboard id="daily-table" label="Daily log · table" width={W} height={H}>
        <BrowserChrome><DailyLogTable /></BrowserChrome>
      </DCArtboard>
    </DCSection>

    {/* ============ TIME ENTRY FORM ============ */}
    <DCSection
      id="entry"
      title="03 · Time entry"
      subtitle="Simple, conventional form."
    >
      <DCArtboard id="entry-desktop" label="Time entry form" width={W} height={H}>
        <BrowserChrome><TimeEntryForm /></BrowserChrome>
      </DCArtboard>
      <DCArtboard id="entry-onbehalf" label="On-behalf-of (manager)" width={W} height={H}>
        <BrowserChrome><OnBehalfOfEntry /></BrowserChrome>
      </DCArtboard>
    </DCSection>

    {/* ============ WEEKLY SUMMARY ============ */}
    <DCSection
      id="weekly"
      title="04 · Weekly summary"
      subtitle="ISO week. Table grid."
    >
      <DCArtboard id="weekly-table" label="Weekly · table grid" width={W} height={H}>
        <BrowserChrome><WeeklyTable /></BrowserChrome>
      </DCArtboard>
    </DCSection>

    {/* ============ TIMER ============ */}
    <DCSection
      id="timer"
      title="05 · Timer"
      subtitle="App-wide. No nav tab — a FAB starts a timer from any screen, and a mini player takes over when running."
    >
      <DCArtboard id="timer-idle" label="A · Idle · FAB" width={W} height={H}>
        <BrowserChrome><TimerIdleFAB /></BrowserChrome>
      </DCArtboard>
      <DCArtboard id="timer-picker" label="B · Start picker" width={W} height={H}>
        <BrowserChrome><TimerPickerOpen /></BrowserChrome>
      </DCArtboard>
      <DCArtboard id="timer-running" label="C · Running · mini player" width={W} height={H}>
        <BrowserChrome><TimerRunningMini /></BrowserChrome>
      </DCArtboard>
      <DCArtboard id="timer-stop" label="D · Stop &amp; save modal" width={W} height={H}>
        <BrowserChrome><TimerStopModal /></BrowserChrome>
      </DCArtboard>
    </DCSection>

    {/* ============ APPROVALS ============ */}
    <DCSection
      id="approvals"
      title="06 · Approval queue"
      subtitle="Manager view — inbox."
    >
      <DCArtboard id="approvals-inbox" label="Approvals · inbox" width={W} height={H}>
        <BrowserChrome><ApprovalsInbox /></BrowserChrome>
      </DCArtboard>
    </DCSection>

    {/* ============ STATES — AMENDED, PROJECTS ============ */}
    <DCSection
      id="states"
      title="07 · Manager admin & states"
      subtitle="Projects/tasks management and the amended-entry detail."
    >
      <DCArtboard id="projects-admin" label="Projects admin" width={W} height={H}>
        <BrowserChrome><ProjectsAdmin /></BrowserChrome>
      </DCArtboard>
      <DCArtboard id="amended-view"   label="Amended entry detail" width={W} height={H}>
        <BrowserChrome><AmendedEntryView /></BrowserChrome>
      </DCArtboard>
    </DCSection>

    {/* ============ MOBILE ============ */}
    <DCSection
      id="mobile"
      title="08 · Mobile · iOS"
      subtitle="3-tab bottom nav. FAB starts a timer; a docked mini player takes over when running, expands to a full sheet."
    >
      <DCArtboard id="m-daily"  label="Today · idle"   width={MW} height={MH}>
        <PhoneBezel><MobileDailyLog /></PhoneBezel>
      </DCArtboard>
      <DCArtboard id="m-daily-running" label="Today · timer running" width={MW} height={MH}>
        <PhoneBezel><MobileDailyLogRunning /></PhoneBezel>
      </DCArtboard>
      <DCArtboard id="m-timer"  label="Timer · expanded"  width={MW} height={MH}>
        <PhoneBezel><MobileTimer /></PhoneBezel>
      </DCArtboard>
      <DCArtboard id="m-entry"  label="Log time"     width={MW} height={MH}>
        <PhoneBezel><MobileTimeEntry /></PhoneBezel>
      </DCArtboard>
      <DCArtboard id="m-weekly" label="Week"         width={MW} height={MH}>
        <PhoneBezel><MobileWeekly /></PhoneBezel>
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

// ---- Cover & system boards ----

const CoverBoard = () => (
  <div style={{
    width: '100%', height: '100%',
    background: '#fff', color: 'var(--ink-1000)',
    padding: 64, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48,
    overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--tropical-magenta)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, color: '#fff', fontSize: 24, letterSpacing: '-0.04em' }}>c</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>Calcey Hours<span style={{ color: 'var(--tropical-magenta)' }}>.</span></div>
      </div>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--ink-500)', marginBottom: 24,
        }}>Internal time-logging app · MVP v1.0 · Converged direction</div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: 96, lineHeight: 0.98, letterSpacing: '-0.04em',
          margin: 0,
        }}>
          Where did the<br/>
          <span style={{ color: 'var(--tropical-magenta)' }}>hours</span> go?
        </h1>
        <p style={{
          maxWidth: '52ch', marginTop: 28, fontSize: 18, lineHeight: 1.55,
          color: 'var(--ink-600)',
        }}>
          A time-logging tool for Calcey, by Calcey. Built around how engineers actually work —
          quick entry on mobile, a clear week-at-a-glance, and managers who can approve a batch
          before their morning coffee gets cold.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 56 }}>
        <Stat n="8" l="screens" accent />
        <Stat n="2" l="device frames" />
        <Stat n="11" l="artboards" />
        <Stat n="1" l="bold magenta" accent />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
      <Legend />
    </div>
  </div>
);

const Stat = ({ n, l, accent }) => (
  <div>
    <div style={{
      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 64,
      letterSpacing: '-0.03em', lineHeight: 0.95,
      color: accent ? 'var(--tropical-magenta)' : 'var(--ink-1000)',
    }}>{n}</div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)', marginTop: 8, letterSpacing: '0.04em' }}>{l}</div>
  </div>
);

const Legend = () => (
  <div style={{
    background: 'var(--ink-50)',
    border: '1px solid var(--ink-200)',
    borderRadius: 18, padding: 28,
    display: 'flex', flexDirection: 'column', gap: 18,
  }}>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
      What's inside
    </div>
    {[
      ['01', 'Sign in', 'Centered form — clean, single-purpose.'],
      ['02', 'Daily log', 'Table view with flat row highlight.'],
      ['03', 'Time entry', 'Conventional form + manager on-behalf-of.'],
      ['04', 'Weekly summary', 'Table grid grouped by project, ISO week.'],
      ['05', 'Timer', 'Floating widget + stop-and-save modal.'],
      ['06', 'Approvals', 'Inbox-style queue with quick row actions.'],
      ['07', 'Admin & states', 'Projects/tasks + the amended-entry view.'],
      ['08', 'Mobile · 4 screens', 'Today · Log time · Timer · Week.'],
    ].map(([n, t, d]) => (
      <div key={n} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 14 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--tropical-magenta)', letterSpacing: '0.04em' }}>{n}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{t}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-600)', marginTop: 2, lineHeight: 1.4 }}>{d}</div>
        </div>
      </div>
    ))}
  </div>
);

const SystemBoard = () => (
  <div style={{
    width: '100%', height: '100%',
    background: '#fff', padding: 56,
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40,
    overflow: 'hidden',
  }}>
    <div>
      <div className="a-overline" style={{ marginBottom: 8 }}>Design system</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 56, letterSpacing: '-0.035em', margin: 0, lineHeight: 1 }}>
        Calcey's house style, applied honestly.
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--ink-700)', maxWidth: '48ch', marginTop: 20 }}>
        Internal tools deserve the same craft as the marketing site — but quieter.
        Red Hat Display, the magenta-period mark, tropical accents, mono metadata.
        No gradients. Numerals do the work.
      </p>

      <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SystemRow title="Brand color" body="Tropical magenta on critical moments only — totals, primary CTAs, the brand dot. Never on backgrounds." />
        <SystemRow title="Type" body="Red Hat Display: 900/800 for numbers, 700 for headings, 500–600 for UI. Red Hat Mono for metadata." />
        <SystemRow title="Status color" body="Kingfisher = submitted, green = approved, koha red = rejected, magenta = amended." />
        <SystemRow title="Surfaces" body="Flat solid backgrounds. White cards, ink-50 subtle surfaces, ink-1000 reserved for hero stats only." />
        <SystemRow title="Numbers" body="Numerals are the hero. Tabular figures. 8.0 not 8.00. One decimal even at zero." />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      {/* Color row */}
      <div className="card card-pad">
        <div className="a-overline" style={{ marginBottom: 12 }}>Brand palette</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            ['Magenta',  'var(--tropical-magenta)', '#AD1AAC'],
            ['Kingfisher', 'var(--kingfisher-blue)', '#307FE2'],
            ['Sky',      'var(--sky-blue)', '#59CBE8'],
            ['Pink',     'var(--paradise-pink)', '#DF4661'],
            ['Koha',     'var(--koha-red)', '#E4002B'],
          ].map(([n, c, h]) => (
            <div key={n}>
              <div style={{ aspectRatio: '1 / 1', borderRadius: 12, background: c }} />
              <div style={{ marginTop: 6, fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{n}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-500)' }}>{h}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Status pills */}
      <div className="card card-pad">
        <div className="a-overline" style={{ marginBottom: 12 }}>Entry status</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <StatusPill status="draft" />
          <StatusPill status="submitted" />
          <StatusPill status="approved" />
          <StatusPill status="rejected" />
          <StatusPill status="amended" />
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--ink-600)', lineHeight: 1.5 }}>
          Five canonical states map directly to BRD §6.6's state machine. Color + label, never color alone.
        </div>
      </div>
      {/* Numbers */}
      <div className="card card-pad" style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
        <div>
          <div className="a-overline" style={{ marginBottom: 6 }}>Hero number</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 88, letterSpacing: '-0.04em', lineHeight: 0.92, color: 'var(--tropical-magenta)', fontVariantNumeric: 'tabular-nums' }}>
            8.0<span style={{ color: 'var(--ink-300)', fontWeight: 700 }}>h</span>
          </div>
        </div>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.5, paddingBottom: 8 }}>
          Numbers carry the message. Tabular figures, generous size, one decimal — even at zero (0.5 step).
          Mono trailing unit.
        </div>
      </div>
      {/* Buttons */}
      <div className="card card-pad">
        <div className="a-overline" style={{ marginBottom: 12 }}>Actions</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary">Save &amp; submit</button>
          <button className="btn btn-dark">Approve all</button>
          <button className="btn btn-ghost">Cancel</button>
          <button className="btn btn-soft">Save as draft</button>
        </div>
      </div>
    </div>
  </div>
);

const SystemRow = ({ title, body }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, paddingTop: 14, borderTop: '1px solid var(--ink-100)' }}>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5 }}>{title}</div>
    <div style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.5 }}>{body}</div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
