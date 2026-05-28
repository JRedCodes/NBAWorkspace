"""
Seeds known draft pick assets for all 30 teams.
In production this would scrape Spotrac/BBRef; for now populates current-year picks.
Triggers detect_drift.py on completion.
"""
import sys
import logging
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)


def run():
    teams = fetchall('SELECT id, nba_team_id, abbreviation FROM teams')
    team_map = {t['id']: t for t in teams}

    if not teams:
        logger.warning('No teams found — run roster ingestion first')
        return

    inserted = 0
    for team in teams:
        for round_num in [1, 2]:
            existing = fetchall("""
                SELECT id FROM draft_picks
                WHERE original_team_id = :team_id
                AND draft_year = 2025
                AND round = :round
                AND current_owner_id = :team_id
            """, {'team_id': team['id'], 'round': round_num})

            if existing:
                continue

            execute("""
                INSERT INTO draft_picks
                    (current_owner_id, original_team_id, draft_year, round, is_known, is_swap_right)
                VALUES
                    (:owner, :original, 2025, :round, false, false)
            """, {
                'owner': team['id'],
                'original': team['id'],
                'round': round_num,
            })
            inserted += 1

    logger.info(f'Pick ingestion complete — {inserted} picks inserted')


if __name__ == '__main__':
    run()
    sys.exit(0)
