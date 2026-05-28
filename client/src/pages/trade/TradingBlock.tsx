import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScenarios, useDeleteScenario } from '../../hooks/useTrade'
import { useTradeStore } from '../../store/tradeStore'
import type { TradeScenario } from '../../types'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TradingBlock() {
  const navigate = useNavigate()
  const clearTrade = useTradeStore((s) => s.clearTrade)
  const { data: scenarios = [], isLoading } = useScenarios()
  const deleteScenario = useDeleteScenario()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleNewTrade() {
    clearTrade()
    navigate('/trade/machine')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Trading Block</h1>
        <button
          onClick={handleNewTrade}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          + New Trade
        </button>
      </div>

      {/* Saved scenarios */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Saved Scenarios
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-16 animate-pulse" />
            ))}
          </div>
        ) : scenarios.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 border-dashed rounded-lg p-10 text-center text-gray-600">
            <p className="text-lg mb-1">No saved trades yet</p>
            <p className="text-sm">Build a trade and save it as a scenario</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scenarios.map((s: TradeScenario) => (
              <div
                key={s.id as string}
                className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-4 flex items-center gap-4 transition-colors"
              >
                {/* Validity badge */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  s.has_drift ? 'bg-yellow-400' :
                  s.is_valid === true ? 'bg-green-400' :
                  s.is_valid === false ? 'bg-red-400' : 'bg-gray-600'
                }`} />

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/trade/machine`)}
                    className="text-white font-medium hover:text-blue-400 transition-colors text-left"
                  >
                    {s.name}
                  </button>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.saved_at ? `Saved ${formatDate(s.saved_at)}` : `Draft · ${formatDate(s.updated_at)}`}
                    {s.has_drift && <span className="ml-2 text-yellow-500">⚠ Drift detected</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/trade/machine')}
                    className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
                  >
                    Open
                  </button>
                  {confirmDelete === s.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          deleteScenario.mutate(s.id)
                          setConfirmDelete(null)
                        }}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(s.id)}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-gray-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
