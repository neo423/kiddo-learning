import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)

const viteConfig = await readFile(new URL('vite.config.js', root), 'utf8')

assert.match(
  viteConfig,
  /base:\s*['"]\/kiddo-learning\/['"]/,
  'Vite must build assets under the GitHub Pages repository path',
)

const html = await readFile(new URL('dist/index.html', root), 'utf8')

assert.match(html, /\/kiddo-learning\/assets\//)
assert.match(html, /\/kiddo-learning\/manifest\.webmanifest/)

console.log('GitHub Pages deployment base is correct')
