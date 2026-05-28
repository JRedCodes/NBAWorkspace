import db from '../../config/db'

export const draftQueries = {
  getProspects(filters: {
    position?: string
    school?: string
    minRank?: number
    maxRank?: number
    draftYear?: number
  }) {
    const year = filters.draftYear ?? 2025
    const query = db('prospects as p')
      .leftJoin('prospect_computed_scores as s', 'p.id', 's.prospect_id')
      .where('p.draft_year', year)
      .select(
        'p.*',
        's.shooting_score', 's.size_score', 's.defense_score',
        's.upside_score', 's.readiness_score', 's.overall_model_score',
        's.model_rank', 's.data_completeness as score_completeness',
      )
      .orderBy(db.raw('COALESCE(p.projected_pick, 999)'))

    if (filters.position) query.where('p.position', filters.position)
    if (filters.school) query.whereILike('p.school', `%${filters.school}%`)
    if (filters.minRank) query.where('p.projected_pick', '>=', filters.minRank)
    if (filters.maxRank) query.where('p.projected_pick', '<=', filters.maxRank)

    return query
  },

  getProspectById(id: string) {
    return db('prospects as p')
      .leftJoin('prospect_computed_scores as s', 'p.id', 's.prospect_id')
      .where('p.id', id)
      .select('p.*', 's.*')
      .first()
  },

  getDraftOrder(season = '2025-26') {
    return db('team_season_stats as tss')
      .join('teams as t', 'tss.team_id', 't.id')
      .leftJoin(
        db('power_rankings').distinctOn('team_id').orderBy('team_id').orderBy('computed_at', 'desc').as('pr'),
        't.id', 'pr.team_id',
      )
      .where('tss.season_year', season)
      .select(
        't.id as team_id', 't.name', 't.abbreviation', 't.city',
        'tss.wins', 'tss.losses', 'tss.playoff_seed',
        'pr.rank as power_rank',
      )
      .orderBy('tss.wins')  // worst record picks first
  },

  getBoardsByWorkspace(workspaceId: string) {
    return db('draft_boards')
      .where({ workspace_id: workspaceId })
      .orderBy('updated_at', 'desc')
      .select('id', 'name', 'is_model_default', 'created_at', 'updated_at')
  },

  getBoardWithEntries(id: string) {
    return db('draft_board_entries as e')
      .join('prospects as p', 'e.prospect_id', 'p.id')
      .leftJoin('prospect_computed_scores as s', 'p.id', 's.prospect_id')
      .where('e.board_id', id)
      .select(
        'e.id as entry_id', 'e.custom_rank', 'e.model_rank', 'e.user_notes',
        'p.*',
        's.overall_model_score', 's.shooting_score', 's.size_score',
        's.upside_score', 's.defense_score', 's.readiness_score',
      )
      .orderBy(db.raw('COALESCE(e.custom_rank, e.model_rank, 999)'))
  },

  async createBoard(workspaceId: string, name: string): Promise<{ id: string }> {
    const [board] = await db('draft_boards')
      .insert({ workspace_id: workspaceId, name })
      .returning('id')
    return board
  },

  async seedBoardWithModelRanks(boardId: string, draftYear = 2025): Promise<void> {
    const prospects = await db('prospects as p')
      .leftJoin('prospect_computed_scores as s', 'p.id', 's.prospect_id')
      .where('p.draft_year', draftYear)
      .orderBy(db.raw('COALESCE(s.model_rank, p.projected_pick, 999)'))
      .select('p.id', db.raw('COALESCE(s.model_rank, p.projected_pick, 999) as rank'))

    const entries = prospects.map((p, i) => ({
      board_id: boardId,
      prospect_id: p.id,
      custom_rank: i + 1,
      model_rank: p.rank,
    }))

    if (entries.length > 0) {
      await db('draft_board_entries').insert(entries)
    }
  },

  updateBoardName(id: string, name: string) {
    return db('draft_boards').where({ id }).update({ name, updated_at: db.fn.now() })
  },

  async replaceRankings(boardId: string, rankings: { prospectId: string; rank: number }[]) {
    await db.transaction(async (trx) => {
      for (const r of rankings) {
        await trx('draft_board_entries')
          .where({ board_id: boardId, prospect_id: r.prospectId })
          .update({ custom_rank: r.rank })
      }
      await trx('draft_boards').where({ id: boardId }).update({ updated_at: db.fn.now() })
    })
  },

  updateEntry(boardId: string, prospectId: string, data: { custom_rank?: number; user_notes?: string }) {
    return db('draft_board_entries')
      .where({ board_id: boardId, prospect_id: prospectId })
      .update(data)
  },

  deleteBoard(id: string) {
    return db('draft_boards').where({ id }).delete()
  },

  getWorkspaceId(userId: string) {
    return db('workspaces').where({ user_id: userId }).select('id').first()
  },
}
