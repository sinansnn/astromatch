import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import { StarField } from '@/components/ui/StarField'
import '@/styles/globals.css'

// Pages
import { AuthPage }      from '@/pages/auth/AuthPage'
import { OnboardingPage } from '@/pages/auth/OnboardingPage'
import { AppLayout }     from '@/pages/app/AppLayout'
import { DiscoverPage }  from '@/pages/app/DiscoverPage'
import { MatchesPage }   from '@/pages/app/MatchesPage'
import { ChatPage }      from '@/pages/app/ChatPage'
import { ChartPage }     from '@/pages/app/ChartPage'
import { ProfilePage }   from '@/pages/app/ProfilePage'
import { DailyPage }     from '@/pages/app/DailyPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, initialized } = useAuthStore()
  if (!initialized) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  if (user && !profile?.profile_complete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center animate-fade-in">
        <div className="text-5xl mb-4 animate-float">✨</div>
        <p className="font-display text-stellar-lavender text-lg tracking-widest">ASTROMATCH</p>
      </div>
    </div>
  )
}

export default function App() {
  const initialize = useAuthStore(s => s.initialize)

  useEffect(() => { initialize() }, [initialize])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="relative h-full" style={{ background: 'linear-gradient(160deg, #0A0A1A 0%, #0D0A24 40%, #0A0E1A 100%)' }}>
          <StarField />

          <div className="relative z-10 h-full max-w-md mx-auto">
            <Routes>
              <Route path="/auth"        element={<AuthPage />} />
              <Route path="/onboarding"  element={<OnboardingPage />} />
              <Route path="/app"         element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index             element={<Navigate to="daily" replace />} />
                <Route path="daily"      element={<DailyPage />} />
                <Route path="discover"   element={<DiscoverPage />} />
                <Route path="matches"    element={<MatchesPage />} />
                <Route path="chat/:id"   element={<ChatPage />} />
                <Route path="chart"      element={<ChartPage />} />
                <Route path="profile"    element={<ProfilePage />} />
              </Route>
              <Route path="*"            element={<Navigate to="/auth" replace />} />
            </Routes>
          </div>

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1A1A35',
                color: '#E8E8F8',
                border: '1px solid rgba(232,197,255,0.15)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
