import db from '../../config/db'

export const teamsQueries = {
  getAll() {
    return db('teams').select('*').orderBy('conference').orderBy('name')
  },

  getById(id: string) {
    return db('teams').where({ id }).first()
  },

  getRoster(teamId: string) {
    return db('players as p')
      .join('contracts as c', 'p.id', 'c.player_id')
      .where('p.team_id', teamId)
      .where('p.status', 'active')
      .select(
        'p.id', 'p.nba_player_id', 'p.first_name', 'p.last_name',
        'p.position', 'p.jersey_number', 'p.birth_date',
        'p.height_inches', 'p.weight_lbs',
        'c.annual_value', 'c.current_year_salary', 'c.years_remaining',
        'c.has_player_option', 'c.has_team_option',
        'c.is_two_way', 'c.is_rookie_scale', 'c.is_max',
      )
      .orderBy('p.last_name')
  },

  getStaff(teamId: string) {
    return Promise.all([
      db('coaches').where({ team_id: teamId }).orderBy('role'),
      db('front_office').where({ team_id: teamId }).orderBy('title'),
    ]).then(([coaches, frontOffice]) => ({ coaches, frontOffice }))
  },

  getCapSheet(teamId: string) {
    return db('team_cap_sheet').where({ team_id: teamId }).orderBy('season_year', 'desc').first()
  },

  getFutureSalaries(teamId: string) {
    return db('future_salaries as fs')
      .join('contracts as c', 'fs.contract_id', 'c.id')
      .join('players as p', 'c.player_id', 'p.id')
      .where('c.team_id', teamId)
      .select(
        'p.id as player_id', 'p.first_name', 'p.last_name',
        'fs.season_year', 'fs.salary', 'fs.is_player_option', 'fs.is_team_option',
      )
      .orderBy('fs.season_year')
  },

  getPicks(teamId: string) {
    return db('draft_picks as dp')
      .join('teams as ot', 'dp.original_team_id', 'ot.id')
      .leftJoin('teams as owt', 'dp.owed_to_team_id', 'owt.id')
      .where('dp.current_owner_id', teamId)
      .select(
        'dp.*',
        'ot.abbreviation as original_team_abbr',
        'owt.abbreviation as owed_to_abbr',
      )
      .orderBy('dp.draft_year')
      .orderBy('dp.round')
  },

  getStats(teamId: string, season?: string) {
    const query = db('team_season_stats').where({ team_id: teamId })
    if (season) query.where({ season_year: season })
    return query.orderBy('season_year', 'desc').first()
  },

  getNeeds(teamId: string) {
    return db('player_computed_metrics as pcm')
      .join('players as p', 'pcm.player_id', 'p.id')
      .where('p.team_id', teamId)
      .where('pcm.season_year', '2025-26')
      .select(
        'pcm.three_point_percentile',
        'pcm.rim_protection_score',
        'pcm.playmaking_score',
        'pcm.slashing_score',
        'pcm.rebounding_percentile',
        'pcm.poa_defense_score',
        'pcm.leadership_index',
      )
  },

  getAnalytics(teamId: string) {
    return Promise.all([
      db('team_season_stats').where({ team_id: teamId }).orderBy('season_year', 'desc').limit(3),
      db('power_rankings').where({ team_id: teamId }).orderBy('computed_at', 'desc').first(),
    ]).then(([statsHistory, powerRank]) => ({ statsHistory, powerRank }))
  },

  async getCarousel(season = '2025-26') {
    // Base team + power rank + record
    const teams = await db.raw(`
      SELECT
        t.id, t.name, t.abbreviation, t.city, t.conference, t.division, t.logo_url,
        pr.rank        AS power_rank,
        pr.previous_rank,
        tss.wins,
        tss.losses,
        tss.offensive_rating,
        tss.defensive_rating
      FROM teams t
      LEFT JOIN LATERAL (
        SELECT rank, previous_rank
        FROM power_rankings
        WHERE team_id = t.id
        ORDER BY computed_at DESC
        LIMIT 1
      ) pr ON true
      LEFT JOIN team_season_stats tss
        ON tss.team_id = t.id AND tss.season_year = :season
      ORDER BY pr.rank ASC NULLS LAST, t.name
    `, { season })

    // Top 5 players per team by minutes played
    const players = await db.raw(`
      SELECT
        p.team_id,
        p.nba_player_id,
        p.first_name || ' ' || p.last_name AS name,
        p.position,
        pss.minutes_per_game,
        ROW_NUMBER() OVER (
          PARTITION BY p.team_id
          ORDER BY COALESCE(pss.minutes_per_game, 0) DESC
        ) AS rn
      FROM players p
      LEFT JOIN player_season_stats pss
        ON pss.player_id = p.id AND pss.season_year = :season
      WHERE p.status = 'active' AND p.team_id IS NOT NULL
    `, { season })

    // Head coach per team
    const coaches = await db('coaches')
      .where({ role: 'Head Coach' })
      .select('team_id', 'name')

    const top5Map: Record<string, { name: string; position: string; nbaPlayerId: number | null }[]> = {}
    for (const p of players.rows) {
      if (p.rn <= 5) {
        if (!top5Map[p.team_id]) top5Map[p.team_id] = []
        top5Map[p.team_id].push({ name: p.name, position: p.position, nbaPlayerId: p.nba_player_id })
      }
    }

    const coachMap: Record<string, string> = {}
    for (const c of coaches) {
      coachMap[c.team_id] = c.name
    }

    return teams.rows.map((t: Record<string, unknown>) => ({
      ...t,
      top_players: top5Map[t.id as string] ?? [],
      head_coach: coachMap[t.id as string] ?? null,
    }))
  },

  getPowerRankings() {
    return db('power_rankings as pr')
      .join('teams as t', 'pr.team_id', 't.id')
      .distinctOn('pr.team_id')
      .orderBy('pr.team_id')
      .orderBy('pr.computed_at', 'desc')
      .select('pr.*', 't.name', 't.abbreviation', 't.city', 't.logo_url')
      .then((rows) => rows.sort((a, b) => a.rank - b.rank))
  },
}
