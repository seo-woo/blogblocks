/** TS 스크립트를 esbuild로 묶어서 실행 — 콜론(:)이 든 경로에서도 안전 */
import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const entry = process.argv[2]
if (!entry) {
  console.error('사용법: node scripts/run.mjs <스크립트.ts>')
  process.exit(1)
}

mkdirSync('node_modules/.cache', { recursive: true })
const outfile = 'node_modules/.cache/script-run.mjs'
await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile,
  logLevel: 'error',
})
await import(pathToFileURL(outfile).href)
