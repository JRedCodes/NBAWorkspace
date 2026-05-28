import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('players', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.integer('nba_player_id').notNullable().unique()
    t.uuid('team_id').references('id').inTable('teams').onDelete('SET NULL')
    t.string('first_name', 100).notNullable()
    t.string('last_name', 100).notNullable()
    t.string('position', 10)
    t.string('jersey_number', 5)
    t.date('birth_date')
    t.integer('height_inches')
    t.integer('weight_lbs')
    t.float('wingspan_inches')
    t.float('standing_reach')
    t.string('status', 50).notNullable().defaultTo('active')
    t.timestamps(true, true)
  })

  await knex.schema.raw('CREATE INDEX idx_players_team_id ON players(team_id)')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('players')
}
