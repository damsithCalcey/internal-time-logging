# Handoff: Calcey Hours — Internal Time Logging App (MVP v1.0)

## Overview

**Calcey Hours** is an internal SPA for logging time against projects and tasks at Calcey Technologies. Employees log entries against assigned projects; managers review/approve/amend them, manage projects, and can log on behalf of employees. The app is built around three primary jobs: **(1) log time fast**, **(2) see the week at a glance**, **(3) manager approval in a single inbox-style queue**. A timer is surfaced **app-wide** (no nav tab) — a FAB in the bottom-right starts it, and a mini player takes over while running.

The BRD (v1.3) and ERD (v1.2) are included in this handoff under `source/`. The **Development Plan** in `docs/dev_plan.md` is the authoritative reference for architecture, schema, staged build gates, and all implementation decisions.

## About the design files

The files in `design/` are **design references** — interactive HTML/React prototypes that show the intended look and behavior. They are not production code. The task is to **recreate these designs in the target codebase's environment**. Lift colors, type, spacing, copy, and component anatomies from the prototype, but rebuild them using the chosen framework's idioms and the Calcey foundations CSS (also bundled in `design/design_system/`).

## Fidelity

**High-fidelity.** Final colors, typography, spacing, and component behaviors. The developer should match pixel-level details (radii, paddings, shadow values, status pill grammar) and lift exact tokens from `design/design_system/colors_and_type.css`.

## Brand system

The visual style is the **Calcey Design System** (`design/design_system/`):

- **Type:** Red Hat Display (display + body, weights 300–900). Red Hat Mono for metadata / monospace.
- **Brand palette** — use sparingly, color-on-type and accents only, never as backgrounds:
  - Tropical Magenta `#AD1AAC` — primary brand, totals, the `.` in the wordmark, primary CTAs
  - Kingfisher Blue `#307FE2` — info / submitted status
  - Sky Blue `#59CBE8` — accent
  - Paradise Pink `#DF4661` — accent
  - Koha Red `#E4002B` — danger / rejected, the running-timer pulse dot
- **Neutrals:** 12-step warm-leaning ink ramp (`--ink-50` → `--ink-1000`). Body text is `--ink-1000`, never `#000`.
- **No gradients** on surfaces. Flat fills only. Hero stat panels can use `--ink-1000` as a solid.
- **Surfaces:** white cards on an `--ink-50` page background; cards use a `1px var(--ink-200)` border plus a small shadow rather than thick borders.
- **Radii:** `4 / 8 / 12 / 16 / 24 / 999px` (pill). Cards favor 16–24px. Buttons are pills (`999px`).
- **Shadows:** four-step neutral scale plus `--shadow-brand` (soft magenta glow) reserved for the primary CTA and the running mini player.
- **Numbers are the hero.** Tabular figures (`font-variant-numeric: tabular-nums`), generous size, one decimal even at 0 (the entry step is 0.5h).

All token names referenced below resolve in `colors_and_type.css`.

---

## Information architecture

### Employee
- **Daily log** (`/app/daily`) — default landing
- **Weekly summary** (`/app/weekly`)
- **My entries** (`/app/entries`) — history / detail (includes the amended-entry detail view)
- Time entry detail / edit drawer or modal opens over daily log
- App-wide **timer FAB** in bottom-right

### Manager (adds to employee items)
- **Approval queue** (`/app/approvals`)
- **Projects** (`/app/projects`) — projects + tasks + member assignment
- **Team** (`/app/team`)
- Manager can use the same time-entry form with an extra "On behalf of" employee field

### Public
- **Sign in** (`/login`)

### Mobile
- 3 bottom tabs: **Today**, **Week**, **Me**
- FAB starts a timer; docked mini player above the tab bar when running; tap to expand to a full sheet

---

## Screens — anatomy and behavior

### 01 · Sign in (`/login`)

**Purpose.** Email + password sign-in. Accounts are admin-provisioned by managers via Supabase dashboard.

