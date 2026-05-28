"""
Ingests draft prospects from nba_api — combine measurements + draft history.
For current draft year (2025), uses DraftHistory + DraftCombineStats.
For future draft years, re-run when combine data becomes available.
"""
import sys
import logging
import time
from nba_api.stats.endpoints import draftcombinestats, drafthistory
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

DRAFT_YEAR = 2025
COMBINE_SEASON = '2024-25'


def inches_to_int(val) -> int | None:
    if val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def run():
    time.sleep(1)
    logger.info(f'Fetching {DRAFT_YEAR} draft history...')
    hist_r = drafthistory.DraftHistory(league_id='00', season_year_nullable=str(DRAFT_YEAR))
    hist = hist_r.get_data_frames()[0].to_dict('records')
    logger.info(f'{len(hist)} picks found')

    time.sleep(1)
    logger.info(f'Fetching {COMBINE_SEASON} combine data...')
    combine_r = draftcombinestats.DraftCombineStats(league_id='00', season_all_time=COMBINE_SEASON)
    combine_df = combine_r.get_data_frames()[0]
    combine_map: dict[str, dict] = {}
    for row in combine_df.to_dict('records'):
        key = f"{row['FIRST_NAME']} {row['LAST_NAME']}".strip().lower()
        combine_map[key] = row

    inserted = updated = 0
    for pick in hist:
        player_name = pick.get('PLAYER_NAME', '')
        overall = pick.get('OVERALL_PICK')
        round_num = pick.get('ROUND_NUMBER')
        round_pick = pick.get('ROUND_PICK')
        school = pick.get('ORGANIZATION', '')

        combine = combine_map.get(player_name.lower(), {})

        height = inches_to_int(combine.get('HEIGHT_WO_SHOES'))
        weight = inches_to_int(combine.get('WEIGHT'))
        wingspan = float(combine['WINGSPAN']) if combine.get('WINGSPAN') else None

        existing = fetchall(
            'SELECT id FROM prospects WHERE name = :name AND draft_year = :year',
            {'name': player_name, 'year': DRAFT_YEAR},
        )

        completeness = 'full' if combine else 'partial'

        if existing:
            execute("""
                UPDATE prospects SET
                    projected_pick = :pick, school = :school,
                    height_inches = :height, weight_lbs = :weight,
                    wingspan_inches = :wingspan, data_completeness = :completeness,
                    updated_at = now()
                WHERE id = :id
            """, {
                'id': existing[0]['id'],
                'pick': overall, 'school': school,
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
                'name': player_name,
                'position': combine.get('POSITION', ''),
                'draft_year': DRAFT_YEAR,
                'pick': overall,
                'pick_low': max(1, (overall or 1) - 3),
                'pick_high': (overall or 60) + 3,
                'school': school,
                'height': height,
                'weight': weight,
                'wingspan': wingspan,
                'completeness': completeness,
            })
            inserted += 1

    logger.info(f'Prospects complete — {inserted} inserted, {updated} updated')


if __name__ == '__main__':
    run()
    sys.exit(0)
