const { Duplex } = require('stream');
const debug = require('debug')('clownfish');
const path = require('path');
const drive = require('./drive');

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

// converts between buffers and streams
function bufferToStream(buffer) {
  const stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * @function uploadAttachmentsToGoogleDrive
 *
 * @description
 * Takes attachments received as POST requests and uploads them to Google Drive.
 */
async function uploadAttachmentsToGoogleDrive(attachments, normalizedReportName, parentFolderId) {
  // eslint-disable-next-line
  for (const attachment of attachments) {
    // eslint-disable-next-line
    const stream = bufferToStream(attachment.buffer);
    const extension = path.extname(attachment.originalname);

    const fname = `${normalizedReportName}.${extension}`;
    debug(`Uploading: ${fname}`);

    // eslint-disable-next-line
    await drive.files.create({
      resource: { name: fname, parents: [parentFolderId] },
      media: { mimeType: attachment.mimetype, body: stream },
      fields: 'id',
    });
  }
}

exports.parseSubjectLine = parseSubjectLine;
exports.uploadAttachmentsToGoogleDrive = uploadAttachmentsToGoogleDrive;
