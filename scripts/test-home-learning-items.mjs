import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { HOME_LEARNING_ITEMS } from '../src/data/homeLearningItems.js'


assert.equal(HOME_LEARNING_ITEMS.length, 5)
assert.deepEqual(HOME_LEARNING_ITEMS.map((item) => item.id), [
  'zhuyin',
  'number',
  'english',
  'shape',
  'logic',
])
assert.deepEqual(
  HOME_LEARNING_ITEMS.filter((item) => item.enabled).map((item) => item.target),
  ['zhuyin', 'number'],
)
assert.ok(HOME_LEARNING_ITEMS.slice(2).every((item) => item.status === '即將開放'))

for (const item of HOME_LEARNING_ITEMS) {
  await access(fileURLToPath(item.assetUrl))
}

const manifest = JSON.parse(
  await readFile(new URL('../public/manifest.webmanifest', import.meta.url)),
)
assert.equal(manifest.name, '彩虹探索樂園')
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.orientation, 'landscape')

console.log('home learning items and manifest are valid')