**Layout.** Single centered card on an `--ink-50` page background.
- Card: 420px wide, `padding: 44px 48px 40px`, `border-radius: var(--radius-2xl)` (24px), `1px var(--ink-200)`, `box-shadow: var(--shadow-md)`.
- Vertical rhythm inside card (gap `28px`): brand mark + name → heading + sub → form fields → footer help line.

**Components.**
- **Brand mark.** 36×36 rounded square, `var(--tropical-magenta)`, white lowercase "c" (Red Hat Display, 900, 20px, `-0.04em` tracking).
- **Wordmark.** "Calcey Hours" Display 800 18px, with the trailing `.` in magenta.
- **Heading.** `class="a-h2"` ("Welcome back.").
- **Sub.** 14px ink-600, "Use your Calcey email. Accounts are provisioned by your manager."
- **Field "Work email."** Standard text input. Label is Display 600 12.5px ink-800.
- **Field "Password."** Standard password input with a "Forgot?" link on the right baseline (Display 600 12px, magenta).
- **Checkbox.** "Keep me signed in on this device." Pre-checked. Square 18×18 magenta fill with white check.
- **Primary CTA.** Pill button, full-width, `var(--tropical-magenta)` with `var(--shadow-brand)`. Label "Sign in" + arrow-right icon. `padding: 14px 24px`.
- **Footer line.** "Stuck? Ping #hours-help on Slack." 12.5px ink-500, centered.

---

### 02 · Daily log (`/app/daily`)

**Purpose.** See and act on today's entries. Default screen.

**Layout.** Two-column app shell:
- **Sidebar** (`248px`, full height, `var(--ink-1000)` background). Sticky. Contains brand, nav sections, optional running-timer card, user chip.
- **Main** (rest of width, scrollable). Top bar 64px tall (`rgba(255,255,255,0.78)` + `backdrop-filter: blur(20px)`, `1px solid var(--ink-200)` bottom border). Then content padded `24px 28px`.

**Sidebar nav (employee).**
- Section label "LOG TIME" — Red Hat Mono 10.5px, 600 weight, `letter-spacing: 0.16em`, uppercase, `rgba(255,255,255,0.4)`.
- Items (10px padding, 10px border-radius, Display 600 14px): **Daily log** (active), **Weekly summary**, **My entries**.
- Active state: `rgba(173,26,172,0.18)` background + `inset 2px 0 0 var(--tropical-magenta)` shadow.
- User chip at bottom: avatar (36×36 round, gradient pink), name + role.

**Page content order.**
1. **Stat strip** — 4 cards in a `1.4fr 1fr 1fr 1fr` grid, gap 16px:
   - **Today's total** — dark card (`var(--ink-1000)` solid, white text, no border). Overline "Tuesday · May 19" → big magenta number (Display 900, 56px, line-height 0.95, magenta) "8.0" + "/ 24h" in ink-300 → 13px white-65% caption "16 hours of budget remaining today".
   - **Approved** — white card. Overline → big `Hours` element 2.5h → 12px ink-500 caption.
   - **Submitted** — same pattern, 3.5h.
   - **Drafts** — same pattern, 0.5h.
2. **Day toolbar** — pill date stepper (chevron-left / "Tue 19 May 2026" / chevron-right), "Today" soft button, spacer, "Submit all drafts" ghost button, "Log time" magenta primary button.
3. **Table card** — white card, `1px var(--ink-200)`, `border-radius: var(--radius-xl)` (16px), overflow:hidden. Columns:
   - **Project · task** (34%) — `ProjectChip` (colored dot + project name + mono task line)
   - **Hours** (90px) — `Hours` component (number + small "h")
   - **Notes** (flex) — 13px ink-600, single-line ellipsis, max-width 380px
   - **Status** (120px) — `StatusPill` (see Component library)
   - **Actions** (right-aligned, 90px) — edit icon + kebab in 30×30 icon buttons
   - **Row highlight** (`tr.hl`): solid `var(--magenta-100)` background (no gradient).
   - **Footer row** ("Day total"): `var(--ink-50)` background, Display 700 13px label, big `Hours` value, "6 entries · within daily 24h cap" caption in ink-500.

