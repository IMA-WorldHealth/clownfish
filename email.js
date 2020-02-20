const debug = require('debug')('clownfish:email');

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;

const mailgun = require('mailgun-js')({ apiKey, domain });

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

exports.send = sendMail;
