/* Family review feeds 1.0.0 — OPTIONAL OWNER SETUP, not a web-app replacement.
 * Add as a separate Apps Script file after owner approval. Run
 * previewFamilyReviewFeeds (read only), then setupFamilyReviewFeeds once.
 * No deployment, secret/property edit, sharing change, or source-backup write.
 * Makes complete, lossless, bounded private copies for the nightly reviewer.
 */
var FRF_CHILDREN_ = [
  {student:'Euna', prefix:'euna-mochi', property:'MIRROR_FOLDER_ID', app:'Mochi learning'},
  {student:'Hana', prefix:'hana-learning', property:'HANA_FOLDER_ID', app:'Hana learning'},
  {student:'Jonah', prefix:'jonah-pokemath', property:'JONAH_FOLDER_ID', app:'PokéMath learning'}
];
var FRF_FOLDER_ = 'Family nightly review feeds (generated)';
var FRF_CHARS_ = 96000;
var FRF_MAX_PARTS_ = 128;

function previewFamilyReviewFeeds() {
  var result = {};
  FRF_CHILDREN_.forEach(function(c) {
    try {
      var s = frf_source_(c), p = frf_split_(s.text);
      result[c.student] = {ok:true, source:s.file.getName(), sourceExportedAt:s.exportedAt,
        characters:s.text.length, parts:p.length, sourceUnchanged:true};
    } catch (e) { result[c.student] = {ok:false, error:String(e.message || e)}; }
  });
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function setupFamilyReviewFeeds() {
  // Never delete or replace any existing trigger, including unrelated jobs.
  var triggers = ScriptApp.getProjectTriggers().filter(function(t) {
    return t.getHandlerFunction() === 'refreshFamilyReviewFeeds';
  });
  if (triggers.length > 1) throw Error('Duplicate review-feed triggers; inspect them before setup.');
  var result = frf_run_(true);
  if (!FRF_CHILDREN_.every(function(c) { return result[c.student] && result[c.student].ok; }))
    throw Error('Not all feeds verified; no trigger added. Inspect the preceding status.');
  if (!triggers.length) ScriptApp.newTrigger('refreshFamilyReviewFeeds').timeBased().everyMinutes(5).create();
  console.log('Review feeds verified. One five-minute trigger is configured; web deployment is unchanged.');
  return result;
}

function refreshFamilyReviewFeeds() { return frf_run_(false); }

function frf_run_(create) {
  // User lock serializes feed runs only. The live relay uses a separate script lock.
  var lock = LockService.getUserLock();
  if (!lock.tryLock(1000)) return {busy:true};
  var result = {};
  try {
    FRF_CHILDREN_.forEach(function(c) {
      try { result[c.student] = frf_refresh_(c, create); }
      catch (e) { result[c.student] = {ok:false, error:String(e.message || e)}; }
    });
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally { lock.releaseLock(); }
}

function frf_private_(item) {
  if (item.isTrashed() || item.getSharingAccess() !== DriveApp.Access.PRIVATE)
    throw Error('Source and generated feeds must have private link access.');
  return item;
}
function frf_unique_(items, required) {
  var item = items.hasNext() ? items.next() : null;
  if (items.hasNext()) throw Error('Duplicate file or folder; nothing will be replaced.');
  if (required && !item) throw Error('Expected mirror or generated folder is missing.');
  return item;
}
function frf_json_(text) {
  try { return JSON.parse(text); } catch (_) { throw Error('Invalid JSON; existing source and published index retained.'); }
}
function frf_hash_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
function frf_source_(c) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(c.property) || props.getProperty('MIRROR_FOLDER_ID');
  if (!id) throw Error('Existing mirror folder is not configured.');
  var folder = frf_private_(DriveApp.getFolderById(id));
  var file = frf_private_(frf_unique_(folder.getFilesByName(c.prefix + '-latest.json'), true));
  if ([MimeType.PLAIN_TEXT, 'application/json'].indexOf(file.getMimeType()) < 0) throw Error('Unexpected mirror file type.');
  var modifiedAt = file.getLastUpdated().toISOString();
  var raw = file.getBlob().getDataAsString('UTF-8');
  if (!raw || raw.length > 12000000) throw Error('Source size is outside the existing relay limit.');
  var b = frf_json_(raw);
  if (!b || b.app !== c.app || (c.student === 'Hana' ? b.schemaVersion !== 1 : b.version !== 1))
    throw Error('Wrong child or source schema; nothing will be replaced.');
  if (c.student === 'Jonah' && (b.child !== 'Jonah' || !b.sessions || Array.isArray(b.sessions)))
    throw Error('Invalid Jonah mirror.');
  var exportedAt = c.student === 'Hana' ? b.exportedAt : c.student === 'Euna' ? b.exported : b.exportedAt;
  var at = typeof exportedAt === 'number' ? exportedAt : Date.parse(exportedAt);
  if (!Number.isFinite(at) || at < 0 || at > Date.now() + 300000) throw Error('Invalid source export time.');
  if (file.getLastUpdated().toISOString() !== modifiedAt) throw Error('Mirror changed during read; retry on the next run.');
  return {folder:folder, file:file, text:JSON.stringify(b), rawSha256:frf_hash_(raw),
    exportedAt:new Date(at).toISOString(), modifiedAt:modifiedAt};
}
function frf_split_(text) {
  var parts = [];
  for (var at = 0; at < text.length;) {
    var end = Math.min(at + FRF_CHARS_, text.length);
    // Never split a surrogate pair, so every part survives UTF-8 conversion.
    var code = text.charCodeAt(end - 1);
    if (end < text.length && code >= 0xD800 && code <= 0xDBFF) end--;
    parts.push(text.slice(at, end)); at = end;
  }
  if (!parts.length || parts.length > FRF_MAX_PARTS_) throw Error('Feed exceeds the bounded part limit.');
  return parts;
}
function frf_textFile_(folder, name) {
  var file = frf_unique_(folder.getFilesByName(name), false);
  if (file) {
    frf_private_(file);
    if (file.getMimeType() !== MimeType.PLAIN_TEXT) throw Error('Unexpected generated file type.');
  }
  return file;
}
function frf_refresh_(c, create) {
  var source = frf_source_(c);
  var folder = frf_unique_(source.folder.getFoldersByName(FRF_FOLDER_), false);
  if (!folder && !create) throw Error('Owner setup is required for review feeds.');
  if (!folder) folder = source.folder.createFolder(FRF_FOLDER_);
  frf_private_(folder);
  var indexName = c.prefix + '-review-index.json';
  var indexFile = frf_textFile_(folder, indexName);
  var old = indexFile ? frf_json_(indexFile.getBlob().getDataAsString('UTF-8')) : null;
  if (old && (old.schema !== 1 || old.service !== 'family-review-feed' || old.student !== c.student ||
      old.sourceFileId !== source.file.getId() || old.feedFolderId !== folder.getId() ||
      ['A','B'].indexOf(old.slot) < 0)) throw Error('Unexpected existing index; owner inspection required.');
  if (old && old.sourceModifiedAt === source.modifiedAt && old.sourceRawSha256 === source.rawSha256)
    return {ok:true, state:'unchanged', indexFileId:indexFile.getId(), sourceExportedAt:old.sourceExportedAt};
  var generation = frf_hash_(source.text), slot = old && old.slot === 'A' ? 'B' : 'A';
  var chunks = frf_split_(source.text), parts = [];
  // Only the inactive slot is written. Readers reject mixed/stale parts by hash.
  chunks.forEach(function(text, i) {
    var name = c.prefix + '-review-' + slot + '-' + String(i + 1).padStart(3,'0') + '.json';
    var file = frf_textFile_(folder, name);
    if (file) {
      var prev = frf_json_(file.getBlob().getDataAsString('UTF-8'));
      if (!prev || prev.service !== 'family-review-feed-part' || prev.schema !== 1 || prev.student !== c.student || prev.index !== i)
        throw Error('Unexpected existing part; nothing will be replaced.');
    }
    var body = JSON.stringify({schema:1, service:'family-review-feed-part', student:c.student,
      generation:generation, index:i, text:text});
    if (file) file.setContent(body); else file = folder.createFile(name, body, MimeType.PLAIN_TEXT);
    frf_private_(file);
    if (file.getBlob().getDataAsString('UTF-8') !== body) throw Error('Part verification failed; published index retained.');
    parts.push({index:i, fileId:file.getId(), name:name, characters:text.length, sha256:frf_hash_(text)});
  });
  if (source.file.getLastUpdated().toISOString() !== source.modifiedAt)
    throw Error('Mirror changed while building feed; published index retained until the next run.');
  var index = {schema:1, service:'family-review-feed', student:c.student, format:'json-text-chunks-v1',
    sourceFileId:source.file.getId(), sourceName:source.file.getName(), sourceModifiedAt:source.modifiedAt,
    sourceExportedAt:source.exportedAt, sourceRawSha256:source.rawSha256,
    generatedAt:new Date().toISOString(), feedFolderId:folder.getId(), generation:generation,
    slot:slot, characters:source.text.length, partCount:parts.length, parts:parts};
  var output = JSON.stringify(index);
  if (indexFile) indexFile.setContent(output); else indexFile = folder.createFile(indexName, output, MimeType.PLAIN_TEXT);
  frf_private_(indexFile);
  if (indexFile.getBlob().getDataAsString('UTF-8') !== output) throw Error('Index readback failed; inspect generated files.');
  return {ok:true, state:'published', indexFileId:indexFile.getId(), parts:parts.length,
    sourceExportedAt:source.exportedAt, sourceUnchanged:true};
}
