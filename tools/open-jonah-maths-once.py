from pathlib import Path
import json

adventure_path = Path("adventure.js")
adventure = adventure_path.read_text(encoding="utf-8")
old = """  const extras=document.createElement('details');extras.className='parent-practice-tools';
  extras.innerHTML='<summary>Grown-up choice: maths games</summary><p>These activities are outside the daily reading routine.</p><div id=\"parentPracticeTools\"></div>';
  dashboard.after(extras);
  $('parentPracticeTools').append($('gamesBtn'));
  extras.addEventListener('click',e=>{if(e.target.closest('button'))$('ppClose').click();},true);
"""
new = "  // Maths stays in Jonah's existing home choices. It is optional and outside the daily reading path.\n"
if adventure.count(old) != 1:
    raise SystemExit(f"Expected one maths-gating block, found {adventure.count(old)}")
adventure_path.write_text(adventure.replace(old, new, 1), encoding="utf-8")

index_path = Path("index.html")
index = index_path.read_text(encoding="utf-8")
old_label = '<span class="build-label">v97.3</span>'
if index.count(old_label) != 1:
    raise SystemExit(f"Expected one v97.3 build label, found {index.count(old_label)}")
old_adventure_url = "adventure.js?v=97"
if index.count(old_adventure_url) != 1:
    raise SystemExit(f"Expected one v97 adventure script URL, found {index.count(old_adventure_url)}")
index = index.replace(old_label, '<span class="build-label">v97.4</span>', 1)
index = index.replace(old_adventure_url, "adventure.js?v=97.4", 1)
index_path.write_text(index, encoding="utf-8")

sw_path = Path("sw.js")
sw = sw_path.read_text(encoding="utf-8")
if "// PokéMath v97.3:" not in sw:
    raise SystemExit("Expected v97.3 service-worker comment")
old_cached_adventure = "./adventure.js?v=97"
if sw.count(old_cached_adventure) != 1:
    raise SystemExit(f"Expected one cached v97 adventure URL, found {sw.count(old_cached_adventure)}")
if "const CACHE = 'pokemath-v97';" not in sw:
    raise SystemExit("Expected the reusable pokemath-v97 cache")
sw = sw.replace("// PokéMath v97.3:", "// PokéMath v97.4:", 1)
sw = sw.replace(old_cached_adventure, "./adventure.js?v=97.4", 1)
sw_path.write_text(sw, encoding="utf-8")

package_path = Path("package.json")
package = json.loads(package_path.read_text(encoding="utf-8"))
package["version"] = "97.4.0"
package_path.write_text(json.dumps(package, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

lock_path = Path("package-lock.json")
if lock_path.exists():
    lock = json.loads(lock_path.read_text(encoding="utf-8"))
    lock["version"] = "97.4.0"
    if isinstance(lock.get("packages"), dict) and isinstance(lock["packages"].get(""), dict):
        lock["packages"][""]["version"] = "97.4.0"
    lock_path.write_text(json.dumps(lock, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

readme_path = Path("README.md")
readme = readme_path.read_text(encoding="utf-8")
note = """## v97.4 · Maths open on Jonah’s home screen

The original **Games** button is again available directly on Jonah’s home screen, beside **My Pokémon** and **My fox**. Maths remains optional and does not replace or alter the daily reading path. Existing progress, earned Pokémon, Buddy selection and learning records are unchanged. Installed copies refresh the changed app code while reusing their saved sound and picture downloads.

"""
if not readme.startswith("## v97.4 ·"):
    readme_path.write_text(note + readme, encoding="utf-8")

test_path = Path("tests/math-home-open.test.cjs")
test_path.write_text(
    """const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('Jonah can open maths directly from the home screen', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const adventure = fs.readFileSync(path.join(root, 'adventure.js'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const homeChoices = html.match(/<div class=\"home-choices\">([\\s\\S]*?)<\\/div>/);

  assert.ok(homeChoices, 'home choices container should exist');
  assert.match(homeChoices[1], /id=\"gamesBtn\"/, 'Games should remain in the home choices');
  assert.doesNotMatch(adventure, /append\\(\\$\\('gamesBtn'\\)\\)/, 'Games must not be moved into the Grown-ups panel');
  assert.doesNotMatch(adventure, /Grown-up choice: maths games/, 'The obsolete gated maths panel should be absent');
  assert.match(html, /adventure\\.js\\?v=97\\.4/, 'the page should request the restored home code');
  assert.match(worker, /\\.\/adventure\\.js\\?v=97\\.4/, 'the offline cache should save the restored home code');
  assert.match(worker, /const CACHE = 'pokemath-v97'/, 'existing sound and picture downloads should be reused');
});
""",
    encoding="utf-8",
)

for temporary in (
    Path(".github/workflows/open-jonah-maths.yml"),
    Path("tools/open-jonah-maths-once.py"),
):
    if temporary.exists():
        temporary.unlink()
