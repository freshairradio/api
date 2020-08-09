import { Pool, types } from 'pg'
import moment from 'moment'
import fs from 'fs'
const DATABASE_URL = fs.readFileSync('/run/secrets/database_url', 'utf-8')
types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) =>
  v === null ? null : moment(v)
)
types.setTypeParser(types.builtins.TIMESTAMP, (v) =>
  v === null ? null : moment(v)
)
console.log(DATABASE_URL)
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
const queryDB = async (query, params) => {
  return await pool.query(query, params)
}
export const sql = (string: TemplateStringsArray, ...params: any) => {
  return async () => {
    const text = string
      .slice(1)
      .reduce(
        (acc, cur) => ({ text: `${acc.text}$${acc.i}${cur}`, i: acc.i + 1 }),
        { text: string[0], i: 1 }
      )
    return await queryDB(text, params)
  }
}
export const multiple = async <T>(executor): Promise<T[]> => {
  const { rows } = await executor()
  return rows
}
export const single = async <T>(executor): Promise<T> => {
  const { rows } = await executor()
  return rows[0]
}
