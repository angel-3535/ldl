import { Link, Outlet, createRootRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { useConfiguredHotkey } from '../hotkeys'

function AppLayout() {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  useConfiguredHotkey('openSettings', () => {
    navigate({ to: '/settings' })
  })

  useConfiguredHotkey('goToCanvas', () => {
    navigate({ to: '/' })
  })

  useConfiguredHotkey('goToBuilds', () => {
    navigate({ to: '/build' })
  })

  useConfiguredHotkey('goToDummies', () => {
    navigate({ to: '/dummy' })
  })

  return (
    <div className="app-shell">
      <Link to="/settings" className={`app-settings-fab ${pathname === '/settings' ? 'active' : ''}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
        </svg>
      </Link>
      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({
  component: AppLayout,
})
