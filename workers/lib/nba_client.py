import time
import logging
from nba_api.stats.endpoints import (
    commonteamroster,
    leaguedashplayerstats,
    leaguedashteamstats,
    shotchartdetail,
    leaguestandingsv3,
    commonplayerinfo,
)
from nba_api.stats.static import teams as nba_teams_static

logger = logging.getLogger(__name__)

# nba_api rate limit — 1 request per second is safe
RATE_LIMIT_DELAY = 1.0


def _call(fn, *args, **kwargs):
    time.sleep(RATE_LIMIT_DELAY)
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        logger.error(f'nba_api error calling {fn.__name__}: {e}')
        raise


def get_all_teams() -> list[dict]:
    return nba_teams_static.get_teams()


def get_team_roster(team_id: int, season: str) -> list[dict]:
    result = _call(commonteamroster.CommonTeamRoster, team_id=team_id, season=season)
    return result.get_data_frames()[0].to_dict('records')


def get_player_info(player_id: int) -> dict:
    result = _call(commonplayerinfo.CommonPlayerInfo, player_id=player_id)
    rows = result.get_data_frames()[0].to_dict('records')
    return rows[0] if rows else {}


def get_league_player_stats(season: str, per_mode: str = 'PerGame') -> list[dict]:
    result = _call(
        leaguedashplayerstats.LeagueDashPlayerStats,
        season=season,
        per_mode_detailed=per_mode,
    )
    return result.get_data_frames()[0].to_dict('records')


def get_league_player_stats_advanced(season: str) -> list[dict]:
    result = _call(
        leaguedashplayerstats.LeagueDashPlayerStats,
        season=season,
        measure_type_detailed_defense='Advanced',
    )
    return result.get_data_frames()[0].to_dict('records')


def get_league_team_stats(season: str) -> list[dict]:
    result = _call(
        leaguedashteamstats.LeagueDashTeamStats,
        season=season,
        measure_type_detailed_defense='Advanced',
    )
    return result.get_data_frames()[0].to_dict('records')


def get_shot_chart(player_id: int, season: str, game_id: str | None = None) -> list[dict]:
    kwargs = dict(player_id=player_id, season=season, context_measure_simple='FGA')
    if game_id:
        kwargs['game_id'] = game_id
    result = _call(shotchartdetail.ShotChartDetail, **kwargs)
    return result.get_data_frames()[0].to_dict('records')


def get_standings(season: str) -> list[dict]:
    result = _call(leaguestandingsv3.LeagueStandingsV3, season=season)
    return result.get_data_frames()[0].to_dict('records')
