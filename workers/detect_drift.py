"""
Drift detection — compares saved trade scenario snapshots against live DB state.
Triggered after roster and picks ingestion. Writes to drift_alerts, pushes SSE.
"""
import sys
import logging
import json
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)


def check_scenario(scenario: dict) -> list[dict]:
    alerts = []
    snap_roster = scenario.get('snapshot_roster') or {}
    snap_contracts = scenario.get('snapshot_contracts') or {}

    if isinstance(snap_roster, str):
        snap_roster = json.loads(snap_roster)
    if isinstance(snap_contracts, str):
        snap_contracts = json.loads(snap_contracts)

    for player_id, snap_data in snap_roster.items():
        snap_team = snap_data.get('team_id')

        live = fetchall(
            'SELECT team_id FROM players WHERE id = :id',
            {'id': player_id}
        )
        if not live:
            alerts.append({
                'alert_type': 'player_not_found',
                'description': f'Player {player_id} no longer exists in the database',
            })
            continue

        live_team = live[0].get('team_id')
        if str(live_team) != str(snap_team):
            alerts.append({
                'alert_type': 'player_moved',
                'description': f'Player {player_id} has moved teams since this scenario was saved',
            })

    for player_id, snap_contract in snap_contracts.items():
        live = fetchall(
            'SELECT current_year_salary FROM contracts WHERE player_id = :id',
            {'id': player_id}
        )
        if live:
            live_salary = live[0].get('current_year_salary')
            snap_salary = snap_contract.get('current_year_salary')
            if snap_salary and live_salary and abs(int(live_salary) - int(snap_salary)) > 100000:
                alerts.append({
                    'alert_type': 'contract_changed',
                    'description': f'Contract value for player {player_id} has changed',
                })

    return alerts


def run():
    scenarios = fetchall("""
        SELECT id, workspace_id FROM trade_scenarios
        WHERE status != 'archived'
          AND (drift_checked_at IS NULL OR drift_checked_at < now() - INTERVAL '6 hours')
    """)

    logger.info(f'Checking {len(scenarios)} scenarios for drift')

    for scenario in scenarios:
        scenario_id = scenario['id']

        full = fetchall(
            'SELECT * FROM trade_scenarios WHERE id = :id',
            {'id': scenario_id}
        )
        if not full:
            continue

        alerts = check_scenario(full[0])
        has_drift = len(alerts) > 0

        for alert in alerts:
            execute("""
                INSERT INTO drift_alerts (scenario_id, alert_type, description)
                VALUES (:scenario_id, :alert_type, :description)
            """, {'scenario_id': scenario_id, **alert})

        execute("""
            UPDATE trade_scenarios
            SET has_drift = :has_drift, drift_checked_at = now()
            WHERE id = :id
        """, {'has_drift': has_drift, 'id': scenario_id})

        if has_drift:
            logger.info(f'Drift detected in scenario {scenario_id}: {len(alerts)} alerts')

    logger.info('Drift detection complete')


if __name__ == '__main__':
    run()
    sys.exit(0)
