"""
Computes all 8 need-category scores and percentile rankings for every player.
Triggered by ingest_stats.py completion. Writes to player_computed_metrics.
Node API never writes to this table.
"""
import sys
import logging
import json
import numpy as np
from lib.db import fetchall, execute
from lib.fallback import assess_completeness, fill_missing, safe_percentile

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CURRENT_SEASON = '2025-26'


def to_float(value) -> float | None:
    """Convert Decimal/np.float64/etc to native Python float."""
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def floatify(row: dict) -> dict:
    """Cast all numeric values in a DB row to native Python float."""
    skip = {'id', 'player_id', 'player_db_id', 'season_year', 'position', 'birth_date', 'data_completeness'}
    return {k: (to_float(v) if k not in skip else v) for k, v in row.items()}


def fetch_all_stats() -> list[dict]:
    rows = fetchall("""
        SELECT
            pss.*,
            p.id as player_db_id,
            p.position,
            p.birth_date,
            EXTRACT(YEAR FROM AGE(COALESCE(p.birth_date, '1990-01-01'::date))) as age
        FROM player_season_stats pss
        JOIN players p ON p.id = pss.player_id
        WHERE pss.season_year = :season
          AND pss.games_played >= 5
    """, {'season': CURRENT_SEASON})
    return [floatify(r) for r in rows]


def compute_three_point_percentile(row: dict, all_values: list[float]) -> float:
    val = row.get('three_pct')
    return safe_percentile(val, all_values)


def compute_rim_protection(row: dict, all_values: list[float]) -> float:
    blk = row.get('blocks') or 0
    def_rtg = row.get('defensive_rating')
    blk_percentile = safe_percentile(blk, [r.get('blocks', 0) for r in all_values])
    if def_rtg is not None:
        avg_def = np.mean([r for r in [s.get('defensive_rating') for s in all_values] if r])
        def_score = max(0, (avg_def - def_rtg) * 2)
        return min(100, (blk_percentile * 0.6 + def_score * 0.4))
    return blk_percentile


def compute_playmaking(row: dict, all_stats: list[dict]) -> float:
    ast = row.get('assists') or 0
    usg = row.get('usage_rate') or 20
    ast_values = [r.get('assists', 0) for r in all_stats]
    ast_percentile = safe_percentile(ast, ast_values)
    usg_factor = min(1.0, usg / 25.0)
    return min(100, ast_percentile * (0.7 + usg_factor * 0.3))


def compute_slashing(row: dict, all_stats: list[dict]) -> float:
    pts = row.get('points') or 0
    fg = row.get('fg_pct') or 0
    ts = row.get('true_shooting_pct') or 0
    pts_pct = safe_percentile(pts, [r.get('points', 0) for r in all_stats])
    ts_pct = safe_percentile(ts, [r.get('true_shooting_pct', 0) for r in all_stats])
    fg_pct = safe_percentile(fg, [r.get('fg_pct', 0) for r in all_stats])
    return (pts_pct * 0.4 + ts_pct * 0.35 + fg_pct * 0.25)


def compute_rebounding_percentile(row: dict, all_stats: list[dict]) -> float:
    reb = row.get('rebounds') or 0
    return safe_percentile(reb, [r.get('rebounds', 0) for r in all_stats])


def compute_poa_defense(row: dict, all_stats: list[dict]) -> float:
    stl = row.get('steals') or 0
    def_rtg = row.get('defensive_rating')
    stl_pct = safe_percentile(stl, [r.get('steals', 0) for r in all_stats])
    if def_rtg is not None:
        def_values = [r.get('defensive_rating') for r in all_stats if r.get('defensive_rating')]
        avg_def = float(np.mean(def_values)) if def_values else 113.0
        def_score = max(0, min(100, (avg_def - def_rtg) * 3 + 50))
        return stl_pct * 0.5 + def_score * 0.5
    return stl_pct


def compute_leadership_index(row: dict) -> float:
    age = row.get('age') or 25
    gp = row.get('games_played') or 0
    experience_score = min(100, max(0, (age - 22) * 6))
    availability_score = min(100, (gp / 82) * 100)
    return experience_score * 0.6 + availability_score * 0.4


def run():
    all_stats = fetch_all_stats()
    if not all_stats:
        logger.warning('No stats found for current season')
        return

    logger.info(f'Computing metrics for {len(all_stats)} players')

    three_values = [r.get('three_pct', 0) for r in all_stats if r.get('three_pct')]

    for row in all_stats:
        completeness = assess_completeness(row)
        filled = fill_missing(row, completeness)

        try:
            metrics = {
                'three_point_percentile': float(compute_three_point_percentile(filled, three_values)),
                'rim_protection_score': float(compute_rim_protection(filled, all_stats)),
                'playmaking_score': float(compute_playmaking(filled, all_stats)),
                'slashing_score': float(compute_slashing(filled, all_stats)),
                'rebounding_percentile': float(compute_rebounding_percentile(filled, all_stats)),
                'poa_defense_score': float(compute_poa_defense(filled, all_stats)),
                'leadership_index': float(compute_leadership_index(filled)),
                'data_completeness': completeness,
            }

            execute("""
                INSERT INTO player_computed_metrics (
                    player_id, season_year,
                    three_point_percentile, rim_protection_score, playmaking_score,
                    slashing_score, rebounding_percentile, poa_defense_score,
                    leadership_index, data_completeness, computed_at
                ) VALUES (
                    :player_id, :season_year,
                    :three_point_percentile, :rim_protection_score, :playmaking_score,
                    :slashing_score, :rebounding_percentile, :poa_defense_score,
                    :leadership_index, :data_completeness, now()
                )
                ON CONFLICT (player_id, season_year) DO UPDATE SET
                    three_point_percentile = EXCLUDED.three_point_percentile,
                    rim_protection_score = EXCLUDED.rim_protection_score,
                    playmaking_score = EXCLUDED.playmaking_score,
                    slashing_score = EXCLUDED.slashing_score,
                    rebounding_percentile = EXCLUDED.rebounding_percentile,
                    poa_defense_score = EXCLUDED.poa_defense_score,
                    leadership_index = EXCLUDED.leadership_index,
                    data_completeness = EXCLUDED.data_completeness,
                    computed_at = now(),
                    updated_at = now()
            """, {'player_id': row['player_db_id'], 'season_year': CURRENT_SEASON, **metrics})

        except Exception as e:
            logger.error(f'Failed to compute metrics for player {row["player_db_id"]}: {e}')

    logger.info('Player metrics computation complete')


if __name__ == '__main__':
    run()
    sys.exit(0)
