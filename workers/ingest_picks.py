"""
Seeds draft pick assets for all 30 teams.
Seeds the UPCOMING draft (2026) and following year (2027) as placeholder assets.
In production, Spotrac/BBRef would provide actual traded pick ownership.
"""
import sys
import logging
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

DRAFT_YEARS = [2026, 2027]


def run():
    teams = fetchall('SELECT id, nba_team_id, abbreviation FROM teams')

    if not teams:
        logger.warning('No teams found — run roster ingestion first')
        return

    # Clear stale 2025 picks (already happened)
    execute('DELETE FROM draft_picks WHERE draft_year = 2025')
    logger.info('Cleared 2025 picks')

    inserted = 0
    for year in DRAFT_YEARS:
        for team in teams:
            for round_num in [1, 2]:
                existing = fetchall("""
                    SELECT id FROM draft_picks
                    WHERE original_team_id = :team_id
                    AND draft_year = :year
                    AND round = :round
                    AND current_owner_id = :team_id
                """, {'team_id': team['id'], 'year': year, 'round': round_num})

                if existing:
                    continue

                execute("""
                    INSERT INTO draft_picks
                        (current_owner_id, original_team_id, draft_year, round, is_known, is_swap_right)
                    VALUES
                        (:owner, :original, :year, :round, false, false)
                """, {
                    'owner': team['id'],
                    'original': team['id'],
                    'year': year,
                    'round': round_num,
                })
                inserted += 1

    logger.info(f'Pick ingestion complete — {inserted} picks inserted')


if __name__ == '__main__':
    run()
    sys.exit(0)
