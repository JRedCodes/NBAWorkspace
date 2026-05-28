import type { Knex } from 'knex'

const teams = [
  { nba_team_id: 1610612737, name: 'Hawks', abbreviation: 'ATL', city: 'Atlanta', conference: 'East', division: 'Southeast' },
  { nba_team_id: 1610612738, name: 'Celtics', abbreviation: 'BOS', city: 'Boston', conference: 'East', division: 'Atlantic' },
  { nba_team_id: 1610612751, name: 'Nets', abbreviation: 'BKN', city: 'Brooklyn', conference: 'East', division: 'Atlantic' },
  { nba_team_id: 1610612766, name: 'Hornets', abbreviation: 'CHA', city: 'Charlotte', conference: 'East', division: 'Southeast' },
  { nba_team_id: 1610612741, name: 'Bulls', abbreviation: 'CHI', city: 'Chicago', conference: 'East', division: 'Central' },
  { nba_team_id: 1610612739, name: 'Cavaliers', abbreviation: 'CLE', city: 'Cleveland', conference: 'East', division: 'Central' },
  { nba_team_id: 1610612742, name: 'Mavericks', abbreviation: 'DAL', city: 'Dallas', conference: 'West', division: 'Southwest' },
  { nba_team_id: 1610612743, name: 'Nuggets', abbreviation: 'DEN', city: 'Denver', conference: 'West', division: 'Northwest' },
  { nba_team_id: 1610612765, name: 'Pistons', abbreviation: 'DET', city: 'Detroit', conference: 'East', division: 'Central' },
  { nba_team_id: 1610612744, name: 'Warriors', abbreviation: 'GSW', city: 'Golden State', conference: 'West', division: 'Pacific' },
  { nba_team_id: 1610612745, name: 'Rockets', abbreviation: 'HOU', city: 'Houston', conference: 'West', division: 'Southwest' },
  { nba_team_id: 1610612754, name: 'Pacers', abbreviation: 'IND', city: 'Indiana', conference: 'East', division: 'Central' },
  { nba_team_id: 1610612746, name: 'Clippers', abbreviation: 'LAC', city: 'Los Angeles', conference: 'West', division: 'Pacific' },
  { nba_team_id: 1610612747, name: 'Lakers', abbreviation: 'LAL', city: 'Los Angeles', conference: 'West', division: 'Pacific' },
  { nba_team_id: 1610612763, name: 'Grizzlies', abbreviation: 'MEM', city: 'Memphis', conference: 'West', division: 'Southwest' },
  { nba_team_id: 1610612748, name: 'Heat', abbreviation: 'MIA', city: 'Miami', conference: 'East', division: 'Southeast' },
  { nba_team_id: 1610612749, name: 'Bucks', abbreviation: 'MIL', city: 'Milwaukee', conference: 'East', division: 'Central' },
  { nba_team_id: 1610612750, name: 'Timberwolves', abbreviation: 'MIN', city: 'Minnesota', conference: 'West', division: 'Northwest' },
  { nba_team_id: 1610612740, name: 'Pelicans', abbreviation: 'NOP', city: 'New Orleans', conference: 'West', division: 'Southwest' },
  { nba_team_id: 1610612752, name: 'Knicks', abbreviation: 'NYK', city: 'New York', conference: 'East', division: 'Atlantic' },
  { nba_team_id: 1610612760, name: 'Thunder', abbreviation: 'OKC', city: 'Oklahoma City', conference: 'West', division: 'Northwest' },
  { nba_team_id: 1610612753, name: 'Magic', abbreviation: 'ORL', city: 'Orlando', conference: 'East', division: 'Southeast' },
  { nba_team_id: 1610612755, name: 'Sixers', abbreviation: 'PHI', city: 'Philadelphia', conference: 'East', division: 'Atlantic' },
  { nba_team_id: 1610612756, name: 'Suns', abbreviation: 'PHX', city: 'Phoenix', conference: 'West', division: 'Pacific' },
  { nba_team_id: 1610612757, name: 'Trail Blazers', abbreviation: 'POR', city: 'Portland', conference: 'West', division: 'Northwest' },
  { nba_team_id: 1610612758, name: 'Kings', abbreviation: 'SAC', city: 'Sacramento', conference: 'West', division: 'Pacific' },
  { nba_team_id: 1610612759, name: 'Spurs', abbreviation: 'SAS', city: 'San Antonio', conference: 'West', division: 'Southwest' },
  { nba_team_id: 1610612761, name: 'Raptors', abbreviation: 'TOR', city: 'Toronto', conference: 'East', division: 'Atlantic' },
  { nba_team_id: 1610612762, name: 'Jazz', abbreviation: 'UTA', city: 'Utah', conference: 'West', division: 'Northwest' },
  { nba_team_id: 1610612764, name: 'Wizards', abbreviation: 'WAS', city: 'Washington', conference: 'East', division: 'Southeast' },
]

export async function seed(knex: Knex): Promise<void> {
  await knex('teams').del()
  await knex('teams').insert(teams)
}