**Behavior.**
- Date picker disables future dates.
- Edit, submit, and withdraw actions per the approval state machine (see BRD §6.6). If a withdrawal conflicts with a concurrent manager action, show a conflict toast.
- Status pill click on `submitted`/`approved`/`amended` opens the read-only entry detail; on `draft`/`rejected` opens the edit drawer.
- Selecting a row navigates to the entry detail; for an `amended` row, that's the **Amended entry detail** screen.

---

### 03 · Time entry — create / edit

**Purpose.** Create or edit a single entry.

**Layout.** Same app shell, content stacks (gap 20px):
1. **Heading row.** Left: overline "New time entry", h1 "Log your hours." Right (280px wide): "Today · daily budget" overline + "5.5 / 24h" tabular numeral on the same row → `Bar` progress (~23%) → mono caption "18.5 H REMAINING IN YOUR BUDGET".
2. **Form card.** `card card-pad`. 2-column grid (gap 20px):
   - **Date** — `SelectField` with calendar icon, "Tuesday 19 May 2026".
   - **Hours** — `HoursStepper` (− button | tabular numeral with small "h" | + button) with hint "Increments of 0.5".
   - **Project** — `SelectField` with colored dot, "Upflex".
   - **Task** — `SelectField`, "Map redesign".
   - **Notes** — full-width textarea, min-height 110px, no resize. Hint "Optional · 248 / 500".
3. **Validation card.** `card card-pad`. Overline "Validation". 4-column grid of items, each a green 20×20 round badge with a white check + 13px ink-800 label:
   - "Hours is a multiple of 0.5"
   - "Date is today or earlier"
   - "You are assigned to <project>"
   - "Daily total under 24h cap"
4. **Sticky action bar.** Pinned to bottom of scroll area; `rgba(255,255,255,0.92)` + `backdrop-filter: blur(20px)`; left contains clock icon + mono "Auto-saved 4s ago · draft #d-2718"; right contains Cancel (ghost) / Save as draft (soft) / **Save & submit** (primary, with arrow-right).

**Validation rules** (apply on create and edit):
- Hours must be a multiple of 0.5, greater than zero, and no more than 24
- Entry date must not be in the future
- Daily total for the user must not exceed 24h (excluding the row being edited on edits)
- Task must belong to the selected project
- Employees may only pick projects they are assigned to; managers may pick any project
- All fields except notes are required

**Manager "On behalf of" mode** (`/app/manager/entry/new`):
- Adds an **Employee** field at the top: avatar + name + role chip, magenta border on the field.
- The daily 24h cap shown and enforced is the employee's, not the manager's. Hint text reflects this ("Tharindu's daily budget · 4 / 24h").
- An audit banner (`--magenta-100` card) reads: "Audited action. This entry will be tagged `SUBMITTED_BY=RUWAN.J`. The 24-hour cap is applied to Tharindu's day, not yours."
- Action-bar caption uses Red Hat Mono: "RUWAN.J ON BEHALF OF TS · 19 MAY 14:08".
- The resulting entry is attributed to the selected employee.

---

### 04 · Weekly summary (`/app/weekly`)

**Purpose.** Project × day grid for the selected ISO week.

**Layout.**
- **Header bar.** Pill week stepper (chevron-left / "Week 21 · 18–24 May 2026" / chevron-right) + "This week" soft button + spacer + segmented "by project / by task" toggle (3px inset on `--ink-100`, active state is white with `0 1px 3px rgba(0,0,0,0.06)` shadow).
- **4-card stat strip** — Week total (magenta), Avg per workday, Top project, Submitted count.
- **Table card.**
  - Columns: Project (22%) | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Week (right-aligned).
  - Day headers stack the abbreviation (Display 600 12px) over the date (mono 10px ink-400).
  - Body cells: right-aligned, tabular nums; zero cells render as "—" in `--ink-300`; non-zero in `--ink-900` weight 600.
  - **Footer row** "Day total" on `--ink-50` background, with the grand total in the right cell using the big `Hours` component.

