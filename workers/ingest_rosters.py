"""
Ingests current rosters and contracts from nba_api.
Runs every 6h via BullMQ. Triggers detect_drift.py on completion.
"""
import sys
import logging
from lib.db import fetchall, execute
from lib.nba_client import get_team_roster
from lib.cache import invalidate_team

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CURRENT_SEASON = '2025-26'


def parse_height_inches(height_str) -> int | None:
    """Parse '6-10' format to total inches."""
    if not height_str:
        return None
    try:
        feet, inches = str(height_str).split('-')
        return int(feet) * 12 + int(inches)
    except Exception:
        return None


def parse_weight(weight_str) -> int | None:
    try:
        return int(float(str(weight_str))) if weight_str else None
    except (ValueError, TypeError):
        return None


def get_db_teams() -> list[dict]:
    return fetchall('SELECT id, nba_team_id, abbreviation FROM teams')


def upsert_player(nba_player_id: int, team_db_id: str, row: dict) -> str | None:
    # CommonTeamRoster columns: PLAYER (full name), NUM, POSITION, HEIGHT, WEIGHT, BIRTH_DATE
    full_name = str(row.get('PLAYER') or '')
    parts = full_name.split(' ', 1)
    first_name = parts[0] if parts else ''
    last_name = parts[1] if len(parts) > 1 else ''

    execute("""
        INSERT INTO players (nba_player_id, team_id, first_name, last_name, position,
            jersey_number, height_inches, weight_lbs, birth_date, status)
        VALUES (:nba_player_id, :team_id, :first_name, :last_name, :position,
            :jersey_number, :height_inches, :weight_lbs, :birth_date, 'active')
        ON CONFLICT (nba_player_id) DO UPDATE SET
            team_id = EXCLUDED.team_id,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            position = EXCLUDED.position,
            jersey_number = EXCLUDED.jersey_number,
            height_inches = EXCLUDED.height_inches,
            weight_lbs = EXCLUDED.weight_lbs,
            birth_date = EXCLUDED.birth_date,
            status = 'active',
            updated_at = now()
    """, {
        'nba_player_id': nba_player_id,
        'team_id': team_db_id,
        'first_name': first_name,
        'last_name': last_name,
        'position': row.get('POSITION') or '',
        'jersey_number': str(row.get('NUM') or ''),
        'height_inches': parse_height_inches(row.get('HEIGHT')),
        'weight_lbs': parse_weight(row.get('WEIGHT')),
        'birth_date': row.get('BIRTH_DATE') or None,
    })

    result = fetchall(
        'SELECT id FROM players WHERE nba_player_id = :id',
        {'id': nba_player_id}
    )
    return result[0]['id'] if result else None


def upsert_contract(player_db_id: str, team_db_id: str):
    # Salary not available in CommonTeamRoster — placeholder record, $0 salary.
    # Actual salary values require a separate Spotrac/BBRef integration.
    execute("""
        INSERT INTO contracts (player_id, team_id, years_remaining, annual_value,
            current_year_salary)
        VALUES (:player_id, :team_id, 1, 0, 0)
        ON CONFLICT (player_id) DO UPDATE SET
            team_id = EXCLUDED.team_id,
            updated_at = now()
    """, {
        'player_id': player_db_id,
        'team_id': team_db_id,
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
                player_db_id = upsert_player(int(nba_player_id), team_db_id, row)
                if player_db_id:
                    upsert_contract(player_db_id, team_db_id)
            except Exception as e:
                logger.error(f'Failed to upsert player {nba_player_id}: {e}')

        invalidate_team(team_db_id)
        logger.info(f'{team["abbreviation"]} done — {len(roster)} players')

    logger.info('Roster ingestion complete')


if __name__ == '__main__':
    run()
    sys.exit(0)
