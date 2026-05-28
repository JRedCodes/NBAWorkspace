import db from '../../config/db'

export const playersQueries = {
  search(q: string) {
    return db('players as p')
      .leftJoin('teams as t', 'p.team_id', 't.id')
      .where(db.raw("LOWER(p.first_name || ' ' || p.last_name) LIKE ?", [`%${q.toLowerCase()}%`]))
      .where('p.status', 'active')
      .select('p.id', 'p.first_name', 'p.last_name', 'p.position', 't.abbreviation as team_abbr', 't.id as team_id')
      .limit(20)
  },

  getById(id: string) {
    return db('players as p')
      .leftJoin('teams as t', 'p.team_id', 't.id')
      .where('p.id', id)
      .select('p.*', 't.name as team_name', 't.abbreviation as team_abbr', 't.logo_url as team_logo')
      .first()
  },

  getStats(playerId: string, season?: string) {
    const query = db('player_season_stats').where({ player_id: playerId })
    if (season) query.where({ season_year: season })
    return query.orderBy('season_year', 'desc')
  },

  getMetrics(playerId: string) {
    return db('player_computed_metrics')
      .where({ player_id: playerId })
      .orderBy('season_year', 'desc')
      .first()
  },

  getFitForTeam(playerId: string, teamId: string) {
    return db('player_computed_metrics')
      .where({ player_id: playerId })
      .orderBy('season_year', 'desc')
      .first()
      .then((row) => {
        if (!row?.fit_score_cache) return null
        const cache = typeof row.fit_score_cache === 'string'
          ? JSON.parse(row.fit_score_cache)
          : row.fit_score_cache
        return cache[teamId] ?? null
      })
  },

  getFitAll(playerId: string) {
    return db('player_computed_metrics')
      .where({ player_id: playerId })
      .orderBy('season_year', 'desc')
      .first()
      .then((row) => {
        if (!row?.fit_score_cache) return {}
        return typeof row.fit_score_cache === 'string'
          ? JSON.parse(row.fit_score_cache)
          : row.fit_score_cache
      })
  },

  getContract(playerId: string) {
    return db('contracts as c')
      .join('players as p', 'c.player_id', 'p.id')
      .join('teams as t', 'c.team_id', 't.id')
      .where('c.player_id', playerId)
      .select('c.*', 'p.first_name', 'p.last_name', 't.name as team_name')
      .first()
  },

  getShotChart(playerId: string, filters: Record<string, string>) {
    const query = db('shot_chart_entries').where({ player_id: playerId })
    if (filters.season) query.where({ season_year: filters.season })
    if (filters.shot_type) query.where({ shot_type: filters.shot_type })
    if (filters.period) query.where({ period: parseInt(filters.period) })
    if (filters.is_home !== undefined) query.where({ is_home: filters.is_home === 'true' })
    if (filters.team_won !== undefined) query.where({ team_won: filters.team_won === 'true' })
    return query.select('loc_x', 'loc_y', 'shot_made', 'shot_type', 'shot_distance', 'period')
  },

  getShotZones(playerId: string, season?: string) {
    const query = db('shot_chart_entries').where({ player_id: playerId })
    if (season) query.where({ season_year: season })
    return query
      .select('shot_type')
      .count('* as attempts')
      .sum(db.raw('CASE WHEN shot_made THEN 1 ELSE 0 END as makes'))
      .groupBy('shot_type')
  },
}