**Behavior.**
- ISO week boundaries are Monday–Sunday.
- Group-by toggle switches between project and task grouping; totals reconcile to the same grand total.
- Week navigator handles ISO week 53 and year boundaries.
- Manager view adds a "user" filter dropdown that defaults to All users.

---

### 05 · Timer (app-wide)

**The timer has no nav tab.** It is surfaced as a FAB in the bottom-right corner of every authenticated screen, and as a mini player in that same spot while running. The Stop & Save action opens a modal.

#### State A — Idle (FAB)
- 56px tall pill, `padding: 0 22px 0 18px`, `border-radius: 999px`, `var(--tropical-magenta)`, white text "Start timer" (Display 700 14.5px) with a small 30×30 round inner circle (`rgba(255,255,255,0.18)`) holding a white play icon.
- Shadow: `0 18px 40px rgba(173,26,172,0.36), 0 4px 10px rgba(11,11,18,0.10)`.
- Position: `right: 28px; bottom: 28px; z-index: 20`.

#### State B — Start picker (popover)
- Clicking the FAB opens a 360px popover that sits 28px from right edge, 96px from bottom (so it floats above the FAB).
- Card: white, 20px radius, `1px var(--ink-200)`, generous shadow.
- Contents:
  - Header row: magenta dot + "NEW TIMER" mono overline, close X.
  - **Project** field (white select with colored dot + chevron).
  - **Task** field (white select with chevron).
  - "RECENT" mono label, then a list of recent (project · task) pairs as tappable rows.
  - Primary **Start timer** button (full-width pill, magenta, play icon).
- A subtle backdrop scrim (`rgba(11,11,18,0.18)`) covers the page while open.

#### State C — Running (mini player)
- Same bottom-right anchor as the FAB. Pill-shaped media-player bar, min-width 460px.
- **Left:** 56×56 round project tile in the project color, with the 3-letter project code in white Red Hat Mono; subtle inset white ring (`inset 0 0 0 3px rgba(255,255,255,0.18)`).
- **Middle:**
  - Top line: 7×7 koha-red pulse dot (animated `tlPulse` keyframes: `box-shadow 0 0 0 3px` → `0 0 0 7px` rgba), Display 800 24px elapsed time `01:42:18` (tabular nums), mono "REC" badge.
  - Bottom line: "Upflex · Map redesign" Display 500 12.5px ink-600, single-line ellipsis.
- **Right:** 42×42 round Pause button (`var(--ink-100)`), then a 42px-tall Stop pill (`var(--ink-1000)` background, white text, stop-square icon + "Stop").

#### State D — Stop & save modal
- Full-screen scrim (`rgba(11,11,18,0.5)` + `backdrop-filter: blur(4px)`).
- 520px modal card, `var(--radius-2xl)` (24px), padding 32px, gap 18px.
- Header: "TIMER STOPPED" overline + close X.
- Title: "You worked 1h 42m on Upflex." (`a-h2`).
- Body sentence: "We rounded that to the nearest half-hour. Adjust hours or notes before saving, or discard if it was a mis-start."
- **Project tile row** on `--ink-50` background, 16px radius: 36×36 project chip | project · task name + mono "EXACT 1.70 h · ROUNDED TO 1.5 h" | hours stepper (− / 1.5 / +).
- Notes textarea (min-height 80px), pre-filled with what the user was doing.
- Footer: "Discard timer" ghost (left) | "Save as draft" soft + "Save & submit" primary (right).

#### Edge case — under 15 min
If elapsed time is under 15 minutes, the nearest 0.5h increment is 0, which is invalid. The modal must show a clear warning and present "Round up to 0.5" and "Discard" as explicit choices. Do **not** silently pre-fill 0.5.

---

### 06 · Approval queue (`/app/approvals`, manager only)

**Purpose.** Approve / reject / amend pending entries.

**Layout.**
1. **Stat strip** (4 cards):
   - **Pending** — dark card (`var(--ink-1000)` solid, white text, no border). Magenta "12" Display 900 44px + "entries · 32.5 h" white-60% 14px. Caption "Oldest waiting 6 hours" in white-55%.
   - **Approved today** — white card, big `Hours` 48.5h, 12px caption.
   - **Median response** — Display 800 38px "2.4 hrs", caption.
   - **Your team** — overlapping avatar stack (32×32, -6px margin-left, 2px white border), caption "6 active reports".
