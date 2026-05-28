import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('draft_boards', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('workspace_id').notNullable().references('id').inTable('workspaces').onDelete('CASCADE')
    t.string('name', 200).notNullable().defaultTo('My Draft Board')
    t.boolean('is_model_default').notNullable().defaultTo(false)
    t.timestamps(true, true)
  })

  await knex.schema.createTable('prospects', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('name', 200).notNullable()
    t.string('position', 10)
    t.integer('age')
    t.string('school', 200)
    t.string('country', 100)
    t.integer('height_inches')
    t.integer('weight_lbs')
    t.float('wingspan_inches')
    t.integer('draft_year').notNullable()
    t.integer('projected_pick')
    t.integer('projected_pick_low')
    t.integer('projected_pick_high')
    t.string('data_completeness', 10).notNullable().defaultTo('limited')
    t.timestamps(true, true)
  })

  await knex.schema.createTable('draft_board_entries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('board_id').notNullable().references('id').inTable('draft_boards').onDelete('CASCADE')
    t.uuid('prospect_id').notNullable().references('id').inTable('prospects').onDelete('CASCADE')
    t.integer('custom_rank')
    t.integer('model_rank')
    t.text('user_notes')
    t.timestamps(true, true)
    t.unique(['board_id', 'prospect_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('draft_board_entries')
  await knex.schema.dropTable('prospects')
  await knex.schema.dropTable('draft_boards')
}
