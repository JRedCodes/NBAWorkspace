import db from '../../config/db'
import { AppError } from '../../middleware/errorHandler'

export const workspaceService = {
  async getWorkspace(userId: string) {
    const workspace = await db('workspaces').where({ user_id: userId }).first()
    if (!workspace) throw new AppError(404, 'Workspace not found')

    const [scenarios, boards] = await Promise.all([
      db('trade_scenarios').where({ workspace_id: workspace.id }).count('* as n').first(),
      db('draft_boards').where({ workspace_id: workspace.id }).count('* as n').first(),
    ])

    return {
      id: workspace.id,
      name: workspace.name,
      last_accessed: workspace.last_accessed,
      scenario_count: Number(scenarios?.n ?? 0),
      board_count: Number(boards?.n ?? 0),
    }
  },

  async resetWorkspace(userId: string) {
    const workspace = await db('workspaces').where({ user_id: userId }).first()
    if (!workspace) throw new AppError(404, 'Workspace not found')

    // Delete all user data in this workspace — scenarios, boards, alerts
    await db('drift_alerts')
      .whereIn('scenario_id',
        db('trade_scenarios').where({ workspace_id: workspace.id }).select('id'),
      )
      .delete()
    await db('trade_scenario_picks').whereIn('scenario_id',
      db('trade_scenarios').where({ workspace_id: workspace.id }).select('id'),
    ).delete()
    await db('trade_scenario_players').whereIn('scenario_id',
      db('trade_scenarios').where({ workspace_id: workspace.id }).select('id'),
    ).delete()
    await db('trade_scenario_teams').whereIn('scenario_id',
      db('trade_scenarios').where({ workspace_id: workspace.id }).select('id'),
    ).delete()
    await db('trade_scenarios').where({ workspace_id: workspace.id }).delete()

    await db('draft_board_entries').whereIn('board_id',
      db('draft_boards').where({ workspace_id: workspace.id }).select('id'),
    ).delete()
    await db('draft_boards').where({ workspace_id: workspace.id }).delete()

    await db('workspaces').where({ id: workspace.id }).update({ last_accessed: db.fn.now() })

    return { reset: true }
  },
}
