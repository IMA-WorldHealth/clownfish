const axios = require('axios');
const debug = require('debug')('clownfish:email');
const mailgun = require('mailgun-js');
const fileType = require('file-type');

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
  const type = fileType(res.data);

  debug(`Detected filetype: ${type.mime}`);

  return {
    data: bufferToStream(res.data),
    filename: attachment.name,
    mimeType: type.mime,
    ext: type.ext,
  };
}


async function sendMail(param) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const mailgunInit = mailgun({ apiKey, domain });

  const data = {
    from: `No_reply <${param.from}>`,
    to: param.to,
    subject: param.subject || 'Notification',
    text: param.txt || 'Votre message a été archivé avec succès!',
  };

  return mailgunInit.messages().send(data, (error, body) => {
    debug(`Email notification : ${body}`);
  });
}

exports.downloadAttachment = downloadAttachment;
exports.send = sendMail;
