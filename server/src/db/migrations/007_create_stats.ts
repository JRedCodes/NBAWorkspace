import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('player_season_stats', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('player_id').notNullable().references('id').inTable('players').onDelete('CASCADE')
    t.string('season_year', 10).notNullable()
    t.integer('games_played').defaultTo(0)
    t.float('minutes_per_game')
    t.float('points')
    t.float('rebounds')
    t.float('assists')
    t.float('steals')
    t.float('blocks')
    t.float('fg_pct')
    t.float('three_pct')
    t.float('ft_pct')
    t.float('true_shooting_pct')
    t.float('usage_rate')
    t.float('offensive_rating')
    t.float('defensive_rating')
    t.float('win_shares')
    t.float('box_plus_minus')
    t.float('vorp')
    t.timestamps(true, true)
    t.unique(['player_id', 'season_year'])
  })

  await knex.schema.createTable('team_season_stats', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.string('season_year', 10).notNullable()
    t.float('offensive_rating')
    t.float('defensive_rating')
    t.float('net_rating')
    t.float('pace')
    t.float('three_pct')
    t.float('three_rate')
    t.float('assist_rate')
    t.float('turnover_rate')
    t.integer('wins').defaultTo(0)
    t.integer('losses').defaultTo(0)
    t.integer('playoff_seed')
    t.timestamps(true, true)
    t.unique(['team_id', 'season_year'])
  })

  await knex.schema.raw(
    'CREATE INDEX idx_player_stats_player_season ON player_season_stats(player_id, season_year)',
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('team_season_stats')
  await knex.schema.dropTable('player_season_stats')
}
