export interface Team {
  id: string
  nba_team_id: number
  name: string
  abbreviation: string
  city: string
  conference: string
  division: string
  logo_url: string | null
}

export interface Player {
  id: string
  nba_player_id: number
  first_name: string
  last_name: string
  position: string
  jersey_number: string
  birth_date: string | null
  height_inches: number | null
  weight_lbs: number | null
  team_id: string | null
  team_name: string | null
  team_abbr: string | null
  team_logo: string | null
  // contract fields (on roster endpoint)
  annual_value?: number
  current_year_salary?: number
  years_remaining?: number
  has_player_option?: boolean
  has_team_option?: boolean
  is_two_way?: boolean
  is_rookie_scale?: boolean
  is_max?: boolean
}

export interface PlayerStats {
  id: string
  player_id: string
  season_year: string
  games_played: number
  minutes_per_game: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  fg_pct: number
  three_pct: number
  ft_pct: number
  true_shooting_pct: number
  usage_rate: number
  offensive_rating: number
  defensive_rating: number
  win_shares: number
  box_plus_minus: number
}

export interface PlayerMetrics {
  three_point_percentile: number
  rim_protection_score: number
  playmaking_score: number
  slashing_score: number
  rebounding_percentile: number
  poa_defense_score: number
  leadership_index: number
  data_completeness: 'full' | 'partial' | 'limited'
}

export interface TeamNeeds {
  threePoint: number
  rimProtection: number
  playmaking: number
  slashing: number
  rebounding: number
  poaDefense: number
  leadership: number
}

export interface TeamStats {
  offensive_rating: number
  defensive_rating: number
  net_rating: number
  pace: number
  wins: number
  losses: number
  playoff_seed: number | null
}

export interface PowerRanking {
  team_id: string
  rank: number
  previous_rank: number | null
  composite_score: number
  name: string
  abbreviation: string
  city: string
  logo_url: string | null
}

export interface CarouselTeam extends Team {
  power_rank: number | null
  previous_rank: number | null
  wins: number | null
  losses: number | null
  offensive_rating: number | null
  defensive_rating: number | null
  top_players: { name: string; position: string; nbaPlayerId: number | null }[]
  head_coach: string | null
}

export interface CBAViolation {
  code: string
  message: string
  teamId?: string
}

export interface TeamTradeSummary {
  teamId: string
  salaryOut: number
  salaryIn: number
  netChange: number
  isOverCap: boolean
  matchingRequired: boolean
  matchingMax: number
  matchingOk: boolean
}

export interface TradeValidationResult {
  isValid: boolean
  violations: CBAViolation[]
  teamSummaries: Record<string, TeamTradeSummary>
}

export interface TradeProjection {
  playersOut: { playerId: string; name: string; salary: number }[]
  playersIn: { playerId: string; name: string; salary: number }[]
  projectedPayroll: number
  isValid: boolean
}

export interface TradeProjectionResult {
  validation: TradeValidationResult
  projection: Record<string, TradeProjection>
}

export interface TradeScenario {
  id: string
  name: string
  status: string
  is_valid: boolean | null
  has_drift: boolean
  saved_at: string | null
  updated_at: string
}

export interface FitScore {
  overall: number
  breakdown: {
    three_point_percentile: number
    rim_protection_score: number
    playmaking_score: number
    slashing_score: number
    rebounding_percentile: number
    poa_defense_score: number
    leadership_index: number
  }
}

export interface Contract {
  id: string
  player_id: string
  team_id: string
  team_name: string
  annual_value: number
  current_year_salary: number
  years_remaining: number
  has_player_option: boolean
  has_team_option: boolean
  is_two_way: boolean
  is_rookie_scale: boolean
  is_max: boolean
}
