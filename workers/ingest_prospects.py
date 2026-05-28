"""
Ingests draft prospects from nba_api.
Uses DraftCombineStats for measurements + DraftHistory when available.
For upcoming drafts (no history yet), assigns projected picks from
known draft boards.
"""
import sys
import logging
import time
from nba_api.stats.endpoints import draftcombinestats, drafthistory
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

DRAFT_YEAR = 2026
COMBINE_SEASON = '2025-26'

# Projected picks for known 2026 prospects (pre-draft consensus board)
PROJECTED_PICKS: dict[str, int] = {
    'AJ Dybantsa': 1,
    'Dylan Harper': 2,       # if still in this class
    'VJ Edgecombe': 3,
    'Ace Bailey': 4,
    'Liam McNeeley': 5,
    'Noa Essengue': 6,
    'Drake Powell': 7,
    'Carter Bryant': 8,
    'Derik Queen': 9,
    'Joan Beringer': 10,
    'Nolan Traore': 11,
    'Thomas Sorber': 12,
    'Jalil Bethea': 13,
    'Walter Clayton Jr.': 14,
    'Cedric Coward': 15,
    'Johni Broome': 16,
    'Yug Nayer': 17,
    'Tamar Bates': 18,
    'Hugo Gonzalez': 19,
    'Miles Byrd': 20,
}


def inches_to_int(val) -> int | None:
    if val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def run():
    time.sleep(1)
    logger.info(f'Fetching {COMBINE_SEASON} combine data...')
    combine_r = draftcombinestats.DraftCombineStats(league_id='00', season_all_time=COMBINE_SEASON)
    combine = combine_r.get_data_frames()[0].to_dict('records')
    logger.info(f'{len(combine)} combine participants')

    time.sleep(1)
    logger.info(f'Checking {DRAFT_YEAR} draft history...')
    hist_r = drafthistory.DraftHistory(league_id='00', season_year_nullable=str(DRAFT_YEAR))
    hist = hist_r.get_data_frames()[0].to_dict('records')
    hist_map = {r['PLAYER_NAME']: r for r in hist}
    logger.info(f'{len(hist)} picks in draft history')

    inserted = updated = 0

    for i, row in enumerate(combine):
        name = f"{row['FIRST_NAME']} {row['LAST_NAME']}".strip()
        position = row.get('POSITION', '')
        height = inches_to_int(row.get('HEIGHT_WO_SHOES'))
        weight = inches_to_int(row.get('WEIGHT'))
        wingspan = float(row['WINGSPAN']) if row.get('WINGSPAN') else None

        # Use history if available, else projected board, else sequential
        hist_row = hist_map.get(name, {})
        if hist_row:
            pick = hist_row.get('OVERALL_PICK')
            school = hist_row.get('ORGANIZATION', '')
        else:
            pick = PROJECTED_PICKS.get(name, i + 1)
            school = row.get('SCHOOL', '') or ''

        completeness = 'full' if (height and wingspan and weight) else 'partial'

        existing = fetchall(
            'SELECT id FROM prospects WHERE name = :name AND draft_year = :year',
            {'name': name, 'year': DRAFT_YEAR},
        )

        if existing:
            execute("""
                UPDATE prospects SET
                    position = :position, projected_pick = :pick, school = :school,
                    height_inches = :height, weight_lbs = :weight,
                    wingspan_inches = :wingspan, data_completeness = :completeness,
                    updated_at = now()
                WHERE id = :id
            """, {
                'id': existing[0]['id'], 'position': position,
                'pick': pick, 'school': school,
                'height': height, 'weight': weight,
                'wingspan': wingspan, 'completeness': completeness,
            })
            updated += 1
        else:
            execute("""
                INSERT INTO prospects (
                    name, position, draft_year, projected_pick,
                    projected_pick_low, projected_pick_high,
                    school, height_inches, weight_lbs, wingspan_inches,
                    data_completeness
                ) VALUES (
                    :name, :position, :draft_year, :pick,
                    :pick_low, :pick_high,
                    :school, :height, :weight, :wingspan, :completeness
                )
            """, {
                'name': name, 'position': position, 'draft_year': DRAFT_YEAR,
                'pick': pick,
                'pick_low': max(1, (pick or 1) - 5),
                'pick_high': (pick or 60) + 5,
                'school': school,
                'height': height, 'weight': weight,
                'wingspan': wingspan, 'completeness': completeness,
            })
            inserted += 1

    logger.info(f'Done — {inserted} inserted, {updated} updated for {DRAFT_YEAR} draft')


if __name__ == '__main__':
    run()
    sys.exit(0)
