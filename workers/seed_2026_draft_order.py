"""
2026 NBA Draft Order — complete with traded picks and conveyance notes.
Source: Official NBA draft order including all trades.

current_owner = team that holds the pick right now
original_team = team the pick originated from
"""
import sys
import logging
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

# (pick_number, round, current_owner_abbr, original_owner_abbr, conveyance_notes)
DRAFT_ORDER = [
    # ── Round 1 ──────────────────────────────────────────────────────────────
    (1,  1, 'WAS', 'WAS', None),
    (2,  1, 'UTA', 'UTA', None),
    (3,  1, 'MEM', 'MEM', None),
    (4,  1, 'CHI', 'CHI', None),
    (5,  1, 'LAC', 'IND', 'from IND'),
    (6,  1, 'BKN', 'BKN', None),
    (7,  1, 'SAC', 'SAC', None),
    (8,  1, 'ATL', 'NOP', 'from NO'),
    (9,  1, 'DAL', 'DAL', None),
    (10, 1, 'MIL', 'MIL', None),
    (11, 1, 'GSW', 'GSW', None),
    (12, 1, 'OKC', 'LAC', 'from LAC'),
    (13, 1, 'MIA', 'MIA', None),
    (14, 1, 'CHA', 'CHA', None),
    (15, 1, 'CHI', 'POR', 'from POR'),
    (16, 1, 'MEM', 'PHX', 'from PHX via ORL'),
    (17, 1, 'OKC', 'PHI', 'from PHI'),
    (18, 1, 'CHA', 'ORL', 'from ORL via PHX'),
    (19, 1, 'TOR', 'TOR', None),
    (20, 1, 'SAS', 'ATL', 'from ATL'),
    (21, 1, 'DET', 'MIN', 'from MIN'),
    (22, 1, 'PHI', 'HOU', 'from HOU via OKC'),
    (23, 1, 'ATL', 'CLE', 'from CLE'),
    (24, 1, 'NYK', 'NYK', None),
    (25, 1, 'LAL', 'LAL', None),
    (26, 1, 'DEN', 'DEN', None),
    (27, 1, 'BOS', 'BOS', None),
    (28, 1, 'MIN', 'DET', 'from DET'),
    (29, 1, 'CLE', 'SAS', 'from SAS via ATL'),
    (30, 1, 'DAL', 'OKC', 'from OKC via WAS, PHI'),
    # ── Round 2 ──────────────────────────────────────────────────────────────
    (31, 2, 'NYK', 'WAS', 'from WAS via OKC, HOU'),
    (32, 2, 'MEM', 'IND', 'from IND via MIL'),
    (33, 2, 'BKN', 'BKN', None),
    (34, 2, 'SAC', 'SAC', None),
    (35, 2, 'SAS', 'UTA', 'from UTA via MIN'),
    (36, 2, 'LAC', 'MEM', 'from MEM via ATL, UTA'),
    (37, 2, 'OKC', 'DAL', 'from DAL'),
    (38, 2, 'CHI', 'NOP', 'from NOP via BOS, DET, POR'),
    (39, 2, 'HOU', 'CHI', 'from CHI via WAS'),
    (40, 2, 'BOS', 'MIL', 'from MIL via ORL'),
    (41, 2, 'MIA', 'GSW', 'from GSW via CHA, NYK, OKC, ATL'),
    (42, 2, 'SAS', 'POR', 'from POR via NOP'),
    (43, 2, 'BKN', 'LAC', 'from LAC via HOU'),
    (44, 2, 'SAS', 'MIA', 'from MIA via IND'),
    (45, 2, 'SAC', 'CHA', 'from CHA via SAS, ATL, NYK'),
    (46, 2, 'ORL', 'ORL', None),
    (47, 2, 'PHX', 'PHI', 'from PHI via HOU, OKC'),
    (48, 2, 'DAL', 'PHX', 'from PHX via WAS'),
    (49, 2, 'DEN', 'ATL', 'from ATL via BKN, GSW'),
    (50, 2, 'TOR', 'TOR', None),
    (51, 2, 'WAS', 'MIN', 'from MIN via DET, NYK'),
    (52, 2, 'LAC', 'CLE', 'from CLE'),
    (53, 2, 'HOU', 'HOU', None),
    (54, 2, 'GSW', 'LAL', 'from LAL via TOR, MIA, CLE'),
    (55, 2, 'NYK', 'NYK', None),
    (56, 2, 'CHI', 'DEN', 'from DEN via MIN, PHX, CHA'),
    (57, 2, 'ATL', 'BOS', 'from BOS'),
    (58, 2, 'NOP', 'DET', 'from DET via NYK, BKN, PHX, ORL, LAC'),
    (59, 2, 'MIN', 'SAS', 'from SAS via IND'),
    (60, 2, 'WAS', 'OKC', 'from OKC via SAS, MIA'),
]


def run():
    teams = fetchall('SELECT id, abbreviation FROM teams')
    abbr_map = {t['abbreviation']: t['id'] for t in teams}

    execute('DELETE FROM draft_picks WHERE draft_year = 2026')
    logger.info('Cleared existing 2026 picks')

    # Also seed 2027 as placeholders while we're here
    execute('DELETE FROM draft_picks WHERE draft_year = 2027')

    inserted = 0
    for pick_num, rnd, current_abbr, original_abbr, notes in DRAFT_ORDER:
        current_id = abbr_map.get(current_abbr)
        original_id = abbr_map.get(original_abbr)
        if not current_id or not original_id:
            logger.warning(f'Unknown team: current={current_abbr} original={original_abbr}')
            continue

        execute("""
            INSERT INTO draft_picks
                (current_owner_id, original_team_id, draft_year, round, pick_number,
                 is_known, conveyance_notes, is_swap_right)
            VALUES
                (:current, :original, 2026, :round, :pick,
                 true, :notes, false)
        """, {
            'current': current_id,
            'original': original_id,
            'round': rnd,
            'pick': pick_num,
            'notes': notes,
        })
        inserted += 1

    logger.info(f'2026 draft order seeded — {inserted} picks')

    # 2027 placeholders — own picks only
    r1_order = [abbr for _, rnd, abbr, _, _ in DRAFT_ORDER if rnd == 1]
    for i, abbr in enumerate(r1_order, start=1):
        tid = abbr_map.get(abbr)
        if tid:
            for rnd in [1, 2]:
                execute("""
                    INSERT INTO draft_picks (current_owner_id, original_team_id, draft_year, round, pick_number, is_known)
                    VALUES (:t, :t, 2027, :round, :pick, false)
                """, {'t': tid, 'round': rnd, 'pick': i if rnd == 1 else 61 - i})
    logger.info('2027 placeholder picks seeded')


if __name__ == '__main__':
    run()
    sys.exit(0)
