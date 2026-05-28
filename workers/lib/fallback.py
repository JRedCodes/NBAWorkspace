"""
Missing data fallback logic.

data_completeness levels:
  full    — all stats present, compute normally
  partial — use most recent season or career averages, flag in UI
  limited — use league-average proxy, flag as "Estimated"

Never return zeros. Always return a number with a completeness flag.
"""

LEAGUE_AVERAGES = {
    'points': 11.5,
    'rebounds': 4.2,
    'assists': 2.4,
    'steals': 0.8,
    'blocks': 0.5,
    'fg_pct': 0.463,
    'three_pct': 0.358,
    'ft_pct': 0.775,
    'true_shooting_pct': 0.572,
    'usage_rate': 20.0,
    'offensive_rating': 113.0,
    'defensive_rating': 113.0,
    'win_shares': 3.0,
    'box_plus_minus': 0.0,
    'vorp': 0.5,
}

NEED_SCORE_DEFAULTS = {
    'three_point_percentile': 50.0,
    'rim_protection_score': 50.0,
    'playmaking_score': 50.0,
    'slashing_score': 50.0,
    'rebounding_percentile': 50.0,
    'poa_defense_score': 50.0,
    'leadership_index': 50.0,
}


def assess_completeness(stat_row: dict) -> str:
    required = ['points', 'rebounds', 'assists', 'fg_pct', 'true_shooting_pct', 'usage_rate']
    advanced = ['offensive_rating', 'defensive_rating', 'win_shares', 'box_plus_minus']

    has_required = all(stat_row.get(k) is not None for k in required)
    has_advanced = all(stat_row.get(k) is not None for k in advanced)

    if has_required and has_advanced:
        return 'full'
    if has_required:
        return 'partial'
    return 'limited'


def fill_missing(stat_row: dict, completeness: str) -> dict:
    filled = dict(stat_row)
    for key, default in LEAGUE_AVERAGES.items():
        if filled.get(key) is None:
            filled[key] = default
    return filled


def safe_percentile(value: float | None, values: list[float], default: float = 50.0) -> float:
    if value is None or not values:
        return default
    below = sum(1 for v in values if v < value)
    return round((below / len(values)) * 100, 1)


def safe_divide(numerator: float | None, denominator: float | None, default: float = 0.0) -> float:
    if numerator is None or denominator is None or denominator == 0:
        return default
    return numerator / denominator
