const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('Jonah can open maths directly from the home screen', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const adventure = fs.readFileSync(path.join(root, 'adventure.js'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const homeChoices = html.match(/<div class="home-choices">([\s\S]*?)<\/div>/);

  assert.ok(homeChoices, 'home choices container should exist');
  assert.match(homeChoices[1], /id="gamesBtn"/, 'Games should remain in the home choices');
  assert.doesNotMatch(adventure, /append\(\$\('gamesBtn'\)\)/, 'Games must not be moved into the Grown-ups panel');
  assert.doesNotMatch(adventure, /Grown-up choice: maths games/, 'The obsolete gated maths panel should be absent');
  assert.match(html, /adventure\.js\?v=97\.4/, 'the page should request the restored home code');
  assert.match(worker, /\.\/adventure\.js\?v=97\.4/, 'the offline cache should save the restored home code');
  assert.match(worker, /const CACHE = 'pokemath-v97'/, 'existing sound and picture downloads should be reused');
});
