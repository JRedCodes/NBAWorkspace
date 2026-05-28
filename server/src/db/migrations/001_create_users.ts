import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('email', 255).notNullable().unique()
    t.string('password_hash', 255).notNullable()
    t.string('display_name', 100).notNullable()
    t.boolean('onboarding_completed').notNullable().defaultTo(false)
    t.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}
