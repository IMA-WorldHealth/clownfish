const debug = require('debug')('clownfish:utils');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ncnc = require('./ncnc');

function parseToAddress(address) {
  const re = /<(.*?)>/;
  const result = re.exec(address);
  if (result) {
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

const reply = new RegExp('re:', 'g');
const fwd = new RegExp('fwd:', 'g');
function stripForwardAndReply(subject) {
  return subject.toLowerCase()
    .replace(reply, '')
    .replace(fwd, '')
    .trim();
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

  const [structure, reportName] = parsed.split(separator);

  // normalize reporting structure names
  const normalizedStructure = structure.toLowerCase().trim();
  const normalizedReportName = reportName.toLowerCase().trim();

  return { normalizedStructure, normalizedReportName };
}

/**
 * @function uploadAttachmentsToGoogleDrive
 *
 * @description
 * Takes attachments received as POST requests and uploads them to Google Drive.
 */
async function uploadAttachmentsToGoogleDrive(attachments, normalizedReportName, folder) {
  // eslint-disable-next-line
  for (const attachment of attachments) {
    // eslint-disable-next-line
    const file = fs.createReadStream(attachment.localFileName);
    const extension = path.extname(attachment.localFileName);

    const fname = `${normalizedReportName}${extension}`;
    debug(`Uploading: ${fname}`);

    try {
    // eslint-disable-next-line
    const sfile = await folder.createFile(fname, file);
    } catch (e) {
      debug('error uploading file:', e);
    }

    debug(`Finished uploading ${fname}. Creating shareable link...`);

    // eslint-disable-next-line
    const share = await ncnc.createShare({ fileSystemElement: sfile });

    debug(`You can find ${fname} at ${share.url}`);
  }
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
exports.uploadAttachmentsToGoogleDrive = uploadAttachmentsToGoogleDrive;
