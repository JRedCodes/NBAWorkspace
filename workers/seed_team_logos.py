"""
Updates logo_url for all 30 teams using the public NBA CDN.
URL format: https://cdn.nba.com/logos/nba/{nba_team_id}/global/L/logo.svg
"""
import sys
import logging
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

NBA_CDN = 'https://cdn.nba.com/logos/nba'

def run():
    teams = fetchall('SELECT id, nba_team_id, abbreviation FROM teams')
    for team in teams:
        url = f"{NBA_CDN}/{team['nba_team_id']}/global/L/logo.svg"
        execute(
            'UPDATE teams SET logo_url = :url WHERE id = :id',
            {'url': url, 'id': team['id']},
        )
        logger.info(f"{team['abbreviation']} → {url}")
    logger.info(f'Updated logos for {len(teams)} teams')

if __name__ == '__main__':
    run()
    sys.exit(0)
