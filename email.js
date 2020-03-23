const debug = require('debug')('clownfish:email');

const mailer = require('@sendgrid/mail');
const utils = require('./utils');

mailer.setApiKey(process.env.SENDGRID_API_KEY);

const body = `
Bonjour,

Merci d'utiliser clownfish. Votre message intitulé "%TITLE%" a été archivé avec succès.

Merci,
L'équipe IMA World Health
`.trim();

async function sendMail(params) {
  debug(`Sending an email to ${params.to} from ${params.from}.`);

  try {
    const data = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: body.replace('%TITLE%', params.subject),
    };

    await mailer.send(data);
    debug(`Email successfully sent to ${data.to} with SendGrid`);
  } catch (e) {
    debug('An error occurred:', e.toString());
  }
}

const domainMap = {
  'support@ima-assp.org': 'support@imaassp.freshdesk.com',
  'support@snisrdc.com': 'support@snisrdc.freshdesk.com',
};

async function support(params) {
  debug('Passed message to support handler');

  const to = utils.parseToAddress(params.to);

  if (domainMap[to]) {
    params.to = domainMap[to]; // eslint-disable-line
  } else {
    debug(`To address ${to} did not match a known support email. Skipping.`);
    return;
  }

  try {
    delete params.attachments; // eslint-disable-line
    delete params.headers; // eslint-disable-line
    await mailer.send(params);
    debug(`Email successfully sent to ${params.to} with SendGrid`);
  } catch (e) {
    debug('An error occurred:', e.toString());
  }
}

exports.send = sendMail;
exports.support = support;
