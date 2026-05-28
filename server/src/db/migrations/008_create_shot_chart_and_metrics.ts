import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('shot_chart_entries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('player_id').notNullable().references('id').inTable('players').onDelete('CASCADE')
    t.integer('game_id').notNullable()
    t.string('season_year', 10).notNullable()
    t.float('loc_x').notNullable()
    t.float('loc_y').notNullable()
    t.boolean('shot_made').notNullable()
    t.integer('shot_distance')
    t.string('shot_type', 20)
    t.string('action_type', 100)
    t.integer('period')
    t.boolean('is_home')
    t.boolean('team_won')
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('player_computed_metrics', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('player_id').notNullable().references('id').inTable('players').onDelete('CASCADE')
    t.string('season_year', 10).notNullable()
    t.float('three_point_percentile')
    t.float('rim_protection_score')
    t.float('playmaking_score')
    t.float('slashing_score')
    t.float('rebounding_percentile')
    t.float('poa_defense_score')
    t.float('leadership_index')
    t.jsonb('fit_score_cache').defaultTo('{}')
    t.string('data_completeness', 10).notNullable().defaultTo('limited')
    t.timestamp('computed_at')
    t.timestamps(true, true)
    t.unique(['player_id', 'season_year'])
  })

  await knex.schema.raw(
    'CREATE INDEX idx_shot_chart_player_season ON shot_chart_entries(player_id, season_year)',
  )
  await knex.schema.raw(
    'CREATE INDEX idx_metrics_player_season ON player_computed_metrics(player_id, season_year)',
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('player_computed_metrics')
  await knex.schema.dropTable('shot_chart_entries')
}
