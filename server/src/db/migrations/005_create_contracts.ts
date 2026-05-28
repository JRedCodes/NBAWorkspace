import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('contracts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('player_id').notNullable().references('id').inTable('players').onDelete('CASCADE')
    t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.integer('years_remaining').notNullable().defaultTo(1)
    t.bigInteger('annual_value').notNullable()
    t.bigInteger('current_year_salary').notNullable()
    t.boolean('has_player_option').notNullable().defaultTo(false)
    t.boolean('has_team_option').notNullable().defaultTo(false)
    t.boolean('is_two_way').notNullable().defaultTo(false)
    t.boolean('is_rookie_scale').notNullable().defaultTo(false)
    t.boolean('is_max').notNullable().defaultTo(false)
    t.timestamps(true, true)
  })

  await knex.schema.raw('CREATE INDEX idx_contracts_player_id ON contracts(player_id)')
  await knex.schema.raw('CREATE INDEX idx_contracts_team_id ON contracts(team_id)')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('contracts')
}