2. **Filters row** — segmented control over `--ink-100` pill (`Submitted 12` / `Approved 14` / `Rejected 2` / `Amended 3`), then "All users" soft button, "This week" soft button, spacer, "Approve visible" ghost button.
3. **Inbox card** — single white card, rows separated by `1px var(--ink-100)` borders. Each row uses a grid `40px 220px 1fr 90px auto`:
   - **Avatar** — 36×36 round, initials.
   - **User block** — Display 700 14px name; mono "TUE 19 MAY · 14M AGO" 10.5px ink-500.
   - **Entry block** — colored dot + project name (Display 600 13.5) + dot separator + task (13px ink-700); below, single-line ellipsis 12.5px ink-500 notes preview.
   - **Hours** — big `Hours` component.
   - **Action buttons** — Reject (soft, x icon, 6px 10px) + Approve (primary magenta, check icon, 6px 12px).

**Behavior.**
- Reject opens a modal with a required `manager_note` textarea (min 1 non-whitespace character). Validated on both client and server.
- Approve transitions the row to `approved` with no required note.
- A manager edit of an `approved` entry transitions its status to `amended` and becomes visually distinct (see Amended entry detail below).

---

### 07 · Manager admin & states

#### Projects admin (`/app/projects`)
**Layout.** 4-card stat strip (Active projects 14 / Logged this week 508 / Tasks 36 / Team 28), then a 2-column grid (`1.4fr 1fr`):

- **Projects table** (left): white card. Header bar with "All projects" h4 + Filter / Search soft buttons. Table columns:
  - **Project** — 32×32 colored square with 3-letter code in white mono, then Display 700 13.5px name and a mono "ACTIVE · ON TRACK" sub-label.
  - **Tasks** — `Hours` component (number).
  - **Members** — overlapping 24×24 avatar stack with "+N" extra chip in `--ink-200`.
  - **This wk** — `Hours` component.
  - chevron-right.
  - First row highlighted with `var(--magenta-100)`.

- **Project detail panel** (right): white card with a flat header (no gradient):
  - Top row: 32×32 project tile + "UPF · ACTIVE" overline + kebab.
  - Project name `a-h2`, then 13.5px ink-600 description.
  - **Tasks · 4** section: each task is a row on `--ink-50` with a magenta dot, name (Display 500 13.5), mono hours on the right. Plus a dashed "+ Add task" button.
  - **Assigned · 8** section: avatar chips (20×20 avatar + first name, ink-50 background, ink-200 border, 999px radius).

**Behavior / rules.**
- Project names are unique (case-insensitive). Task names are unique within a project (case-insensitive).
- A project with zero tasks does not appear in any employee project dropdown.
- Deactivated users do not appear in the assignment picker.
- A project or task with existing time entries cannot be deleted.

#### Amended entry detail (`/app/entries/:id` for amended entries)
**Purpose.** Show the user *what changed and why*. Read-only.

**Layout.** White card with a magenta banner across the top.
- **Banner** (`var(--magenta-100)` background, `var(--magenta-800)` text, 13.5px): edit-3 icon + "**Ruwan Jayasekera** amended this entry on **Tue 19 May, 14:08**. You cannot edit an amended entry; reach out if you'd like to discuss."
- **Header row.** Left: overline "Mon 18 May 2026 · Upflex" + h2 "Bookings API · Stripe migration". Right: `StatusPill amended`.
- **Compare card.** 2-column grid inside a 16px-radius border, no gradients:
  - **Original · you** (left) on `--ink-50`: Display 800 40px "5.0" with line-through in ink-300, "hours" 15px ink-500; mono "SUBMITTED MON 18 MAY 17:46".
  - **Amended · Ruwan J.** (right) on white: same scale but the number is magenta and not struck through; "AMENDED TUE 19 MAY 14:08" mono.
