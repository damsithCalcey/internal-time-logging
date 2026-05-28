import { useAuth } from '@/features/auth/AuthProvider'
import { useLogout } from '@/features/auth/useLogout'
import { BarChart2, Calendar, Folder, Inbox, List, LogOut, MoreVertical, Users } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  badge?: number
}

const EMPLOYEE_ITEMS: NavItem[] = [
  { to: '/app/daily', label: 'Daily log', icon: Calendar },
  { to: '/app/weekly', label: 'Weekly summary', icon: BarChart2 },
  { to: '/app/entries', label: 'My entries', icon: List },
]

const MANAGER_ITEMS: NavItem[] = [
  { to: '/app/approvals', label: 'Approval queue', icon: Inbox },
  { to: '/app/projects', label: 'Projects', icon: Folder },
  { to: '/app/team', label: 'Team', icon: Users },
]

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-all duration-[160ms]',
          'font-display cursor-pointer text-sm font-semibold',
          isActive ? 'nav-item-active' : 'text-white/75 hover:bg-white/[0.06] hover:text-white',
        ].join(' ')
      }
    >
      <item.icon size={18} />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && (
        <span
          className="bg-tropical-magenta rounded-full font-mono font-semibold text-white"
          style={{ fontSize: 10.5, padding: '2px 7px', letterSpacing: 0 }}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  )
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const logout = useLogout()

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <aside
      className="flex h-full flex-col gap-6 text-white"
      style={{
        width: 248,
        background: 'var(--ink-1000)',
        padding: '24px 18px',
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 py-1" onClick={onClose}>
        <div className="bg-tropical-magenta flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px]">
          <span
            className="font-display font-black text-white"
            style={{ fontSize: 18, letterSpacing: '-0.04em' }}
          >
            c
          </span>
        </div>
        <span
          className="font-display font-extrabold"
          style={{ fontSize: 18, letterSpacing: '-0.02em' }}
        >
          Calcey Hours<span className="text-tropical-magenta">.</span>
        </span>
      </div>

      {/* Log time section */}
      <div>
        <p
          className="mb-2 px-2 font-mono font-semibold uppercase"
          style={{ fontSize: 10.5, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.4)' }}
        >
          Log time
        </p>
        <nav className="flex flex-col gap-0.5">
          {EMPLOYEE_ITEMS.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>
      </div>

      {/* Manage section — manager only */}
      {user?.role === 'manager' && (
        <div>
          <p
            className="mb-2 px-2 font-mono font-semibold uppercase"
            style={{ fontSize: 10.5, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.4)' }}
          >
            Manage
          </p>
          <nav className="flex flex-col gap-0.5">
            {MANAGER_ITEMS.map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </nav>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User chip */}
      <div
        className="flex items-center gap-2.5 rounded-[12px] p-2.5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="font-display flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
          style={{
            fontSize: 13,
            letterSpacing: '-0.01em',
            background:
              user?.role === 'manager'
                ? 'linear-gradient(135deg, var(--ink-600), var(--ink-900))'
                : 'linear-gradient(135deg, var(--paradise-pink), var(--magenta-800))',
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display truncate font-semibold text-white" style={{ fontSize: 13.5 }}>
            {user?.fullName ?? '—'}
          </p>
          <p
            className="truncate font-mono"
            style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}
          >
            {user?.role === 'manager' ? 'Manager' : 'Employee'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex-shrink-0 opacity-50 transition-opacity hover:opacity-100"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={14} color="rgba(255,255,255,0.9)" />
        </button>
        <MoreVertical size={14} color="rgba(255,255,255,0.5)" />
      </div>
    </aside>
  )
}
