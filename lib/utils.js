/* eslint-disable no-await-in-loop */
const debug = require('debug')('clownfish:utils');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ru = require('remove-unprintable');
const ra = require('remove-accents');
const ncnc = require('./ncnc');

function parseToAddress(address) {
  const re = /<(.*?)>/;
  const result = re.exec(address);
  if (result) {
    // eslint-disable-next-line
    const [_, parsed] = result;
    return parsed;
  }

  return address;
}

function detectSeparator(subject) {
  if (subject.includes('--')) {
    return '--';
  }

  if (subject.includes('-')) {
    return '-';
  }

  if (subject.includes('–')) {
    return '–';
  }

  return '';
}

const reply = new RegExp('re:', 'gi');
const fwd = new RegExp('fwd:', 'gi');
function stripForwardAndReply(subject) {
  return ru(
    ra(subject.normalize('NFC'))
      .toLowerCase()
      .replace(reply, '')
      .replace(fwd, '')
      .trim(),
  );
}

/**
 * @function parseSubjectLine
 *
 * @description
 * Parses the subject line of the email to bring out the
 */
function parseSubjectLine(subject) {
  // support multiple kinds of separators.
  const separator = detectSeparator(subject);
  const parsed = stripForwardAndReply(subject);

  let structure;
  let reportName;
  if (separator !== '') {
    [structure, reportName] = parsed.split(separator);
  } else {
    [structure, reportName] = ['UNKNOWN', parsed];
  }

  debug(`Subject: ${subject}`);

  // normalize reporting structure names
  const normalizedStructure = structure.toLowerCase().trim();
  const normalizedReportName = reportName.toLowerCase().trim();

  debug(`normalizedStructure: ${normalizedStructure}`);
  debug(`normalizedReportName: ${normalizedReportName}`);

  return { normalizedStructure, normalizedReportName };
}
/**
 * @function uploadAttachmentsToNextCloud
 *
 * @description
 * Takes attachments received as POST requests and uploads them to Google Drive.
 */
async function uploadAttachmentsToNextCloud(folder, attachments) {
  debug(`uploading ${attachments.length} to ${folder.name}.`);

  // eslint-disable-next-line
  for (const attachment of attachments) {
    const fname = attachment.parameters.name;

    // check to see if file exists on NextCloud.
    const hasFile = await folder.containsFile(fname);

    // if the file doesn't already exist on NextCloud, upload it.
    if (!hasFile) {
      debug(`Uploading: ${fname} from ${attachment.localFileName}.`);

      const file = await fs.promises.readFile(attachment.localFileName);

      try {
        await folder.createFile(fname, file);

        debug(`Finished uploading ${fname}.`);
      } catch (e) {
        debug('error uploading file:', e);
      }
    }
  }
}

/**
 * @function ensureFolder
 *
 * @description
 * Ensures that a folder exists by either creating or using the existing
 * one.
 */
async function ensureFolder(...fnames) {
  debug(`looking up folder for ${fnames.join(',')}.`);

  const folderPath = path.join(`${process.env.NEXTCLOUD_BASE_FOLDER}`, ...fnames);

  debug(`resolved full folder path to ${folderPath}.`);

  let folder = await ncnc.getFolder(folderPath);

  if (!folder) {
    debug('Could not find folder, creating %s', folderPath);
    folder = await ncnc.createFolder(folderPath);
    debug('Created folder %s', folderPath);
  }

  // get the UI url to print to console.
  const furl = await folder.getUIUrl();

  debug(`using folder "${furl}" (last modified: ${folder.lastmod}`);

  return folder;
}

function getTempFileName(fname) {
  return path.join(os.tmpdir(), `${Date.now()}-${fname}`);
}

// save an attachment to a temporary file
async function saveAttachmentToTempFile({ meta, content }) {
  debug('Computing filename:', meta.filename);

  const fname = getTempFileName(meta.filename);
  const out = fs.createWriteStream(fname);

  await new Promise((resolve, reject) => {
    content.pipe(out);
    out.once('finish', resolve);
    out.once('error', reject);
  });

  debug(`saved file to ${fname}`);

  return fname;
}

exports.saveAttachmentToTempFile = saveAttachmentToTempFile;
exports.parseToAddress = parseToAddress;
exports.parseSubjectLine = parseSubjectLine;
exports.ensureFolder = ensureFolder;
exports.uploadAttachmentsToNextCloud = uploadAttachmentsToNextCloud;
