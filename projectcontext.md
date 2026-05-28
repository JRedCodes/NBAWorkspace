# NBA GM Intelligence Platform — Project Context

> This document serves as the single source of truth for the full scope, architecture, and build plan of the NBA GM Intelligence Platform. Reference it at the start of every new session.

---

## Table of Contents

1. [Project Purpose](#1-project-purpose)
2. [Core Features](#2-core-features)
3. [App Structure — Four Pages](#3-app-structure--four-pages)
4. [Key Design Decisions](#4-key-design-decisions)
5. [Tech Stack](#5-tech-stack)
6. [Database Schema](#6-database-schema)
7. [Backend Structure](#7-backend-structure)
8. [API Routes](#8-api-routes)
9. [Python Worker Design](#9-python-worker-design)
10. [Frontend Structure](#10-frontend-structure)
11. [State Management Patterns](#11-state-management-patterns)
12. [Caching Strategy](#12-caching-strategy)
13. [Real-Time Updates — SSE](#13-real-time-updates--sse)
14. [Saved Workspaces and Drift Detection](#14-saved-workspaces-and-drift-detection)
15. [Projected vs Baseline State](#15-projected-vs-baseline-state)
16. [Phased Build Plan](#16-phased-build-plan)
17. [Testing Strategy](#17-testing-strategy)
18. [Learning Curriculum](#18-learning-curriculum)

---

## 1. Project Purpose

A persistent GM workspace that gives NBA front offices — or anyone who thinks like one — a single place to evaluate roster construction, simulate trades, scout draft prospects, and understand team needs.

The app bridges raw NBA data and actionable intelligence. Every chart, recommendation, and score draws from the same underlying computed metrics so the visuals and the decisions speak the same language.

**Portfolio goals:**
- Demonstrate backend-leaning full stack capability
- Show multi-service architecture (Node.js + Python workers)
- Signal systems thinking — caching, real-time updates, data consistency
- Build something with real domain substance, not a contrived demo

---

## 2. Core Features

### Trade Machine
- CBA salary matching with 125% rule and hard cap checks
- Multi-team trade support
- Traded pick inclusion and ownership tracking
- Snapshot saved scenarios with drift detection
- Flags when real-world changes break a saved trade
- Projected team stats after hypothetical move

### Roster Advisor
- Identifies team needs across 8 categories: 3pt shooting, rim protection, playmaking, slashing, rebounding, point-of-attack defense, veteran leadership, youth
- Recommends available players and trade targets that fill needs
- Fit score for any player against any team broken down by category
- Always computed live from current roster data — never stored

### Draft Board
- Prospect profiles with combine data and stat trends
- Pick-range estimation using standings or set draft order
- Traded pick awareness affecting team's actual slot
- Team-need fit scoring for prospects
- User-customizable draft boards saved per workspace
- Model projected board as persistent comparison column
- Simulate rest of draft — auto-fill remaining picks

### Team Analytics
- Offensive and defensive rating trends
- Roster composition — age curve, positional balance
- Needs radar chart — league rankings across all categories
- Cap sheet with expiring deals and future flexibility
- Draft pick asset tracker
- Auto-generated natural language insights

### Player Analytics
- Season stat trend lines
- Percentile rankings vs league and positional peers
- Contract value chart — performance vs salary vs comparables
- Fit score against any team broken down by need category

### Shot Chart
- Shot plot — every attempt as made dot or missed X
- Zone heat map — FG% and volume by court zone with color grading
- Filters: season, individual game, shot type, quarter, home/away, win/loss
- Sidebar stats that react to the active filter
- Subtle animation on made shots at load

### Simulation
- Game count options: 1 game, 10 games, 30 games, full season, 2 seasons
- Results stream in via SSE as each run completes
- Season awards predicted statistically when season simulated
- Multi-run distribution — "made playoffs 7 of 10 simulations"
- Playoff bracket outcome display

### Workspaces and Auth
- JWT authentication — access token + refresh token
- One league-wide workspace per user, auto-initialized on register
- Saved trade scenarios with snapshot isolation
- Saved and custom-ranked draft boards per user
- Drift alerts when live data breaks a saved scenario
- Replayable onboarding tour

---

## 3. App Structure — Four Pages

### Page 1 — League View
- **Carousel** (glance): auto/manual scroll through all 30 teams showing projected starting 5, head coach, power ranking badge
- **Logo panel**: 30 team logos as quick-nav
- **Team view** (deep dive, on click): full roster with player cards, coaching staff, front office, full cap sheet, future salary commitments, draft pick assets, team stats, needs radar, derived insight cards
- **Player card indicators**: Expiring, Max, Rookie, Two-way, Trade candidate, Veteran minimum
- Real-world transactions update the league view automatically via SSE

### Page 2 — Trading Block
- Player and team cards accessible
- Trade block signal per player — derived from expiring contract + positional redundancy
- Jump into trade machine from any player or team view
- Successful real trades update this page automatically

### Page 3 — Draft Board
- Three columns: user custom board, model projected board (comparison), pick order column
- Drag to reorder prospects on custom board
- Prospect profiles with combine data, scores, and fit scores per team
- Filter by position, age, school, country, trait priority
- Team need fit filter — filter board by how prospects fit a selected team
- Simulate rest of draft button — auto-fills remaining picks for teams user doesn't care about
- Pick ownership reflects active trade scenario if one is open

### Page 4 — Simulation
- Roster selector from workspace state
- Game count configuration
- Live SSE progress — run counter and partial results streaming
- Final results: standings, playoff bracket, award predictions, outcome distribution
- Simulation history

---

## 4. Key Design Decisions

### Two parallel realities
Every computed value has two versions:
- **Baseline** — computed from real-world data by Python workers. Cached in Redis. Reflects actual NBA.
- **Projected** — computed on demand from user's hypothetical scenario state. Never cached. Always derived from current scenario configuration.

The UI always makes clear which version is being displayed.

### Saved state as snapshot, not reference
When a trade scenario is saved, the system snapshots the exact roster, contract, and pick state at that moment as `jsonb` blobs. It does not save references to live data. Drift detection compares the frozen snapshot against live data to generate alerts.

### User always controls interaction with reality
Real-world transactions never silently mutate a saved scenario. The drift worker detects changes and surfaces alerts. The user then chooses to ignore, update, or start fresh. Never automatic.

### Caching rule
- **Cache**: player stats, shot chart aggregates, team analytics dashboards (real-world state), fit scores, prospect scores, power rankings, standings
- **Never cache**: trade validation responses, active scenario projections, drift alert results

### Draft order when unknown
Use current standings blended 70/30 with league-average baseline for teams more than 15 games below .500. Prevents overstating the signal of extreme early-season records.

### Workspace definition
One user = one league-wide workspace. The workspace contains multiple saved trade scenarios and draft boards. There is no "create workspace" action — it is auto-initialized on registration.

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js |
| Backend framework | Express |
| Backend language | TypeScript (strict mode) |
| Database | PostgreSQL |
| Query builder | Knex |
| Cache | Redis (ioredis) |
| Job queue | BullMQ |
| Python workers | Python 3 — SQLAlchemy, psycopg2, nba_api, pandas, numpy |
| Frontend framework | React + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Server state | React Query |
| Client state | Zustand |
| Routing | React Router v6 |
| HTTP client | Axios |
| Charts | Recharts |
| Canvas | Canvas API (native) |
| Drag and drop | dnd-kit |
| Real-time | Server-Sent Events (SSE) |
| Validation | Zod (backend schemas) |
| Testing — Node | Vitest + Supertest |
| Testing — Python | pytest |
| Containerization | Docker + docker-compose |
| CI/CD | GitHub Actions |
| Deployment | Railway or Render |

---

## 6. Database Schema

### Layer 1 — Core identity and roster

```
users                    — id, email, password_hash, display_name, onboarding_completed
teams                    — id, nba_team_id, name, abbreviation, city, conference, division, logo_url
players                  — id, nba_player_id, team_id, position, jersey_number, birth_date, height_inches, weight_lbs, wingspan_inches, standing_reach, status
coaches                  — id, team_id, name, role, years_with_team
front_office             — id, team_id, name, title
contracts                — id, player_id, team_id, total_years, years_remaining, annual_value, current_year_salary, has_player_option, has_team_option, is_two_way, is_rookie_scale, is_max
```

### Layer 2 — Cap, picks, and stats

```
team_cap_sheet           — id, team_id, season_year, total_payroll, salary_cap, luxury_tax_line, cap_space, dead_cap, is_over_tax, has_mid_level, mid_level_amount
future_salaries          — id, contract_id, season_year, salary, is_player_option, is_team_option
draft_picks              — id, current_owner_id, original_team_id, draft_year, round, pick_number, is_known, conveyance_notes, is_swap_right, owed_to_team_id
player_season_stats      — id, player_id, season_year, games_played, minutes_per_game, points, rebounds, assists, steals, blocks, fg_pct, three_pct, ft_pct, true_shooting_pct, usage_rate, offensive_rating, defensive_rating, win_shares, box_plus_minus, vorp
team_season_stats        — id, team_id, season_year, offensive_rating, defensive_rating, net_rating, pace, three_pct, three_rate, assist_rate, turnover_rate, wins, losses, conference_seed
shot_chart_entries       — id, player_id, game_id, season_year, loc_x, loc_y, shot_made, shot_distance, shot_type, action_type, period, is_home, team_won
player_computed_metrics  — id, player_id, season_year, three_point_percentile, rim_protection_score, playmaking_score, slashing_score, rebounding_percentile, poa_defense_score, leadership_index, fit_score_cache (jsonb), data_completeness, computed_at
```

### Layer 3 — Workspaces and saved state

```
workspaces               — id, user_id, name, last_accessed
trade_scenarios          — id, workspace_id, name, status, is_valid, has_drift, snapshot_roster (jsonb), snapshot_contracts (jsonb), snapshot_picks (jsonb), saved_at, drift_checked_at
trade_scenario_teams     — id, scenario_id, team_id
trade_scenario_players   — id, scenario_id, player_id, from_team_id, to_team_id
trade_scenario_picks     — id, scenario_id, pick_id, from_team_id, to_team_id
drift_alerts             — id, scenario_id, alert_type, description, is_resolved, detected_at
draft_boards             — id, workspace_id, name, is_model_default
draft_board_entries      — id, board_id, prospect_id, custom_rank, model_rank, user_notes
```

### Layer 4 — Prospects and simulation

```
prospects                — id, name, position, age, school, country, height_inches, weight_lbs, wingspan_inches, draft_year, projected_pick, projected_pick_low, projected_pick_high, data_completeness
prospect_stats           — id, prospect_id, league, season, points, rebounds, assists, steals, blocks, fg_pct, three_pct, ft_pct, usage_rate
prospect_computed_scores — id, prospect_id, shooting_score, size_score, defense_score, upside_score, readiness_score, overall_model_score, model_rank, data_completeness, computed_at
simulations              — id, workspace_id, sim_type, num_games, num_seasons, roster_snapshot, created_at
simulation_results       — id, simulation_id, run_index, wins, losses, made_playoffs, playoff_exit_round, award_predictions (jsonb), season_stats_summary (jsonb), final_standings (jsonb), completed_at
worker_jobs              — id, job_type, status, target_entity, result_summary (jsonb), error_message, scheduled_at, started_at, completed_at
power_rankings           — id, team_id, rank, previous_rank, composite_score, computed_at
```

### Key schema decisions
- `snapshot_roster`, `snapshot_contracts`, `snapshot_picks` are `jsonb` — frozen blobs, not relational references
- `fit_score_cache` on `player_computed_metrics` is `jsonb` keyed by `team_id` — pre-computed by worker
- `draft_picks` tracks `current_owner_id` and `original_team_id` separately
- `data_completeness` field on players, prospects, metrics — values: `full`, `partial`, `limited`
- Node API never writes to computed tables — Python workers own all writes there

---

## 7. Backend Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.ts              — validates env vars on boot with zod
│   │   ├── db.ts               — knex instance
│   │   ├── redis.ts            — ioredis client
│   │   └── queue.ts            — BullMQ queue definitions
│   ├── db/
│   │   ├── migrations/         — numbered migration files
│   │   └── seeds/              — deterministic seed data
│   ├── middleware/
│   │   ├── authenticate.ts     — JWT verify, attaches user to req
│   │   ├── validate.ts         — zod schema runner, rejects malformed requests
│   │   ├── cache.ts            — Redis read-through middleware
│   │   ├── rateLimiter.ts      — per-route rate limiting
│   │   └── errorHandler.ts     — global 4-arg error formatter
│   ├── modules/
│   │   ├── auth/               — routes, controller, service, schema
│   │   ├── teams/              — routes, controller, service, queries
│   │   ├── players/            — routes, controller, service, queries, schema
│   │   ├── trade/              — routes, controller, service, queries, schema, drift.service
│   │   ├── draft/              — routes, controller, service, queries, schema
│   │   ├── analytics/          — routes, controller, service
│   │   ├── shotchart/          — routes, controller, service
│   │   ├── simulation/         — routes, controller, service
│   │   └── workspace/          — routes, controller, service
│   ├── services/
│   │   ├── cache.service.ts    — get/set/invalidate helpers
│   │   ├── fitScore.service.ts — shared fit scoring logic
│   │   └── pickRange.service.ts — draft order math
│   ├── sse/
│   │   ├── sse.manager.ts      — client connection registry
│   │   └── sse.handler.ts      — stream write helpers
│   ├── workers/
│   │   ├── queues.ts           — queue definitions
│   │   ├── processors.ts       — BullMQ job processors
│   │   └── workerBridge.ts     — spawns Python scripts via child_process
│   ├── utils/                  — pure helper functions
│   ├── app.ts                  — Express setup, middleware registration, module mounting
│   └── server.ts               — HTTP server entry, binds port
├── .env
├── .env.example
├── knexfile.ts
└── package.json

workers/                        — Python worker scripts (sibling to server/)
├── ingest_rosters.py
├── ingest_stats.py
├── ingest_shotchart.py
├── ingest_prospects.py
├── ingest_picks.py
├── compute_player_metrics.py
├── compute_fit_scores.py
├── compute_power_rankings.py
├── compute_prospect_scores.py
├── detect_drift.py
├── run_simulation.py
└── lib/
    ├── db.py                   — shared SQLAlchemy connection
    ├── cache.py                — shared Redis client
    ├── nba_client.py           — nba_api wrapper with rate limiting
    └── fallback.py             — missing data fallback logic
```

### Layer responsibilities

| Layer | Owns | Never does |
|---|---|---|
| `server.ts` | Port binding, HTTP server creation | Business logic |
| `app.ts` | Express config, global middleware, route mounting | Data access |
| Middleware | Gatekeeping — auth, validation, caching | Business logic |
| Router | Path/method matching, middleware per route | Logic, data |
| Controller | Extract params, call service, send response | SQL, business rules |
| Service | All business logic, orchestrates queries | HTTP concerns |
| `queries.ts` | All database interaction, typed returns | Logic |

**Response path**: queries → service (return value) → controller (`res.json()`) → Express sends to client directly. Router and middleware are not re-entered on the way back. Errors travel forward via `next(error)` to the global error handler.

---

## 8. API Routes

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | | Create account, auto-initialize workspace |
| POST | /api/auth/login | | Returns JWT access + refresh token |
| POST | /api/auth/refresh | | Silent token refresh |
| POST | /api/auth/logout | 🔒 | Invalidate refresh token |
| PATCH | /api/auth/onboarding | 🔒 | Mark onboarding complete or reset |

### Teams — `/api/teams`
| Method | Path | Cache | Description |
|---|---|---|---|
| GET | /api/teams | ✓ | All 30 teams |
| GET | /api/teams/:teamId | ✓ | Team header — record, seed, power rank |
| GET | /api/teams/:teamId/roster | ✓ | Full roster with contract indicators |
| GET | /api/teams/:teamId/staff | ✓ | Coaching staff and front office |
| GET | /api/teams/:teamId/cap | ✓ | Current cap sheet |
| GET | /api/teams/:teamId/cap/future | ✓ | Year-by-year future commitments |
| GET | /api/teams/:teamId/picks | ✓ | All owned and owed picks |
| GET | /api/teams/:teamId/stats | ✓ | Team season stats |
| GET | /api/teams/:teamId/needs | ✓ | Derived roster needs — 8 categories |
| GET | /api/teams/:teamId/analytics | ✓ | Full analytics dashboard |
| GET | /api/teams/compare | | Side-by-side ?teamA=&teamB= |
| GET | /api/teams/league/carousel | ✓ | Starting 5, coach, power rank per team |

### Players — `/api/players`
| Method | Path | Cache | Description |
|---|---|---|---|
| GET | /api/players/search | ✓ | Search by name — ?q= |
| GET | /api/players/:playerId | ✓ | Full profile |
| GET | /api/players/:playerId/stats | ✓ | Season stats — ?season= |
| GET | /api/players/:playerId/metrics | ✓ | Percentile rankings and role scores |
| GET | /api/players/:playerId/fit/:teamId | ✓ | Fit score vs specific team |
| GET | /api/players/:playerId/fit/all | ✓ | Fit score vs all 30 teams |
| GET | /api/players/:playerId/contract | ✓ | Contract detail and comparables |
| GET | /api/players/:playerId/shotchart | ✓ | Raw shot entries with filters |
| GET | /api/players/:playerId/shotchart/zones | ✓ | Pre-aggregated zone stats |

### Trade — `/api/trade`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/trade/validate | | CBA validation — stateless, no auth required |
| POST | /api/trade/project | | Project resulting team stats — stateless |
| GET | /api/trade/scenarios | 🔒 | All saved scenarios for user |
| POST | /api/trade/scenarios | 🔒 | Save scenario with snapshot |
| GET | /api/trade/scenarios/:id | 🔒 | Single scenario + drift alerts |
| PATCH | /api/trade/scenarios/:id | 🔒 | Rename or re-snapshot |
| POST | /api/trade/scenarios/:id/duplicate | 🔒 | Clone scenario |
| DELETE | /api/trade/scenarios/:id | 🔒 | Delete scenario |
| GET | /api/trade/scenarios/:id/drift | 🔒 SSE | Stream drift detection results |

### Draft — `/api/draft`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/draft/prospects | | All prospects with filters |
| GET | /api/draft/prospects/:id | | Full prospect profile |
| GET | /api/draft/prospects/:id/fit/:teamId | | Prospect fit vs team needs |
| GET | /api/draft/order | | Projected draft order |
| GET | /api/draft/boards | 🔒 | All saved boards for user |
| POST | /api/draft/boards | 🔒 | Create board — defaults to model order |
| GET | /api/draft/boards/:id | 🔒 | Single board with entries |
| PATCH | /api/draft/boards/:id | 🔒 | Rename board |
| PUT | /api/draft/boards/:id/rankings | 🔒 | Bulk replace ranking array |
| PATCH | /api/draft/boards/:id/prospects/:id | 🔒 | Update single entry — notes or rank |
| POST | /api/draft/boards/:id/simulate | 🔒 | Auto-fill remaining picks |
| DELETE | /api/draft/boards/:id | 🔒 | Delete board |

### Analytics — `/api/analytics`
| Method | Path | Cache | Description |
|---|---|---|---|
| GET | /api/analytics/league/standings | ✓ | Full league standings |
| GET | /api/analytics/league/rankings/:category | ✓ | All teams ranked by stat |
| GET | /api/analytics/league/power | ✓ | Power rankings with delta |
| GET | /api/analytics/trade-block | ✓ | Derived trade block signals |

### Simulation — `/api/simulation`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/simulation | 🔒 | Enqueue simulation job |
| GET | /api/simulation/:id/progress | 🔒 SSE | Stream run completions |
| GET | /api/simulation/:id/results | 🔒 | Full completed results |
| GET | /api/simulation | 🔒 | All simulations for user |
| DELETE | /api/simulation/:id | 🔒 | Delete simulation |

### Workspace — `/api/workspace`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/workspace | 🔒 | Current workspace — recent activity |
| GET | /api/workspace/activity | 🔒 | Activity feed — recent teams, scenarios, sims |

---

## 9. Python Worker Design

### Ingestion workers

| Worker | File | Schedule | Sources | Triggers |
|---|---|---|---|---|
| Roster + contracts | `ingest_rosters.py` | Every 6h | NBA Stats API, Spotrac | drift worker |
| Player + team stats | `ingest_stats.py` | Every 6h +30min | NBA Stats API, BBRef | metrics worker |
| Shot chart | `ingest_shotchart.py` | Daily | NBA Stats API shotchartdetail | cache invalidation |
| Draft prospects | `ingest_prospects.py` | Daily (draft season), weekly (off-season) | NBA combine, BBRef, ESPN | prospect scoring worker |
| Draft pick ownership | `ingest_picks.py` | Every 6h | Spotrac, BBRef | drift worker |

### Computation workers

| Worker | File | Triggered by | Writes to |
|---|---|---|---|
| Player metrics + percentiles | `compute_player_metrics.py` | Stats ingestion | `player_computed_metrics` |
| Fit scores | `compute_fit_scores.py` | Metrics worker | `fit_score_cache` jsonb on metrics |
| Power rankings | `compute_power_rankings.py` | Stats ingestion | `power_rankings` |
| Prospect scores | `compute_prospect_scores.py` | Prospect ingestion | `prospect_computed_scores` |

### Maintenance workers

| Worker | File | Triggered by | Action |
|---|---|---|---|
| Drift detection | `detect_drift.py` | Roster + picks ingestion | Writes `drift_alerts`, pushes SSE |
| Simulation runner | `run_simulation.py` | User action (on demand) | Writes `simulation_results`, streams SSE progress |

### Execution chain
```
Every 6 hours:
  ingest_rosters.py  ─┐
  ingest_picks.py    ─┴─→ detect_drift.py ──→ SSE push to affected clients
  
  ingest_stats.py (+30min) ─→ compute_player_metrics.py ─→ compute_fit_scores.py
                           └→ compute_power_rankings.py

Daily:
  ingest_shotchart.py (incremental by game_id)
  ingest_prospects.py ─→ compute_prospect_scores.py

On demand:
  run_simulation.py ─→ SSE progress stream ─→ simulation_results
```

### Missing data fallback
- `full` — all stats available, compute normally
- `partial` — use most recent season or career averages, flag in UI as "Limited data"
- `limited` — use positional league averages as proxy, flag as "Estimated". Never show zeros.

---

## 10. Frontend Structure

```
client/
├── src/
│   ├── pages/
│   │   ├── landing/            — Landing.tsx
│   │   ├── auth/               — Login.tsx, Register.tsx
│   │   ├── onboarding/         — Onboarding.tsx (replayable)
│   │   ├── home/               — Home.tsx (workspace dashboard)
│   │   ├── league/             — LeagueView.tsx, TeamView.tsx
│   │   ├── trade/              — TradingBlock.tsx, TradeMachine.tsx
│   │   ├── draft/              — DraftBoard.tsx
│   │   ├── players/            — PlayerView.tsx
│   │   └── simulation/         — Simulation.tsx
│   ├── components/
│   │   ├── ui/                 — Badge, Button, Card, Modal, Spinner, Tooltip, ProgressBar, DriftAlert
│   │   ├── layout/             — Navbar, Sidebar, AuthGuard
│   │   ├── league/             — TeamCarousel, TeamLogoPanel, TeamCarouselCard
│   │   ├── team/               — RosterGrid, PlayerCard, CapSheet, PickAssets, NeedsRadar, RatingTrend, InsightCards
│   │   ├── trade/              — TradeBuilder, SalaryMeter, ProjectedStats, ScenarioList, DriftPanel
│   │   ├── draft/              — ProspectBoard, ProspectCard, PickOrderColumn, ModelRankColumn
│   │   ├── player/             — StatTrendChart, PercentileBar, ContractValue, FitScorePanel, ShotChart
│   │   └── simulation/         — SimConfig, SimProgress, SimResults, PlayoffBracket
│   ├── hooks/
│   │   — useAuth, useTeam, usePlayer, useTrade, useDraftBoard,
│   │     useSimulation, useShotChart, useSSE, useDrift, useProjection
│   ├── services/
│   │   — auth, teams, players, trade, draft, analytics, simulation, workspace, shotchart
│   │   — all wrap a shared axios instance from lib/api.ts
│   ├── store/
│   │   — authStore, workspaceStore, tradeStore, uiStore (Zustand slices)
│   ├── lib/
│   │   — api.ts (axios instance + JWT interceptor)
│   │   — sse.ts (EventSource wrapper)
│   │   — queryClient.ts (React Query setup)
│   │   — constants.ts (positions, need categories)
│   ├── types/                  — shared TypeScript interfaces
│   ├── utils/                  — pure helpers
│   └── assets/
│   App.tsx                     — root layout, auth guard, nav
│   main.tsx                    — React entry, router setup
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 11. State Management Patterns

### Three buckets — no exceptions

| Bucket | Owner | Examples |
|---|---|---|
| Server state | React Query | Player stats, rosters, scenarios, prospects |
| Client state | Zustand | Active team, open modal, current scenario being built |
| Ephemeral state | useState | Form input, dropdown open, hover state |

### React Query key hierarchy
```typescript
const queryKeys = {
  teams: {
    all: ['teams'],
    detail: (id: string) => ['teams', id],
    roster: (id: string) => ['teams', id, 'roster'],
    needs: (id: string) => ['teams', id, 'needs'],
    analytics: (id: string) => ['teams', id, 'analytics'],
  },
  players: {
    detail: (id: string) => ['players', id],
    stats: (id: string, season: number) => ['players', id, 'stats', season],
    shotchart: (id: string, filters: ShotFilters) => ['players', id, 'shotchart', filters],
    fit: (playerId: string, teamId: string) => ['players', playerId, 'fit', teamId],
  },
  trade: {
    scenarios: ['trade', 'scenarios'],
    scenario: (id: string) => ['trade', 'scenarios', id],
  },
  draft: {
    prospects: (filters: ProspectFilters) => ['draft', 'prospects', filters],
    boards: ['draft', 'boards'],
    board: (id: string) => ['draft', 'boards', id],
  },
}
```

### Key rules
- Components never import axios or call service functions directly — only hooks
- Zustand never holds fetched server data — React Query owns that
- React Query never holds UI state like which modal is open — Zustand owns that
- Zustand describes **intent** (active team ID). React Query describes **reality** (actual team data)
- SSE events trigger `queryClient.invalidateQueries()` — this is the bridge between real-time and React Query
- Trade builder uses optimistic updates — instant UI, async server, rollback on failure
- Draft board uses local `useState` for drag state, debounced mutation to persist

### Zustand stores
```typescript
authStore    — user, accessToken, setAuth(), clearAuth(), isAuthenticated()
tradeStore   — activeScenarioId, scenarioState, isProjectionStale, addPlayer(), removePlayer()
uiStore      — activeTeamId, isCarouselPlaying, openModal, setActiveTeam(), toggleCarousel()
workspaceStore — recent scenarios, recent boards, last accessed team
```

---

## 12. Caching Strategy

### Cache with Redis
- Player season stats — 6h TTL, invalidated by stats worker
- Shot chart aggregates — 24h TTL, invalidated by shotchart worker per player
- Team analytics dashboards (real-world state only) — 6h TTL
- Fit scores (all players vs all teams) — 6h TTL, invalidated by metrics worker
- Prospect scores and rankings — 24h TTL
- Power rankings — 6h TTL
- League standings and carousel — 6h TTL

### Never cache
- Trade validation responses (unique per request, near-zero hit rate)
- Active scenario projections (unique per scenario state)
- Drift alert results (always live)
- Simulation results (on-demand computation)

### Invalidation pattern
Event-driven — workers emit completion events, cache service clears targeted keys:
```
roster worker completes for teamId
  → delete team:{teamId}:roster
  → delete team:{teamId}:cap
  → delete player:{id}:contract for all players on team
  → delete teams:carousel
  → enqueue drift detection job
```

### Cache key convention
```
team:{teamId}:roster
team:{teamId}:analytics
player:{playerId}:stats:{season}
player:{playerId}:fit:{teamId}
player:{playerId}:shotchart:{season}
draft:prospects:all
analytics:league:power
```

---

## 13. Real-Time Updates — SSE

### Use SSE (not WebSockets) for
- Simulation run progress — streams partial results per run
- Worker job completion — notifies clients of fresh data
- Drift detection results — pushes alerts when scenario is open
- Draft board auto-fill — animation sequence as picks are made

### Pattern
```typescript
// Server — Express SSE endpoint
app.get('/api/simulation/:id/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)
  simulationQueue.on('progress', (job, progress) => {
    if (job.id === req.params.id) send(progress)
  })
  req.on('close', () => { /* cleanup listener */ })
})
```

```typescript
// Client — useSSE hook
function useSSE(url: string, onEvent: (event: any) => void) {
  useEffect(() => {
    const source = new EventSource(url)
    source.onmessage = (e) => onEvent(JSON.parse(e.data))
    return () => source.close()
  }, [url])
}
```

### Worker update hook — lives at top of authenticated layout
```typescript
function useWorkerUpdates() {
  const queryClient = useQueryClient()
  useSSE('/api/workers/events', (event) => {
    switch (event.type) {
      case 'roster_updated':
        queryClient.invalidateQueries({ queryKey: ['teams', event.teamId] })
        break
      case 'stats_updated':
        queryClient.invalidateQueries({ queryKey: ['players'] })
        break
      case 'drift_detected':
        queryClient.invalidateQueries({ queryKey: queryKeys.trade.scenario(event.scenarioId) })
        break
    }
  })
}
```

---

## 14. Saved Workspaces and Drift Detection

### What is snapshotted on save
- Full roster of all teams involved — player identities and team assignments
- Contract values and structure for all players involved
- Pick identities, current ownership, and conveyance conditions

### What is never snapshotted
- Player stats (always live — belong to the player, not the scenario)
- Team needs (always computed live from current roster)
- Standings and power rankings (always live)

### Drift detection — what triggers an alert
- A player in the snapshot is now on a different team in reality
- A contract value or structure changed
- A pick involved in the scenario changed ownership in reality
- Pick conveyance conditions changed

### User choices when drift is detected
1. **Ignore** — keep the scenario as-is, treat it as a pure hypothetical
2. **Update to reality** — re-snapshot against current live data
3. **Duplicate and update** — keep original as historical reference, work from updated copy

### Fundamental rule
Real-world transactions never silently mutate a saved scenario. Every interaction between reality and a workspace goes through an explicit user decision.

---

## 15. Projected vs Baseline State

### The two data flows — never mixed

**Real-world path:**
```
Python worker → PostgreSQL → Node API → Redis cache → Frontend (league view, team view, player view)
```

**Scenario path:**
```
User action → React state (tradeStore) → POST /api/trade/validate (CBA check)
                                        → POST /api/trade/project (projected stats)
                                        → Frontend (trade machine only)
```

### What POST /api/trade/project returns
```typescript
{
  teams: {
    [teamId]: {
      projectedStats: { offRating, defRating, pace, threePct, ... },
      projectedNeeds: { threePoint: 8, rimProtection: 28, ... },
      projectedCapSheet: { totalPayroll, capSpace, isOverTax, ... },
      projectedPowerRankingScore: number,
      availableExceptions: { midLevel: boolean, biAnnual: boolean },
      pickAssets: { owned: [], owed: [] }
    }
  },
  fitScores: {
    [playerId]: {
      [teamId]: { overall: number, breakdown: { threePoint: number, ... } }
    }
  }
}
```

### Values affected when a trade scenario is active
- Power ranking score — recomputed from hypothetical roster
- Team needs — recomputed from hypothetical roster
- Cap sheet and tax status — arithmetic from contract values
- Projected team stats — minutes-weighted composite of remaining + incoming players
- Fit scores — computed against new needs, not cached baseline needs
- Draft pick assets — reflects scenario pick movements
- Starting five projection — NOT updated (carousel is always real-world only)

### UI rule
Always display a clear indicator when viewing projected state:
> "Viewing projected state based on your active trade scenario"

---

## 16. Phased Build Plan

### Phase 1 — Foundation and live data (Weeks 1–3)
**Goal:** Real NBA data in database, auth working end to end, workers running on schedule

Backend:
- Monorepo setup — TypeScript, ESLint, Prettier
- PostgreSQL + Knex — all migrations run
- Redis connected, BullMQ queues defined
- Express scaffolded — all modules stubbed
- JWT auth routes — register, login, refresh, logout
- Environment validation on boot (Zod)
- Global error handler

Python workers:
- `lib/` shared modules — db, cache, nba_client, fallback
- `ingest_rosters.py` — players + contracts
- `ingest_stats.py` — player and team stats
- `ingest_picks.py` — draft pick ownership
- Scheduled via BullMQ cron
- Database seeded with all 30 teams

Frontend:
- Vite + React + TypeScript scaffolded
- Tailwind, React Query, Zustand, React Router installed
- Axios instance with JWT interceptor
- Auth store + auth pages
- AuthGuard and route setup
- All service files stubbed

---

### Phase 2 — League view and team profiles (Weeks 4–6)
**Goal:** First user-facing experience. Deployable after this phase.

Backend:
- All team endpoints with Redis caching
- All player endpoints with Redis caching
- `compute_player_metrics.py` — all 8 need scores
- `compute_power_rankings.py`
- `compute_fit_scores.py`
- Missing data fallback in `lib/fallback.py`

Frontend:
- Landing page and onboarding tour
- Home dashboard
- League view — carousel and logo panel
- Team view — full deep dive
- All team sub-components
- Player view — profile, stats, percentiles, contract value
- Player card indicators
- SSE hook for worker update events

---

### Phase 3 — Trade machine (Weeks 7–9)
**Goal:** Core interactive feature live

Backend:
- `POST /api/trade/validate` — CBA engine
- `POST /api/trade/project` — projected stats
- All scenario CRUD
- Snapshot logic on save
- `detect_drift.py`
- SSE drift endpoint

Frontend:
- Trading block page
- Trade machine — scenario builder canvas
- Salary meter — live CBA validation
- Projected stats panel
- Projected needs radar
- Saved scenarios sidebar
- Drift alert panel
- Optimistic updates
- tradeStore in Zustand

---

### Phase 4 — Shot charts and player analytics (Weeks 10–11)
**Goal:** Complete player profiles

Backend:
- Shot chart endpoints — raw and zones
- `ingest_shotchart.py` — incremental
- Redis caching on shot chart queries

Frontend:
- Canvas court rendering
- Shot plot and zone heat map views
- All shot chart filters
- Animated made shots on load
- Percentile bar components
- Fit score panel

---

### Phase 5 — Draft board (Weeks 12–13)
**Goal:** Full draft scouting suite

Backend:
- All prospect endpoints
- Draft order endpoint
- Draft board CRUD
- `ingest_prospects.py`
- `compute_prospect_scores.py`

Frontend:
- Three-column draft board layout
- dnd-kit drag reorder
- Model board comparison column
- Prospect profiles and filters
- Auto-fill simulate
- Trade scenario pick state reflected

---

### Phase 6 — Simulation (Weeks 14–16)
**Goal:** Full simulation suite

Backend:
- Simulation enqueue endpoint
- SSE progress stream
- `run_simulation.py` — game model → season model

Frontend:
- Sim config page
- SSE progress bar and run counter
- Partial results streaming
- Standings, playoff bracket, awards
- Outcome distribution view

---

### Build principles
1. **Always shippable** — every phase ends with a working deployed app
2. **Backend before frontend** — stand up API and worker first, build UI against real data
3. **Seed data from day one** — never develop against fake data
4. **Deploy after Phase 2** — get a live URL before building Phase 3

---

## 17. Testing Strategy

### Test — high value
- **CBA trade validation engine** — dozens of edge cases, silent bugs produce wrong valid-looking results
- **Drift detection logic** — snapshot vs live comparison, multiple change types
- **Python worker computations** — percentile ranks, fit scores, power rankings — pure functions
- **Pick range estimation** — math with enough edge cases to warrant specs

### Test — medium value
- API route integration tests (Supertest) — trade validation, scenario save, drift check, simulation enqueue
- Node/Python worker bridge — confirms real worker runs and writes expected shape

### Skip or defer
- React component unit tests on display components
- E2E tests (Playwright/Cypress) — defer until app is stable

### Setup
```
server/tests/
├── unit/
│   ├── trade/cbaValidator.test.ts
│   ├── trade/driftDetection.test.ts
│   └── draft/pickRange.test.ts
└── integration/
    ├── trade.routes.test.ts
    └── auth.routes.test.ts

workers/tests/
├── test_compute_metrics.py
├── test_compute_fit_scores.py
└── test_detect_drift.py
```

**Tools:** Vitest + Supertest (Node), pytest (Python)

### The philosophy
Write tests on logic that is silent when wrong and consequential when broken. Skip tests on things you can see break with your own eyes. Articulate what you tested and why — that judgment is more impressive than coverage numbers.

---

## 18. Learning Curriculum

Topics are listed in the order they become relevant during the build.

### Phase 1
- TypeScript core type system — interfaces, unions, generics, type narrowing
- TypeScript advanced — utility types, discriminated unions, strict mode
- Node.js runtime — event loop, async/await, child_process, module system
- Express architecture — middleware chain, router, error handling
- JWT authentication — access + refresh tokens, silent refresh, interceptor
- Backend security — bcrypt, rate limiting, Zod validation, Helmet, CORS
- SQL fundamentals — joins, CTEs, window functions, aggregates
- PostgreSQL specifics — jsonb, indexes, transactions, upsert
- Knex — migrations, seeds, query builder, TypeScript types
- Database design — normalization, foreign keys, indexing strategy
- Docker + docker-compose — local multi-service dev environment

### Phase 2
- Redis fundamentals — data structures, TTL, pub/sub, ioredis
- Caching patterns — cache-aside, invalidation, TTL by data volatility
- BullMQ — queues, workers, cron jobs, job dependencies, progress events
- Python worker design — SQLAlchemy, psycopg2, nba_api, pandas, numpy
- React fundamentals — hooks, component composition, render optimization
- React Router v6 — nested routes, protected routes, layout routes
- React Query — useQuery, useMutation, query keys, stale time, invalidation
- Zustand — store slices, selector pattern, devtools
- Recharts — LineChart, RadarChart, BarChart, responsive containers
- Basketball analytics — offensive/defensive rating, true shooting, usage rate, BPM, VORP
- CI/CD — GitHub Actions, auto-deploy, migration on deploy
- Observability — pino logging, Sentry error tracking, health checks

### Phase 3
- CBA rules — 125% rule, hard cap, second apron, MLE, Bird rights, rookie scale
- SSE protocol — event stream format, EventSource API, client registry pattern
- Reactive UI patterns — optimistic updates, rollback, debouncing, AbortController
- React Query advanced — optimistic updates with onMutate, cache invalidation from SSE

### Phase 4
- Canvas API — 2D context, coordinate systems, arcs, requestAnimationFrame, hit testing

### Phase 5
- dnd-kit — DndContext, useSortable, drag overlay, multi-container drag

### Phase 6
- Simulation modeling — Monte Carlo basics, possession-based game modeling, variance, regression to mean
- Award prediction — counting stat projection, confidence intervals

### Throughout
- Testing — Vitest, Supertest, pytest, what to test vs skip

### Reference resources
- TypeScript — typescriptlang.org handbook
- React Query patterns — TkDodo's blog
- BullMQ — docs.bullmq.io
- CBA rules — Larry Coon's CBA FAQ
- Basketball analytics — Basketball Reference glossary
- Canvas API — MDN Web Docs
- nba_api — github.com/swar/nba_api

---

*Last updated: Project planning phase — pre-implementation*
*Next step: Phase 1 implementation — begin with repo setup and database migrations*