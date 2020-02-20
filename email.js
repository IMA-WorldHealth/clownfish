const debug = require('debug')('clownfish:email');

const mailer = require('@sendgrid/mail');

mailer.setApiKey(process.env.SENDGRID_API_KEY);

const body = `
Bonjour,

Merci d'utiliser clownfish. Votre message intitulé "%TITLE%" a été archivé avec succès.

Merci,
L'équipe IMA World Health
`.trim();

async function sendMail(params) {
  debug(`Sending an email to ${params.to} from ${params.from}.`);

  debug(`SendGrid: ${process.env.SENDGRID_API_KEY}`);

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

exports.send = sendMail;
