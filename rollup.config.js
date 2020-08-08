import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import run from '@rollup/plugin-run'
import typescript from '@rollup/plugin-typescript'
import builtins from 'builtin-modules'
import json from '@rollup/plugin-json'
import rimraf from 'rimraf'
import polyfill from 'rollup-plugin-node-polyfills'
const production = !process.env.ROLLUP_WATCH
import fs from 'fs'
import path from 'path'
const pkg = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf-8'))
const external = Object.keys(pkg.dependencies || [])
import consts from 'rollup-plugin-consts'
import { config } from 'dotenv'
config()
rimraf.sync('./dist')
export default {
  input: process.env.ENTRYPOINT,
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  external: [...builtins, ...external],
  plugins: [
    consts({
      database: process.env.DATABASE_URL,
      port: process.env.PORT,
      pat: process.env.PAT,
      shared_api_secret: process.env.SHARED_API_SECRET
    }),
    commonjs(),
    resolve(),
    polyfill(),

    json(),
    typescript({ noEmitOnError: production }),
    // production && terser(),
    !production && run()
  ]
}
