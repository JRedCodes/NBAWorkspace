import { useAuthStore } from '../../store/authStore'

export default function Home() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold">Welcome, {user?.displayName}</h1>
      <p className="mt-2 text-gray-400">Your workspace is ready. Features coming in Phase 2.</p>
    </div>
  )
}