- **Your notes** block — `--ink-50` rounded box, 14px ink-800, line-height 1.55.
- **Manager note** block — `--magenta-100` rounded box with a 3px magenta left border, 14px magenta-800 copy.

---

### 08 · Mobile (iOS, 375pt design)

3-tab bottom navigation: **Today**, **Week**, **Me**. No timer tab. The timer is surfaced as a FAB above the tab bar and a docked mini player when running.

**Shell anatomy.**
- iOS status bar 38px, then a 52px top bar (logo+name on left, avatar on right; chevron-left + title + action on detail screens), content area, 76px tab bar with 134×4 home indicator pill.

**Screens included.**

- **Today · idle.** Big magenta-accent headline "**8.0h** logged today.", `Bar` showing 8/24 fill, then card list of entries (4px colored left rail | project · task + status pill | big hours). FAB sits at `bottom: 96px; right: 18px` (60×60 magenta round, white play icon, magenta glow shadow).
- **Today · timer running.** Same screen, FAB replaced by the **docked mini player** above the tab bar — full-width card (left/right inset 8px, bottom 76px), 40×40 project disc, koha-red pulse + elapsed time + project/task, pause and stop buttons (36×36). Content gets `padding-bottom: 86px` so the mini player doesn't cover entries.
- **Timer · expanded sheet.** Tapping the mini player opens a dark full-screen sheet:
  - Background `var(--ink-1000)`, white text.
  - Mono "RUNNING · STARTED 9:32 AM" overline.
  - **Big radial ring** (240×240): track `rgba(255,255,255,0.08)` stroke 14, progress `var(--tropical-magenta)` solid stroke 14, `strokeLinecap: round`. Center shows Display 900 44px elapsed + mono "OF YOUR DAY · 1.7 H".
  - Project label (colored dot + Display 800 22px project name) + task in white-65%.
  - Action row: 56px round edit button (ghost), **84px round white Stop button** (with `0 18px 48px rgba(255,255,255,0.25)` halo), 56px round pause button.
  - Bottom 56px area replaces the tab bar with a `chevron-down` minimize affordance (44×36 rounded chip).
- **Log time (mobile form).** Vertically stacked simple form: PROJECT select | TASK select | (HOURS stepper + DATE select in a 2-col row) | NOTES textarea | full-width primary "Save & submit" pinned to bottom + ghost "Save as draft" below.
- **Week.** Magenta hero total ("**18.5h** this week", caption "Avg X h per workday · N of N entries submitted"); a 7-column day-totals card with mono day labels; "BY PROJECT" mono label; project rows (colored rail | name + days-count caption | big hours).

---

## Status pill grammar (canonical)

Five canonical states, mapped 1:1 to the BRD §6.6 state machine. **Always** use both color *and* text — never color alone (a11y).

| Status | Background | Text | When |
|---|---|---|---|
| `draft` | `--ink-100` | `--ink-700` | New, not yet submitted |
| `submitted` | `--kingfisher-100` | `--kingfisher-800` | Awaiting manager review |
| `approved` | `#E6F4EC` | `#1F6E45` | Approved as-submitted |
| `rejected` | `--red-100` | `--red-600` | Sent back to user with note |
| `amended` | `--magenta-100` | `--magenta-800` | Manager edited an approved entry |

Pill anatomy: `padding: 4px 10px; border-radius: 999px; font: Red Hat Mono 10.5px / 600 / letter-spacing 0.06em / uppercase`. 6×6 round dot on the left in `currentColor`.

---

## Component library (lift these from `design/screens/shared.jsx`)

