"""
Ingests player and team season stats from nba_api.
Runs every 6h +30min. Triggers compute_player_metrics.py and compute_power_rankings.py.
"""
import sys
import logging
from lib.db import fetchall, execute
from lib.nba_client import (
    get_league_player_stats,
    get_league_player_stats_advanced,
    get_league_team_stats,
    get_standings,
)
# Cache invalidation skipped in ingest_stats — Redis unreachable from Python workers
# in this dev environment. Stats cache expires naturally via TTL (6h).

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CURRENT_SEASON = '2024-25'


def get_player_id_map() -> dict[int, str]:
    rows = fetchall('SELECT id, nba_player_id FROM players')
    return {r['nba_player_id']: r['id'] for r in rows}


def get_team_id_map() -> dict[int, str]:
    rows = fetchall('SELECT id, nba_team_id FROM teams')
    return {r['nba_team_id']: r['id'] for r in rows}


def ingest_player_stats(player_id_map: dict):
    logger.info('Fetching per-game stats...')
    per_game = get_league_player_stats(CURRENT_SEASON, 'PerGame')
    logger.info('Fetching advanced stats...')
    advanced = get_league_player_stats_advanced(CURRENT_SEASON)

    advanced_map = {r['PLAYER_ID']: r for r in advanced}

    ingested = 0
    for row in per_game:
        nba_pid = row.get('PLAYER_ID')
        db_pid = player_id_map.get(nba_pid)
        if not db_pid:
            continue

        adv = advanced_map.get(nba_pid, {})

        execute("""
            INSERT INTO player_season_stats (
                player_id, season_year, games_played, minutes_per_game,
                points, rebounds, assists, steals, blocks,
                fg_pct, three_pct, ft_pct, true_shooting_pct, usage_rate,
                offensive_rating, defensive_rating,
                win_shares, box_plus_minus, vorp
            ) VALUES (
                :player_id, :season_year, :games_played, :minutes_per_game,
                :points, :rebounds, :assists, :steals, :blocks,
                :fg_pct, :three_pct, :ft_pct, :true_shooting_pct, :usage_rate,
                :offensive_rating, :defensive_rating,
                :win_shares, :box_plus_minus, :vorp
            )
            ON CONFLICT (player_id, season_year) DO UPDATE SET
                games_played = EXCLUDED.games_played,
                minutes_per_game = EXCLUDED.minutes_per_game,
                points = EXCLUDED.points,
                rebounds = EXCLUDED.rebounds,
                assists = EXCLUDED.assists,
                steals = EXCLUDED.steals,
                blocks = EXCLUDED.blocks,
                fg_pct = EXCLUDED.fg_pct,
                three_pct = EXCLUDED.three_pct,
                ft_pct = EXCLUDED.ft_pct,
                true_shooting_pct = EXCLUDED.true_shooting_pct,
                usage_rate = EXCLUDED.usage_rate,
                offensive_rating = EXCLUDED.offensive_rating,
                defensive_rating = EXCLUDED.defensive_rating,
                win_shares = EXCLUDED.win_shares,
                box_plus_minus = EXCLUDED.box_plus_minus,
                vorp = EXCLUDED.vorp,
                updated_at = now()
        """, {
            'player_id': db_pid,
            'season_year': CURRENT_SEASON,
            'games_played': row.get('GP', 0),
            'minutes_per_game': row.get('MIN'),
            'points': row.get('PTS'),
            'rebounds': row.get('REB'),
            'assists': row.get('AST'),
            'steals': row.get('STL'),
            'blocks': row.get('BLK'),
            'fg_pct': row.get('FG_PCT'),
            'three_pct': row.get('FG3_PCT'),
            'ft_pct': row.get('FT_PCT'),
            'true_shooting_pct': adv.get('TS_PCT'),
            'usage_rate': adv.get('USG_PCT'),
            'offensive_rating': adv.get('OFF_RATING'),
            'defensive_rating': adv.get('DEF_RATING'),
            # win_shares, box_plus_minus, vorp are BBRef stats — not available from nba_api
            'win_shares': None,
            'box_plus_minus': None,
            'vorp': None,
        })

        ingested += 1

    logger.info(f'Player stats ingested: {ingested}')


def ingest_team_stats(team_id_map: dict):
    logger.info('Fetching team stats...')
    team_stats = get_league_team_stats(CURRENT_SEASON)
    standings = get_standings(CURRENT_SEASON)
    standings_map = {r['TeamID']: r for r in standings}

    for row in team_stats:
        nba_tid = row.get('TEAM_ID')
        db_tid = team_id_map.get(nba_tid)
        if not db_tid:
            continue

        s = standings_map.get(nba_tid, {})

        execute("""
            INSERT INTO team_season_stats (
                team_id, season_year, offensive_rating, defensive_rating,
                net_rating, pace, wins, losses, playoff_seed
            ) VALUES (
                :team_id, :season_year, :off_rtg, :def_rtg,
                :net_rtg, :pace, :wins, :losses, :seed
            )
            ON CONFLICT (team_id, season_year) DO UPDATE SET
                offensive_rating = EXCLUDED.offensive_rating,
                defensive_rating = EXCLUDED.defensive_rating,
                net_rating = EXCLUDED.net_rating,
                pace = EXCLUDED.pace,
                wins = EXCLUDED.wins,
                losses = EXCLUDED.losses,
                playoff_seed = EXCLUDED.playoff_seed,
                updated_at = now()
        """, {
            'team_id': db_tid,
            'season_year': CURRENT_SEASON,
            'off_rtg': row.get('OFF_RATING'),
            'def_rtg': row.get('DEF_RATING'),
            'net_rtg': row.get('NET_RATING'),
            'pace': row.get('PACE'),
            'wins': s.get('WINS', 0),
            'losses': s.get('LOSSES', 0),
            'seed': s.get('PlayoffRank'),
        })

    logger.info(f'Team stats ingested: {len(team_stats)}')


def run():
    player_id_map = get_player_id_map()
    team_id_map = get_team_id_map()
    ingest_player_stats(player_id_map)
    ingest_team_stats(team_id_map)
    logger.info('Stats ingestion complete')


if __name__ == '__main__':
    run()
    sys.exit(0)
