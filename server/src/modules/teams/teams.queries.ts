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
      .where('pcm.season_year', '2024-25')
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

  getCarousel() {
    return db('teams as t')
      .leftJoin(
        db('power_rankings').distinctOn('team_id').orderBy('team_id').orderBy('computed_at', 'desc').as('pr'),
        't.id', 'pr.team_id',
      )
      .leftJoin(
        db('team_season_stats').where({ season_year: '2024-25' }).as('tss'),
        't.id', 'tss.team_id',
      )
      .select(
        't.id', 't.name', 't.abbreviation', 't.city', 't.conference', 't.logo_url',
        'pr.rank as power_rank', 'pr.previous_rank',
        'tss.wins', 'tss.losses',
      )
      .orderBy('pr.rank')
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
