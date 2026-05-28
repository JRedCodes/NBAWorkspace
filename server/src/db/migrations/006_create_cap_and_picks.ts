import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('team_cap_sheet', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.string('season_year', 10).notNullable()
    t.bigInteger('total_payroll').notNullable().defaultTo(0)
    t.bigInteger('salary_cap').notNullable()
    t.bigInteger('luxury_tax_line').notNullable()
    t.bigInteger('cap_space').notNullable().defaultTo(0)
    t.bigInteger('dead_cap').notNullable().defaultTo(0)
    t.boolean('is_over_tax').notNullable().defaultTo(false)
    t.boolean('has_mid_level').notNullable().defaultTo(false)
    t.bigInteger('mid_level_amount')
    t.timestamps(true, true)
    t.unique(['team_id', 'season_year'])
  })

  await knex.schema.createTable('future_salaries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('contract_id').notNullable().references('id').inTable('contracts').onDelete('CASCADE')
    t.string('season_year', 10).notNullable()
    t.bigInteger('salary').notNullable()
    t.boolean('is_player_option').notNullable().defaultTo(false)
    t.boolean('is_team_option').notNullable().defaultTo(false)
    t.timestamps(true, true)
  })

  await knex.schema.createTable('draft_picks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('current_owner_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.uuid('original_team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.integer('draft_year').notNullable()
    t.integer('round').notNullable()
    t.integer('pick_number')
    t.boolean('is_known').notNullable().defaultTo(false)
    t.text('conveyance_notes')
    t.boolean('is_swap_right').notNullable().defaultTo(false)
    t.uuid('owed_to_team_id').references('id').inTable('teams').onDelete('SET NULL')
    t.timestamps(true, true)
  })

  await knex.schema.raw('CREATE INDEX idx_draft_picks_owner ON draft_picks(current_owner_id)')
  await knex.schema.raw('CREATE INDEX idx_draft_picks_original ON draft_picks(original_team_id)')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('draft_picks')
  await knex.schema.dropTable('future_salaries')
  await knex.schema.dropTable('team_cap_sheet')
}
