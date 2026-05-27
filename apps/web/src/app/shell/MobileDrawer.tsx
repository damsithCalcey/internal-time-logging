import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface Props {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: Props) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(11,11,18,0.55)', animation: 'fade-in 160ms ease' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 left-0 bottom-0 z-50 flex flex-col"
        style={{ animation: 'slide-in-left 200ms cubic-bezier(0.2,0.7,0.2,1)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <Sidebar onClose={onClose} />

        {/* Close button overlaid in top-right of drawer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-[-48px] w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          aria-label="Close navigation"
        >
          <X size={18} color="#fff" />
        </button>
      </div>
    </>
  )
}
