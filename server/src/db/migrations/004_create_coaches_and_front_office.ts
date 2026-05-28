import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('coaches', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.string('name', 150).notNullable()
    t.string('role', 100).notNullable()
    t.integer('years_with_team').defaultTo(0)
    t.timestamps(true, true)
  })

  await knex.schema.createTable('front_office', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
    t.string('name', 150).notNullable()
    t.string('title', 150).notNullable()
    t.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('front_office')
  await knex.schema.dropTable('coaches')
}
