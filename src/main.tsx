import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './index.css'

const MagicLinkLogin = lazy(() => import('./components/auth/MagicLinkLogin'))

// Root gate: the whole app renders only for a signed-in @att.com user.
// One uniform wrapper across all four AT&T prototypes — see cloud-connect
// docs/superpowers/plans/2026-08-01-att-email-gate-rollout.md.
function Gate() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-2 border-[#0057b8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) {
    return (
      <Suspense fallback={null}>
        <MagicLinkLogin />
      </Suspense>
    )
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <Gate />
  </AuthProvider>
)
