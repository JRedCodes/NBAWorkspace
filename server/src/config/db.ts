import Knex from 'knex'
import { env } from './env'

const db = Knex({
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: { min: 2, max: 10 },
})

export default db
