import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)

const viteConfig = await readFile(new URL('vite.config.js', root), 'utf8')

assert.match(
  viteConfig,
  /base:\s*['"]\/['"]/,
  'Vite must build assets from the Cloudflare Pages root path',
)
assert.doesNotMatch(viteConfig, /\/kiddo-learning\//)

const html = await readFile(new URL('dist/index.html', root), 'utf8')

assert.match(html, /(?:src|href)="\/assets\//)
assert.match(html, /href="\/manifest\.webmanifest"/)
assert.doesNotMatch(html, /\/kiddo-learning\//)

console.log('Cloudflare Pages deployment base is correct')
