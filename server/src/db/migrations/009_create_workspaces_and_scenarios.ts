import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspaces', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    t.string('name', 100).notNullable().defaultTo('My Workspace')
    t.timestamp('last_accessed').defaultTo(knex.fn.now())
    t.timestamps(true, true)
    t.unique(['user_id'])
  })

  await knex.schema.createTable('trade_scenarios', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('workspace_id').notNullable().references('id').inTable('workspaces').onDelete('CASCADE')
    t.string('name', 200).notNullable().defaultTo('Untitled Trade')
    t.string('status', 20).notNullable().defaultTo('draft')
    t.boolean('is_valid').defaultTo(null)
    t.boolean('has_drift').notNullable().defaultTo(false)
    t.jsonb('snapshot_roster').notNullable().defaultTo('{}')
    t.jsonb('snapshot_contracts').notNullable().defaultTo('{}')
    t.jsonb('snapshot_picks').notNullable().defaultTo('{}')
    t.timestamp('saved_at')
    t.timestamp('drift_checked_at')
    t.timestamps(true, true)
  })

  await knex.schema.createTable('trade_scenario_teams', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('scenario_id').notNullable().references('id').inTable('trade_scenarios').onDelete('CASCADE')
    t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.unique(['scenario_id', 'team_id'])
  })

  await knex.schema.createTable('trade_scenario_players', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('scenario_id').notNullable().references('id').inTable('trade_scenarios').onDelete('CASCADE')
    t.uuid('player_id').notNullable().references('id').inTable('players').onDelete('CASCADE')
    t.uuid('from_team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.uuid('to_team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
  })

  await knex.schema.createTable('trade_scenario_picks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('scenario_id').notNullable().references('id').inTable('trade_scenarios').onDelete('CASCADE')
    t.uuid('pick_id').notNullable().references('id').inTable('draft_picks').onDelete('CASCADE')
    t.uuid('from_team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.uuid('to_team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
  })

  await knex.schema.createTable('drift_alerts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('scenario_id').notNullable().references('id').inTable('trade_scenarios').onDelete('CASCADE')
    t.string('alert_type', 50).notNullable()
    t.text('description').notNullable()
    t.boolean('is_resolved').notNullable().defaultTo(false)
    t.timestamp('detected_at').defaultTo(knex.fn.now())
    t.timestamps(true, true)
  })

  await knex.schema.raw(
    'CREATE INDEX idx_trade_scenarios_workspace ON trade_scenarios(workspace_id)',
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('drift_alerts')
  await knex.schema.dropTable('trade_scenario_picks')
  await knex.schema.dropTable('trade_scenario_players')
  await knex.schema.dropTable('trade_scenario_teams')
  await knex.schema.dropTable('trade_scenarios')
  await knex.schema.dropTable('workspaces')
}
