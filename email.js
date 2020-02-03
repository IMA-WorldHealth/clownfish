const axios = require('axios');
const debug = require('debug')('clownfish:email');
const FileType = require('file-type');

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;

const mailgun = require('mailgun-js')({ apiKey, domain });

const { Duplex } = require('stream');

function bufferToStream(buffer) {
  const stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const relay = axios.create({ auth: { username: 'api', password: process.env.MAILGUN_API_KEY } });

async function downloadAttachment(attachment) {
  debug(`Fetching: ${attachment.url}`);

  const res = await relay.get(attachment.url, { responseType: 'arraybuffer' });
  const type = await FileType.fromBuffer(res.data);

  debug(`Detected filetype: ${type.mime}`);

  return {
    data: bufferToStream(res.data),
    filename: attachment.name,
    mimeType: type.mime,
    ext: type.ext,
  };
}


function sendMail(param) {
  debug(`Sending an email to ${param.to} from ${param.from}.`);

  const data = {
    from: param.from,
    to: param.to,
    subject: param.subject || 'Notification',
    text: param.txt || 'Votre message a été archivé avec succès!',
  };

  return mailgun.messages().send(data, (error, body) => {
    debug(`MailGun API returned: ${JSON.stringify(body)}`);
  });
}

exports.downloadAttachment = downloadAttachment;
exports.send = sendMail;
