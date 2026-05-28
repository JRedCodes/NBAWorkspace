import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('prospect_stats', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('prospect_id').notNullable().references('id').inTable('prospects').onDelete('CASCADE')
    t.string('league', 100)
    t.string('season', 10)
    t.float('points')
    t.float('rebounds')
    t.float('assists')
    t.float('steals')
    t.float('blocks')
    t.float('fg_pct')
    t.float('three_pct')
    t.float('ft_pct')
    t.float('usage_rate')
    t.timestamps(true, true)
  })

  await knex.schema.createTable('prospect_computed_scores', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('prospect_id').notNullable().references('id').inTable('prospects').onDelete('CASCADE').unique()
    t.float('shooting_score')
    t.float('size_score')
    t.float('defense_score')
    t.float('upside_score')
    t.float('readiness_score')
    t.float('overall_model_score')
    t.integer('model_rank')
    t.string('data_completeness', 10).notNullable().defaultTo('limited')
    t.timestamp('computed_at')
    t.timestamps(true, true)
  })

  await knex.schema.createTable('simulations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('workspace_id').notNullable().references('id').inTable('workspaces').onDelete('CASCADE')
    t.string('sim_type', 50).notNullable()
    t.integer('num_games')
    t.integer('num_seasons')
    t.jsonb('roster_snapshot').notNullable().defaultTo('{}')
    t.timestamps(true, true)
  })

  await knex.schema.createTable('simulation_results', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('simulation_id').notNullable().references('id').inTable('simulations').onDelete('CASCADE')
    t.integer('run_index').notNullable()
    t.integer('wins')
    t.integer('losses')
    t.boolean('made_playoffs')
    t.integer('playoff_exit_round')
    t.jsonb('award_predictions').defaultTo('{}')
    t.jsonb('season_stats_summary').defaultTo('{}')
    t.jsonb('final_standings').defaultTo('{}')
    t.timestamp('completed_at').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('worker_jobs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('job_type', 100).notNullable()
    t.string('status', 20).notNullable().defaultTo('pending')
    t.string('target_entity', 200)
    t.jsonb('result_summary').defaultTo('{}')
    t.text('error_message')
    t.timestamp('scheduled_at').defaultTo(knex.fn.now())
    t.timestamp('started_at')
    t.timestamp('completed_at')
  })

  await knex.schema.createTable('power_rankings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.integer('rank').notNullable()
    t.integer('previous_rank')
    t.float('composite_score').notNullable()
    t.timestamp('computed_at').defaultTo(knex.fn.now())
  })

  await knex.schema.raw(
    'CREATE INDEX idx_power_rankings_team ON power_rankings(team_id, computed_at DESC)',
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('power_rankings')
  await knex.schema.dropTable('worker_jobs')
  await knex.schema.dropTable('simulation_results')
  await knex.schema.dropTable('simulations')
  await knex.schema.dropTable('prospect_computed_scores')
  await knex.schema.dropTable('prospect_stats')
}