- **`<Sidebar active role timerRunning timer>`** — left nav. `role='employee'|'manager'` shows different nav sections.
- **`<Topbar title meta>{children}>`** — sticky top bar with title + mono meta + right-aligned children + search + bell icon buttons.
- **`<ProjectChip project task>`** — colored dot + project name; optional task in Red Hat Mono.
- **`<StatusPill status>`** — see grammar above.
- **`<Hours h big>`** — number + small `h`; `big` doubles the size and weight.
- **`<Bar pct color height>`** — inline progress bar (capped at 100%).
- **`<TimerFab>` / `<MiniPlayer>` / `<StartTimerPicker>`** — the timer's three modes (see Screen 05).
- **`<Field label hint>{children}>`**, **`<SelectField value icon dotColor>`**, **`<HoursStepper value>`** — form primitives.
- **Buttons** — `.btn` base, with modifiers `.btn-primary` (magenta), `.btn-dark` (ink-1000), `.btn-ghost` (transparent), `.btn-soft` (`--ink-100`). Sizes `.btn-sm`, `.btn-lg`. All pill-shaped (`border-radius: 999px`).
- **Cards** — `.card` (white, 16px radius, 1px ink-200 border) + `.card-pad` (24px padding).
- **Tables** — `.tbl` (full width, mono uppercase column headers on `--ink-50`, 1px ink-100 row dividers, `tr.hl` for highlighted rows with flat `--magenta-100` fill).

---

## Design tokens (resolve in `colors_and_type.css`)

### Color
**Brand:** `--tropical-magenta #AD1AAC`, `--kingfisher-blue #307FE2`, `--sky-blue #59CBE8`, `--paradise-pink #DF4661`, `--koha-red #E4002B`.
**Magenta tints:** 100 `#F7E8F7`, 200 `#EBC5EB`, 400 `#CE6BCD`, 600 `#B833B7`, 800 `#8E158D`.
**Kingfisher tints:** 100 `#E6F0FC`, 200 `#C2D9F7`, 400 `#74A8EC`, 600 `#2068C5`, 800 `#1A4F96`.
**Sky tints:** 100 `#EAF8FC`, 200 `#C9EDF6`, 400 `#8BDAEE`, 600 `#2FB0D2`, 800 `#1F7E97`.
**Pink/Red:** `--pink-100 #FCEBEE`, `--pink-600 #C6354F`, `--red-100 #FCE0E5`, `--red-600 #B80022`.
**Neutrals (ink):** 1000 `#0B0B12`, 900 `#15151D`, 800 `#2A2A36`, 700 `#3F3F50`, 600 `#5A5A6E`, 500 `#7B7B8E`, 400 `#A6A6B5`, 300 `#C9C9D3`, 200 `#E4E4EA`, 100 `#F1F1F4`, 50 `#F8F8FA`, white `#FFFFFF`.
**Status:** success `#2C9F69`, warning `#E8A33A`, danger `--koha-red`, info `--kingfisher-blue`.

### Typography
Family: **Red Hat Display** (300–900, normal + italic). Mono: **Red Hat Mono**.
Weights: light 300, regular 400, medium 500, semibold 600, bold 700, black 900.
Sizes (use the CSS classes / tokens, not raw px in app code):
`--fs-display-1 clamp(56,7.2vw,112)`, `--fs-display-2 clamp(44,5.4vw,80)`, `--fs-h1 clamp(36,4vw,56)`, `--fs-h2 clamp(28,3vw,40)`, `--fs-h3 24`, `--fs-h4 20`, `--fs-body-lg 18`, `--fs-body 16`, `--fs-body-sm 14`, `--fs-caption 12`, `--fs-overline 11`.
Line heights: tight 1.04, snug 1.18, normal 1.45, relaxed 1.6.
Tracking: tight `-0.02em`, snug `-0.01em`, overline `0.16em`, wide `0.04em`.

### Spacing (4px base)
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.

### Radii
xs 2, sm 4, md 8, lg 12, xl 16, 2xl 24, pill 999.

### Shadows
sm `0 1px 2px rgba(11,11,18,0.06), 0 1px 1px rgba(11,11,18,0.04)`
md `0 4px 14px rgba(11,11,18,0.08), 0 2px 4px rgba(11,11,18,0.04)`
lg `0 14px 40px rgba(11,11,18,0.12), 0 4px 8px rgba(11,11,18,0.05)`
xl `0 28px 80px rgba(11,11,18,0.18), 0 8px 16px rgba(11,11,18,0.06)`
focus `0 0 0 3px rgba(48,127,226,0.35)` (kingfisher)
brand `0 18px 50px rgba(173,26,172,0.28)`

