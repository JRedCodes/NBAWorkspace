import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthGuard } from './components/layout/AuthGuard'
import { Navbar } from './components/layout/Navbar'
import { useWorkerUpdates } from './hooks/useWorkerUpdates'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/home/Home'
import LeagueView from './pages/league/LeagueView'
import TeamView from './pages/league/TeamView'
import PlayerView from './pages/players/PlayerView'

function AuthenticatedLayout() {
  useWorkerUpdates()
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<AuthGuard />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/league" element={<LeagueView />} />
          <Route path="/league/team/:teamId" element={<TeamView />} />
          <Route path="/players/:playerId" element={<PlayerView />} />
          <Route path="/trade" element={<div className="p-8 text-gray-400">Trading Block — Phase 3</div>} />
          <Route path="/draft" element={<div className="p-8 text-gray-400">Draft Board — Phase 5</div>} />
          <Route path="/simulation" element={<div className="p-8 text-gray-400">Simulation — Phase 6</div>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
