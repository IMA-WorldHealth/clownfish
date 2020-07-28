const debug = require('debug')('clownfish:mail');
const nodemailer = require('nodemailer');

function setupSMTPTransport(host, user, pass) {
  debug(`Using ${host} for email transport.`);
  debug(`Logging in with user ${user}`);
  const transport = nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  // check SMTP credentials
  transport.verify((err) => {
    if (err) {
      debug(`Error connecting to ${host}.`);
      debug(`Error: ${JSON.stringify(err)}`);
    } else {
      debug(`${host} is ready to accept connections.`);
    }
  });

  return transport;
}

exports.setupSMTPTransport = setupSMTPTransport;