### Motion
standard `cubic-bezier(0.2, 0.7, 0.2, 1)`
emphasis `cubic-bezier(0.16, 0.84, 0.24, 1.06)` — entrance only
exit `cubic-bezier(0.4, 0, 1, 1)`
durations: instant 80ms, quick 160ms, base 240ms, slow 400ms.

---

## Responsive behavior

- Single-column layout under 640px. Sidebar collapses to a hamburger / drawer at <768px.
- Tables must reflow to cards OR scroll horizontally *inside their container* (never push the page).
- Mobile breakpoint reference design is 375px (see Screen 08).
- Daily-log table at <768px → card list (4px colored rail + project · task + status + hours).
- Weekly grid at <768px → horizontally-scrollable inside its container.

---

## Accessibility

- All interactive elements keyboard reachable in logical tab order.
- ARIA labels on every input, button, and icon-only control.
- Status pills use color *and* text (never color alone).
- Modal focus trapping; Esc to close.
- Form errors announced via `aria-live="polite"` regions.
- Target Lighthouse accessibility ≥ 90 on daily log, weekly summary, approval queue, timer surfaces.

---

## Assets

- **Fonts.** Red Hat Display variable fonts (regular + italic) — bundled at `design/design_system/fonts/`. Red Hat Mono is loaded via Google Fonts (`@import` in `colors_and_type.css`).
- **Logos.** `calcey-logo.svg`, `calcey-logo-mono-white.svg`, `calcey-mark.svg` — bundled at `design/design_system/assets/`. The "Calcey Hours" wordmark used in the app is composed in code (lowercase "c" mark + "Calcey Hours" + magenta `.`) — not a separate SVG.
- **Icons.** Feather Icons, 2px stroke, 24px nominal. In React, use `react-feather` or `lucide-react`. Never fill icons; tint via `color: currentColor`.
- **Photography.** None required for MVP.

---

## Files in this handoff

```
design_handoff_calcey_hours/
├── README.md                                 ← you are here
├── design/
│   ├── Time Logging App.html                 ← root prototype (open in a browser)
│   ├── app.jsx                               ← canvas assembly (all screens)
│   ├── design-canvas.jsx                     ← canvas runtime (Figma-ish wrapper; not needed in prod)
│   ├── screens/
│   │   ├── shared.jsx                        ← Sidebar, Topbar, ProjectChip, StatusPill, Hours, Bar, TimerFab, MiniPlayer, StartTimerPicker
│   │   ├── auth.jsx                          ← Sign in
│   │   ├── daily-shared.jsx                  ← DailyHeader, DayToolbar, mock DAILY_ENTRIES
│   │   ├── daily-log.jsx                     ← Daily log table
│   │   ├── time-entry.jsx                    ← Time entry form + Field / SelectField / HoursStepper
│   │   ├── weekly-summary.jsx                ← Weekly table
│   │   ├── timer.jsx                         ← TimerIdleFAB / TimerPickerOpen / TimerRunningMini / TimerStopModal
│   │   ├── approvals.jsx                     ← Approval queue (inbox)
│   │   ├── projects-admin.jsx                ← Projects admin + OnBehalfOfEntry + AmendedEntryView
│   │   └── mobile.jsx                        ← MobileDailyLog / MobileDailyLogRunning / MobileTimer / MobileTimeEntry / MobileWeekly
│   └── design_system/
│       ├── colors_and_type.css               ← all design tokens (--*)
│       ├── fonts/                            ← Red Hat Display variable fonts
│       └── assets/                           ← Calcey logos (SVG)
└── source/
    ├── Time_Logging_App_BRD_v1.3.docx        ← business requirements
    └── time_logging_erd_v1_2.html            ← entity-relationship diagram (Mermaid)
```

## How to run the prototype

`design/Time Logging App.html` is self-contained (CDN React + Babel). Open it in a modern browser — no build step. Pan/zoom the canvas; double-click titles to rename; click the expand icon on an artboard to view it fullscreen.
