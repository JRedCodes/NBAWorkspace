import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contracts', (t) => {
    t.unique(['player_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contracts', (t) => {
    t.dropUnique(['player_id'])
  })
}
