import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('teams', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.integer('nba_team_id').notNullable().unique()
    t.string('name', 100).notNullable()
    t.string('abbreviation', 5).notNullable()
    t.string('city', 100).notNullable()
    t.string('conference', 4).notNullable()
    t.string('division', 50).notNullable()
    t.string('logo_url', 500)
    t.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('teams')
}
