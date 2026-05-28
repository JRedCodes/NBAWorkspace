"""
Ingests coaching staff for all 30 teams from nba_api CommonTeamRoster.
Run after ingest_rosters.py. Safe to re-run (upserts on team_id + name).
"""
import sys
import logging
import time
from nba_api.stats.endpoints import commonteamroster
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CURRENT_SEASON = '2025-26'
RATE_LIMIT_DELAY = 1.0

ROLE_MAP = {
    'Head Coach': 'Head Coach',
    'Assistant Coach': 'Assistant Coach',
    'Assistant Coach for Player Development': 'Player Development',
    'Trainer': 'Trainer',
    'Strength and Conditioning': 'Strength & Conditioning',
    'Video Coordinator': 'Video Coordinator',
}


def get_coaches_for_team(nba_team_id: int) -> list[dict]:
    time.sleep(RATE_LIMIT_DELAY)
    result = commonteamroster.CommonTeamRoster(team_id=nba_team_id, season=CURRENT_SEASON)
    coaches_df = result.get_data_frames()[1]
    return coaches_df.to_dict('records')


def run():
    teams = fetchall('SELECT id, nba_team_id, abbreviation FROM teams')
    logger.info(f'Ingesting coaches for {len(teams)} teams')

    total = 0
    for team in teams:
        try:
            coaches = get_coaches_for_team(team['nba_team_id'])
        except Exception as e:
            logger.error(f'{team["abbreviation"]} failed: {e}')
            continue

        # Clear existing coaches for this team and re-insert
        execute('DELETE FROM coaches WHERE team_id = :team_id', {'team_id': team['id']})

        for c in coaches:
            name = c.get('COACH_NAME', '').strip()
            role_raw = c.get('COACH_TYPE', '').strip()
            if not name or not role_raw:
                continue

            role = ROLE_MAP.get(role_raw, role_raw)

            execute("""
                INSERT INTO coaches (team_id, name, role, years_with_team)
                VALUES (:team_id, :name, :role, 0)
            """, {
                'team_id': team['id'],
                'name': name,
                'role': role,
            })
            total += 1

        head_coach = next((c['COACH_NAME'] for c in coaches if c.get('COACH_TYPE') == 'Head Coach'), '—')
        logger.info(f'{team["abbreviation"]} done — {len(coaches)} staff | HC: {head_coach}')

    logger.info(f'Coach ingestion complete — {total} staff inserted')


if __name__ == '__main__':
    run()
    sys.exit(0)
