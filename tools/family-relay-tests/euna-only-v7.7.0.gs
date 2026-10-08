/* Mochi <-> private Google Drive relay (Google Apps Script)
 *
 * Script Properties required:
 *   MIRROR_SECRET    = a long random secret copied from Mochi Grown-ups settings
 *   MIRROR_FOLDER_ID = the Drive folder id for "Mochi Euna Learning Mirror"
 *
 * Deploy as a Web app:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Optional setupNightlyPlan() adds a fixed private plan reader; progress writes stay unchanged.
 * Security model: private data requires POST requests carrying MIRROR_SECRET in
 * the JSON body. The secret is never stored in the public Mochi GitHub repo.
 */

const LATEST_NAME = 'euna-mochi-latest.json';

function doGet() {
  return json_({ok:true, service:'mochi-drive-mirror', planApi:1});
}

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const expected = String(props.getProperty('MIRROR_SECRET') || '');
    const folderId = String(props.getProperty('MIRROR_FOLDER_ID') || '');
    if (!expected || !folderId) throw new Error('Relay is not configured.');

    const raw = e && e.postData ? String(e.postData.contents || '') : '';
    if (!raw || raw.length > 8000000) throw new Error('Invalid or oversized payload.');
    const body = JSON.parse(raw);
    if (String(body.secret || '') !== expected) throw new Error('Unauthorized.');
    if (body.action === 'readNextSession') return readNextSession_(props);
    if (body.action) throw new Error('Unknown relay action.');
    if (!body.backup || body.backup.app !== 'Mochi learning' || body.backup.version !== 1) {
      throw new Error('Invalid Mochi backup.');
    }

    const folder = DriveApp.getFolderById(folderId);
    const text = JSON.stringify(body.backup, null, 2);
    upsert_(folder, LATEST_NAME, text);

    const d = new Date();
    const weekName = weeklyName_(d);
    const weekly = folder.getFilesByName(weekName);
    if (weekly.hasNext()) {
      weekly.next().setContent(text);
    } else {
      folder.createFile(weekName, text, MimeType.PLAIN_TEXT);
    }

    return json_({ok:true, latest:LATEST_NAME, weekly:weekName, bytes:text.length});
  } catch (err) {
    return json_({ok:false, error:String(err && err.message || err)});
  }
}

function upsert_(folder, name, text) {
  const files = folder.getFilesByName(name);
  if (files.hasNext()) {
    const f = files.next();
    f.setContent(text);
    while (files.hasNext()) files.next().setTrashed(true);
    return f;
  }
  return folder.createFile(name, text, MimeType.PLAIN_TEXT);
}

function weeklyName_(d) {
  const iso = isoWeek_(d);
  return `euna-mochi-${iso.year}-W${String(iso.week).padStart(2,'0')}.json`;
}

function isoWeek_(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return {year:d.getUTCFullYear(), week};
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/* Run ONCE in the Apps Script editor before deploying the new version. No new secret.
   Finds exactly one owner-controlled document; it never changes sharing permissions.
   No web route invokes this setup helper. */
function setupNightlyPlan() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MIRROR_SECRET') || !props.getProperty('MIRROR_FOLDER_ID')) throw Error('Keep the existing mirror properties first.');
  const files = DriveApp.searchFiles("title = 'Euna — App next-session plan (JSON)' and 'me' in owners and trashed = false");
  const matches = [];
  while (files.hasNext()) { const file = files.next(); if (file.getMimeType() === MimeType.GOOGLE_DOCS) matches.push(file); }
  if (matches.length !== 1) throw Error('Expected exactly one private App next-session plan (JSON) document owned by you.');
  if (matches[0].getSharingAccess() !== DriveApp.Access.PRIVATE) throw Error('The plan document must not have public or domain link access.');
  // Opening the document requests the new Docs permission during the one-time editor run.
  DocumentApp.openById(matches[0].getId()).getBody().getText();
  props.setProperty('NIGHTLY_PLAN_DOC_ID', matches[0].getId());
  console.log('Private plan reader configured. Update the EXISTING deployment to a new version; keep its URL.');
}
function readNextSession_(props) {
  const envelope = {service:'mochi-drive-mirror', planApi:1};
  try {
    const id = String(props.getProperty('NIGHTLY_PLAN_DOC_ID') || '');
    if (!id) return json_(Object.assign(envelope, {ok:false,error:'Plan reader is not configured.'}));
    const file = DriveApp.getFileById(id);
    if (file.isTrashed() || file.getMimeType() !== MimeType.GOOGLE_DOCS || file.getSharingAccess() !== DriveApp.Access.PRIVATE) throw Error('Unavailable');
    const text = DocumentApp.openById(id).getBody().getText().trim();
    if (!text) return json_(Object.assign(envelope, {ok:true,plan:null}));
    if (text.length > 20000) throw Error('Oversized');
    const plan = JSON.parse(text);
    const allowed = ['schema','id','revision','student','timeZone','reviewedDate','sessionDate','generatedAt','sourceExportedAt','subjects'];
    if (!plan || plan.schema !== 1 || plan.student !== 'Euna' || !plan.subjects || Object.keys(plan).some(k => allowed.indexOf(k) < 0)) throw Error('Invalid');
    // This action returns only the configured plan, never mirror history or arbitrary files.
    return json_(Object.assign(envelope, {ok:true,plan:plan}));
  } catch (_) {
    return json_(Object.assign(envelope, {ok:false,error:'Private plan is unavailable or invalid.'}));
  }
}
