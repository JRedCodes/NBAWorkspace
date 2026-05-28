"""
Ingests shot chart data for all active players with season stats.
Runs daily — incremental by checking existing game_ids.
"""
import sys
import logging
from lib.db import fetchall, execute
from lib.nba_client import get_shot_chart

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CURRENT_SEASON = '2025-26'


def get_existing_game_ids(player_db_id: str) -> set[str]:
    rows = fetchall(
        'SELECT DISTINCT game_id FROM shot_chart_entries WHERE player_id = :pid AND season_year = :season',
        {'pid': player_db_id, 'season': CURRENT_SEASON},
    )
    return {str(r['game_id']) for r in rows}


def ingest_player(player_db_id: str, nba_player_id: int) -> int:
    try:
        shots = get_shot_chart(nba_player_id, CURRENT_SEASON)
    except Exception as e:
        logger.error(f'Shot chart fetch failed for nba_id={nba_player_id}: {e}')
        return 0

    if not shots:
        return 0

    existing_games = get_existing_game_ids(player_db_id)
    new_shots = [s for s in shots if str(s.get('GAME_ID', '')) not in existing_games]

    if not new_shots:
        return 0

    for s in new_shots:
        home_team = s.get('HTM', '')
        team_name = s.get('TEAM_NAME', '')
        is_home = (team_name == home_team) if home_team else None

        execute("""
            INSERT INTO shot_chart_entries (
                player_id, game_id, season_year,
                loc_x, loc_y, shot_made,
                shot_distance, shot_type, action_type,
                period, is_home
            ) VALUES (
                :player_id, :game_id, :season_year,
                :loc_x, :loc_y, :shot_made,
                :shot_distance, :shot_type, :action_type,
                :period, :is_home
            )
        """, {
            'player_id': player_db_id,
            'game_id': str(s.get('GAME_ID', '')),
            'season_year': CURRENT_SEASON,
            'loc_x': s.get('LOC_X'),
            'loc_y': s.get('LOC_Y'),
            'shot_made': bool(s.get('SHOT_MADE_FLAG', 0)),
            'shot_distance': s.get('SHOT_DISTANCE'),
            'shot_type': s.get('SHOT_TYPE', ''),
            'action_type': s.get('ACTION_TYPE', ''),
            'period': s.get('PERIOD'),
            'is_home': is_home,
        })

    return len(new_shots)


def run():
    players = fetchall("""
        SELECT p.id, p.nba_player_id, p.first_name, p.last_name
        FROM players p
        JOIN player_season_stats pss ON pss.player_id = p.id
        WHERE pss.season_year = :season
          AND pss.games_played >= 10
          AND p.status = 'active'
        ORDER BY pss.minutes_per_game DESC NULLS LAST
    """, {'season': CURRENT_SEASON})

    logger.info(f'Ingesting shot charts for {len(players)} players')
    total_new = 0

    for p in players:
        new = ingest_player(p['id'], p['nba_player_id'])
        if new > 0:
            logger.info(f'{p["first_name"]} {p["last_name"]}: +{new} shots')
        total_new += new

    logger.info(f'Shot chart ingestion complete — {total_new} new entries')


if __name__ == '__main__':
    run()
    sys.exit(0)
