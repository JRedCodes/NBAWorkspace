"""
Computes model scores for all prospects.
Triggered by ingest_prospects.py.
Scores are normalized 0–100 based on measurables + draft position signal.
"""
import sys
import logging
from lib.db import fetchall, execute
from lib.fallback import safe_percentile

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

DRAFT_YEAR = 2025


def run():
    prospects = fetchall(
        'SELECT * FROM prospects WHERE draft_year = :year',
        {'year': DRAFT_YEAR},
    )
    if not prospects:
        logger.warning('No prospects found')
        return

    logger.info(f'Computing scores for {len(prospects)} prospects')

    heights = [float(p['height_inches']) for p in prospects if p.get('height_inches')]
    wingspans = [float(p['wingspan_inches']) for p in prospects if p.get('wingspan_inches')]
    weights = [float(p['weight_lbs']) for p in prospects if p.get('weight_lbs')]
    picks = [int(p['projected_pick']) for p in prospects if p.get('projected_pick')]

    for p in prospects:
        height = float(p['height_inches']) if p.get('height_inches') else None
        wingspan = float(p['wingspan_inches']) if p.get('wingspan_inches') else None
        weight = float(p['weight_lbs']) if p.get('weight_lbs') else None
        pick = int(p['projected_pick']) if p.get('projected_pick') else 30

        # Size score — height + wingspan percentile
        height_pct = safe_percentile(height, heights)
        wingspan_pct = safe_percentile(wingspan, wingspans)
        size_score = (height_pct * 0.5 + wingspan_pct * 0.5) if height and wingspan else height_pct

        # Upside score — inverse of pick position (lower pick = more upside)
        pick_pct = safe_percentile(pick, picks, default=50.0)
        upside_score = 100 - pick_pct  # top picks have highest upside

        # Readiness score — weight relative to position
        weight_pct = safe_percentile(weight, weights)
        readiness_score = weight_pct

        # Shooting score — placeholder (needs college stats)
        shooting_score = max(0, 70 - (pick - 1) * 0.8)  # rough draft position proxy

        # Defense score — wingspan-based proxy
        defense_score = wingspan_pct if wingspan else 50.0

        # Overall — weighted composite
        overall = (
            upside_score * 0.35 +
            size_score * 0.20 +
            shooting_score * 0.20 +
            defense_score * 0.15 +
            readiness_score * 0.10
        )

        completeness = 'full' if (height and wingspan and weight) else 'partial'

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
            'shooting': round(float(shooting_score), 1),
            'size': round(float(size_score), 1),
            'defense': round(float(defense_score), 1),
            'upside': round(float(upside_score), 1),
            'readiness': round(float(readiness_score), 1),
            'overall': round(float(overall), 1),
            'rank': pick,
            'completeness': completeness,
        })

    logger.info('Prospect scores complete')


if __name__ == '__main__':
    run()
    sys.exit(0)
