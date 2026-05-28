"""
Ingests current rosters and contracts from nba_api.
Runs every 6h via BullMQ. Triggers detect_drift.py on completion.
"""
import sys
import logging
from datetime import date
from lib.db import fetchall, execute
from lib.nba_client import get_team_roster, get_player_info
from lib.cache import invalidate_team

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CURRENT_SEASON = '2024-25'


def get_db_teams() -> list[dict]:
    return fetchall('SELECT id, nba_team_id, abbreviation FROM teams')


def upsert_player(nba_player_id: int, team_db_id: str, roster_row: dict) -> str:
    info = get_player_info(nba_player_id)

    execute("""
        INSERT INTO players (nba_player_id, team_id, first_name, last_name, position,
            jersey_number, status)
        VALUES (:nba_player_id, :team_id, :first_name, :last_name, :position,
            :jersey_number, 'active')
        ON CONFLICT (nba_player_id) DO UPDATE SET
            team_id = EXCLUDED.team_id,
            position = EXCLUDED.position,
            jersey_number = EXCLUDED.jersey_number,
            status = 'active',
            updated_at = now()
    """, {
        'nba_player_id': nba_player_id,
        'team_id': team_db_id,
        'first_name': roster_row.get('PLAYER_FIRST_NAME') or info.get('FIRST_NAME', ''),
        'last_name': roster_row.get('PLAYER_LAST_NAME') or info.get('LAST_NAME', ''),
        'position': roster_row.get('POSITION', ''),
        'jersey_number': str(roster_row.get('NUM', '')),
    })

    row = fetchall(
        'SELECT id FROM players WHERE nba_player_id = :nba_player_id',
        {'nba_player_id': nba_player_id}
    )
    return row[0]['id'] if row else None


def upsert_contract(player_db_id: str, team_db_id: str, roster_row: dict):
    salary_str = str(roster_row.get('SALARY', '') or '').replace('$', '').replace(',', '')
    try:
        salary = int(float(salary_str)) if salary_str else 0
    except ValueError:
        salary = 0

    execute("""
        INSERT INTO contracts (player_id, team_id, years_remaining, annual_value,
            current_year_salary)
        VALUES (:player_id, :team_id, 1, :salary, :salary)
        ON CONFLICT (player_id) DO UPDATE SET
            team_id = EXCLUDED.team_id,
            current_year_salary = EXCLUDED.current_year_salary,
            updated_at = now()
    """, {
        'player_id': player_db_id,
        'team_id': team_db_id,
        'salary': salary,
    })


def run():
    teams = get_db_teams()
    logger.info(f'Ingesting rosters for {len(teams)} teams')

    for team in teams:
        nba_team_id = team['nba_team_id']
        team_db_id = team['id']
        logger.info(f'Processing {team["abbreviation"]}')

        try:
            roster = get_team_roster(nba_team_id, CURRENT_SEASON)
        except Exception as e:
            logger.error(f'Failed to fetch roster for {team["abbreviation"]}: {e}')
            continue

        for row in roster:
            nba_player_id = row.get('PLAYER_ID')
            if not nba_player_id:
                continue
            try:
                player_db_id = upsert_player(nba_player_id, team_db_id, row)
                if player_db_id:
                    upsert_contract(player_db_id, team_db_id, row)
            except Exception as e:
                logger.error(f'Failed to upsert player {nba_player_id}: {e}')

        invalidate_team(team_db_id)
        logger.info(f'{team["abbreviation"]} done — {len(roster)} players')

    logger.info('Roster ingestion complete')


if __name__ == '__main__':
    run()
    sys.exit(0)
