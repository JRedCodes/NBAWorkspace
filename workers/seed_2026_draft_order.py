"""
Seeds the 2026 NBA draft order into draft_picks with correct team assignments.

Lottery picks (1-14): Based on 2025-26 season records + confirmed lottery result
  (Washington Wizards #1 pick confirmed).
Playoff picks (15-30): Reverse order of playoff finish (worst seed picks first).

R2 picks (31-60): Inverse of R1 order (best team picks first in R2).
"""
import sys
import logging
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

# 2026 Draft Order — R1
# Lottery (1-14): confirmed lottery result with WAS #1, otherwise by worst record
# Playoff (15-30): by reverse seeding (worst seed picks earliest)
R1_ORDER_ABBR = [
    'WAS',  # 1  — confirmed lottery winner (17W-65L)
    'IND',  # 2  — 19W-63L
    'BKN',  # 3  — 20W-62L
    'UTA',  # 4  — 22W-60L
    'SAC',  # 5  — 22W-60L
    'MEM',  # 6  — 25W-57L
    'DAL',  # 7  — 26W-56L
    'NOP',  # 8  — 26W-56L
    'CHI',  # 9  — 31W-51L
    'MIL',  # 10 — 32W-50L
    'GSW',  # 11 — 37W-45L
    'LAC',  # 12 — 42W-40L
    'POR',  # 13 — 42W-40L
    'MIA',  # 14 — 43W-39L
    # Playoff teams (15-30): worst record / lowest seed picks first
    'ATL',  # 15
    'TOR',  # 16
    'ORL',  # 17
    'PHI',  # 18
    'DET',  # 19
    'CHA',  # 20
    'HOU',  # 21
    'NYK',  # 22
    'CLE',  # 23
    'LAL',  # 24
    'PHX',  # 25
    'MIN',  # 26
    'DEN',  # 27
    'SAS',  # 28
    'BOS',  # 29
    'OKC',  # 30 — best record
]

def run():
    # Build abbreviation → team_id map
    teams = fetchall('SELECT id, abbreviation FROM teams')
    abbr_map = {t['abbreviation']: t['id'] for t in teams}

    # Clear existing 2026 picks and re-seed with team assignments
    execute('DELETE FROM draft_picks WHERE draft_year = 2026')
    logger.info('Cleared existing 2026 picks')

    inserted = 0
    for pick_num, abbr in enumerate(R1_ORDER_ABBR, start=1):
        team_id = abbr_map.get(abbr)
        if not team_id:
            logger.warning(f'Team not found: {abbr}')
            continue

        execute("""
            INSERT INTO draft_picks
                (current_owner_id, original_team_id, draft_year, round, pick_number, is_known, is_swap_right)
            VALUES
                (:owner, :original, 2026, 1, :pick, true, false)
        """, {'owner': team_id, 'original': team_id, 'pick': pick_num})
        inserted += 1

    # R2: inverse of R1 (best teams pick first in R2 via trades convention,
    # but simplest default is same order for placeholder)
    for pick_num, abbr in enumerate(R1_ORDER_ABBR, start=1):
        team_id = abbr_map.get(abbr)
        if not team_id:
            continue
        r2_pick = 61 - pick_num  # inverts: R1 pick 1 → R2 pick 60, R1 pick 30 → R2 pick 31
        execute("""
            INSERT INTO draft_picks
                (current_owner_id, original_team_id, draft_year, round, pick_number, is_known, is_swap_right)
            VALUES
                (:owner, :original, 2026, 2, :pick, false, false)
        """, {'owner': team_id, 'original': team_id, 'pick': 30 + r2_pick})
        inserted += 1

    logger.info(f'2026 draft order seeded — {inserted} picks inserted')

    # Also seed 2027 with placeholder ordering
    execute('DELETE FROM draft_picks WHERE draft_year = 2027')
    for pick_num, abbr in enumerate(R1_ORDER_ABBR, start=1):
        team_id = abbr_map.get(abbr)
        if not team_id:
            continue
        for rnd, base in [(1, 0), (2, 30)]:
            execute("""
                INSERT INTO draft_picks
                    (current_owner_id, original_team_id, draft_year, round, pick_number, is_known, is_swap_right)
                VALUES
                    (:owner, :original, 2027, :round, :pick, false, false)
            """, {'owner': team_id, 'original': team_id, 'round': rnd, 'pick': base + pick_num})
    logger.info('2027 placeholder picks seeded')


if __name__ == '__main__':
    run()
    sys.exit(0)
