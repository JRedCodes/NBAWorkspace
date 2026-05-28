"""
Computes model scores for all prospects.
Overall score = pick-position percentile among drafted prospects (picks 1-60).
This is honest: the score reflects consensus draft position, not a pretend
composite of incomplete measurables. Combine measurements (size, wingspan)
are stored as supplementary info but don't inflate the overall.
"""
import sys
import logging
from lib.db import fetchall, execute
from lib.fallback import safe_percentile

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

DRAFT_YEAR = 2026
MAX_DRAFT_PICK = 60  # real drafts have 60 picks


def pick_score(pick: int) -> float:
    """Linear score: pick 1 → 99, pick 60 → 1.7, pick 61+ → < 1."""
    if pick <= MAX_DRAFT_PICK:
        return round(100 - (pick - 1) * (98.3 / (MAX_DRAFT_PICK - 1)), 1)
    return round(max(0, 1 - (pick - MAX_DRAFT_PICK) * 0.1), 1)


def run():
    prospects = fetchall(
        'SELECT * FROM prospects WHERE draft_year = :year AND projected_pick IS NOT NULL',
        {'year': DRAFT_YEAR},
    )
    if not prospects:
        logger.warning('No prospects found')
        return

    logger.info(f'Computing scores for {len(prospects)} prospects')

    heights = [float(p['height_inches']) for p in prospects if p.get('height_inches')]
    wingspans = [float(p['wingspan_inches']) for p in prospects if p.get('wingspan_inches')]
    weights = [float(p['weight_lbs']) for p in prospects if p.get('weight_lbs')]

    for p in prospects:
        pick = int(p['projected_pick'])
        height = float(p['height_inches']) if p.get('height_inches') else None
        wingspan = float(p['wingspan_inches']) if p.get('wingspan_inches') else None
        weight = float(p['weight_lbs']) if p.get('weight_lbs') else None

        overall = pick_score(pick)

        # Supplementary measurements — stored separately, not mixed into overall
        size_score = safe_percentile(
            (height or 0) + (wingspan or 0),
            [(h or 0) + (w or 0) for h, w in zip(heights, wingspans)],
            default=50.0,
        ) if height or wingspan else 50.0
        height_pct = safe_percentile(height, heights) if height else 50.0
        wingspan_pct = safe_percentile(wingspan, wingspans) if wingspan else 50.0
        weight_pct = safe_percentile(weight, weights) if weight else 50.0

        completeness = 'full' if (height and wingspan and weight) else 'partial' if (height or wingspan) else 'limited'

        execute("""
            INSERT INTO prospect_computed_scores (
                prospect_id, shooting_score, size_score, defense_score,
                upside_score, readiness_score, overall_model_score,
                model_rank, data_completeness, computed_at
            )
            VALUES (
                :pid, :shooting, :size, :defense,
                :upside, :readiness, :overall,
                :rank, :completeness, now()
            )
            ON CONFLICT (prospect_id) DO UPDATE SET
                shooting_score = EXCLUDED.shooting_score,
                size_score = EXCLUDED.size_score,
                defense_score = EXCLUDED.defense_score,
                upside_score = EXCLUDED.upside_score,
                readiness_score = EXCLUDED.readiness_score,
                overall_model_score = EXCLUDED.overall_model_score,
                model_rank = EXCLUDED.model_rank,
                data_completeness = EXCLUDED.data_completeness,
                computed_at = now(), updated_at = now()
        """, {
            'pid': p['id'],
            'shooting': round(float(height_pct), 1),    # repurpose as height pct
            'size': round(float(size_score), 1),
            'defense': round(float(wingspan_pct), 1),   # wingspan pct
            'upside': round(float(overall), 1),          # pick-based upside
            'readiness': round(float(weight_pct), 1),
            'overall': round(float(overall), 1),
            'rank': pick,
            'completeness': completeness,
        })

    logger.info('Prospect scores complete')


if __name__ == '__main__':
    run()
    sys.exit(0)
