"""
Computes fit scores for every player against every team (30x30 matrix).
Triggered by compute_player_metrics.py. Writes to fit_score_cache jsonb on player_computed_metrics.
Node API never writes to this table.
"""
import sys
import logging
import json
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CURRENT_SEASON = '2025-26'

NEED_CATEGORIES = [
    'three_point_percentile',
    'rim_protection_score',
    'playmaking_score',
    'slashing_score',
    'rebounding_percentile',
    'poa_defense_score',
    'leadership_index',
]

NEED_WEIGHTS = {
    'three_point_percentile': 1.0,
    'rim_protection_score': 1.0,
    'playmaking_score': 1.0,
    'slashing_score': 1.0,
    'rebounding_percentile': 1.0,
    'poa_defense_score': 1.0,
    'leadership_index': 0.6,
}


def compute_team_needs(roster_metrics: list[dict]) -> dict[str, float]:
    """Team need = 100 - average score for that category across the roster."""
    if not roster_metrics:
        return {cat: 50.0 for cat in NEED_CATEGORIES}

    needs = {}
    for cat in NEED_CATEGORIES:
        values = [r[cat] for r in roster_metrics if r.get(cat) is not None]
        avg = sum(values) / len(values) if values else 50.0
        needs[cat] = round(max(0, min(100, 100 - avg)), 1)
    return needs


def compute_fit(player_metrics: dict, team_needs: dict) -> dict:
    breakdown = {}
    weighted_sum = 0.0
    total_weight = 0.0

    for cat in NEED_CATEGORIES:
        player_score = player_metrics.get(cat, 50.0) or 50.0
        team_need = team_needs.get(cat, 50.0)
        weight = NEED_WEIGHTS[cat]

        # Fit = how well player's strength aligns with team's need
        fit = (player_score / 100.0) * (team_need / 100.0) * 100.0
        breakdown[cat] = round(fit, 1)
        weighted_sum += fit * weight
        total_weight += weight

    overall = round(weighted_sum / total_weight, 1) if total_weight > 0 else 50.0
    return {'overall': overall, 'breakdown': breakdown}


def run():
    teams = fetchall('SELECT id FROM teams')
    players_metrics = fetchall("""
        SELECT pcm.*, pcm.player_id as player_db_id
        FROM player_computed_metrics pcm
        WHERE pcm.season_year = :season
    """, {'season': CURRENT_SEASON})

    if not players_metrics or not teams:
        logger.warning('No data found — run ingest_stats and compute_player_metrics first')
        return

    logger.info(f'Computing fit scores: {len(players_metrics)} players x {len(teams)} teams')

    # Build team roster metrics map
    team_roster_metrics: dict[str, list[dict]] = {t['id']: [] for t in teams}
    player_team_map = fetchall("""
        SELECT p.id as player_id, p.team_id
        FROM players p
        WHERE p.team_id IS NOT NULL
    """)
    pid_to_team = {r['player_id']: r['team_id'] for r in player_team_map}
    metrics_by_player = {r['player_db_id']: r for r in players_metrics}

    for pid, tid in pid_to_team.items():
        if pid in metrics_by_player and tid in team_roster_metrics:
            team_roster_metrics[tid].append(metrics_by_player[pid])

    team_needs = {tid: compute_team_needs(roster) for tid, roster in team_roster_metrics.items()}

    updated = 0
    for pm in players_metrics:
        fit_cache = {}
        for team in teams:
            tid = team['id']
            needs = team_needs.get(tid, {cat: 50.0 for cat in NEED_CATEGORIES})
            fit_cache[str(tid)] = compute_fit(pm, needs)

        execute("""
            UPDATE player_computed_metrics
            SET fit_score_cache = :cache, updated_at = now()
            WHERE player_id = :player_id AND season_year = :season
        """, {
            'cache': json.dumps(fit_cache),
            'player_id': pm['player_db_id'],
            'season': CURRENT_SEASON,
        })
        updated += 1

    logger.info(f'Fit scores computed for {updated} players')


if __name__ == '__main__':
    run()
    sys.exit(0)
