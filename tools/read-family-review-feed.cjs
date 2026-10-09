'use strict';
// Verify complete downloaded private parts. No network, credentials, or writes.
const crypto = require('node:crypto');
const APPS = {Euna:'Mochi learning', Hana:'Hana learning', Jonah:'PokéMath learning'};
const PREFIX = {Euna:'euna-mochi', Hana:'hana-learning', Jonah:'jonah-pokemath'};
const hash = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
function assemble(index, partsById, expected) {
  const fail = reason => { throw Error('Review feed rejected: ' + reason); };
  if (!expected?.student || !expected.sourceFileId || !expected.sourceModifiedAt) fail('expected source identity and current modified time required');
  if (index?.schema !== 1 || index.service !== 'family-review-feed' || index.format !== 'json-text-chunks-v1' ||
      !APPS[index.student] || index.student !== expected.student || index.sourceFileId !== expected.sourceFileId ||
      index.sourceName !== PREFIX[index.student]+'-latest.json' || index.sourceModifiedAt !== expected.sourceModifiedAt ||
      !/^[a-f0-9]{64}$/.test(index.generation) || !/^[a-f0-9]{64}$/.test(index.sourceRawSha256) ||
      !['A','B'].includes(index.slot) || !Array.isArray(index.parts) || index.partCount !== index.parts.length ||
      index.partCount < 1 || index.partCount > 128 || !Number.isInteger(index.characters) || index.characters < 1 || index.characters > 12000000) fail('index identity, size or freshness');
  const seen = new Set();
  const text = index.parts.map((ref, i) => {
    const entry = partsById[ref.fileId], p = entry?.content;
    if (ref.index !== i || seen.has(ref.fileId) || ref.name !== PREFIX[index.student]+'-review-'+index.slot+'-'+String(i+1).padStart(3,'0')+'.json' ||
        !entry || entry.fileId !== ref.fileId || entry.parentId !== index.feedFolderId || entry.name !== ref.name ||
        p?.schema !== 1 || p.service !== 'family-review-feed-part' || p.student !== index.student ||
        p.generation !== index.generation || p.index !== i || typeof p.text !== 'string' ||
        p.text.length !== ref.characters || p.text.length > 96000 || hash(p.text) !== ref.sha256) fail('missing, crossed or changed part');
    seen.add(ref.fileId); return p.text;
  }).join('');
  if (text.length !== index.characters || hash(text) !== index.generation) fail('whole-file hash');
  const b = JSON.parse(text);
  if (b.app !== APPS[index.student] || (index.student === 'Hana' ? b.schemaVersion !== 1 : b.version !== 1) ||
      (index.student === 'Jonah' && b.child !== 'Jonah')) fail('backup identity');
  const stamp = index.student === 'Hana' ? b.exportedAt : index.student === 'Euna' ? b.exported : b.exportedAt;
  const ms = typeof stamp === 'number' ? stamp : Date.parse(stamp);
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== index.sourceExportedAt) fail('source export time');
  return b;
}
module.exports = {assemble};
if (require.main === module) {
  const fs = require('node:fs');
  const [indexPath, partsPath, expectedPath] = process.argv.slice(2);
  if (!indexPath || !partsPath || !expectedPath) throw Error('Usage: node read-family-review-feed.cjs index.json downloaded-parts.json expected-source.json');
  const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
  // Caller redirects stdout into a private scratch file; never a public repo.
  process.stdout.write(JSON.stringify(assemble(read(indexPath), read(partsPath), read(expectedPath))));
}
