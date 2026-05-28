"""
Computes power rankings for all 30 teams.
Triggered by ingest_stats.py. Writes to power_rankings table.
"""
import sys
import logging
from lib.db import fetchall, execute
from lib.cache import delete_pattern

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CURRENT_SEASON = '2025-26'


def compute_composite_score(stats: dict) -> float:
    net_rtg = stats.get('net_rating') or 0
    wins = stats.get('wins') or 0
    losses = stats.get('losses') or 0
    games = wins + losses or 1
    win_pct = wins / games

    # Weighted composite: 60% net rating (normalized), 40% win %
    # Net rating typically ranges from -15 to +15
    net_normalized = (net_rtg + 15) / 30 * 100
    win_normalized = win_pct * 100

    return round(net_normalized * 0.6 + win_normalized * 0.4, 2)


def run():
    teams = fetchall('SELECT id FROM teams')
    team_stats = fetchall("""
        SELECT team_id, net_rating, wins, losses
        FROM team_season_stats
        WHERE season_year = :season
    """, {'season': CURRENT_SEASON})

    if not team_stats:
        logger.warning('No team stats found — run ingest_stats first')
        return

    scores = []
    for s in team_stats:
        score = compute_composite_score(s)
        scores.append({'team_id': s['team_id'], 'score': score})

    scores.sort(key=lambda x: x['score'], reverse=True)

    previous_ranks = {}
    prev = fetchall("""
        SELECT DISTINCT ON (team_id) team_id, rank
        FROM power_rankings
        ORDER BY team_id, computed_at DESC
    """)
    for r in prev:
        previous_ranks[r['team_id']] = r['rank']

    for rank, item in enumerate(scores, start=1):
        execute("""
            INSERT INTO power_rankings (team_id, rank, previous_rank, composite_score, computed_at)
            VALUES (:team_id, :rank, :previous_rank, :score, now())
        """, {
            'team_id': item['team_id'],
            'rank': rank,
            'previous_rank': previous_ranks.get(item['team_id']),
            'score': item['score'],
        })

    delete_pattern('http:/api/analytics/league/power*')
    logger.info(f'Power rankings computed for {len(scores)} teams')


if __name__ == '__main__':
    run()
    sys.exit(0)
