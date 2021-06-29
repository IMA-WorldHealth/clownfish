require('dotenv').config();
const { ImapFlow } = require('imapflow');
const debug = require('debug')('clownfish:imap');
const cron = require('@ima-worldhealth/cron-scheduler');
const pino = require('pino')(); // eslint-disable-line
const path = require('path');
const utils = require('./utils');
const { setupSMTPTransport } = require('./mail');
const ncnc = require('./ncnc');

// make the imapflow logger silent
pino.level = 'silent';

cron.debug(require('debug')('cron'));

const db = require('./db');

const text = `
Bonjour,

Merci d'utiliser clownfish. Votre message a été archivé avec succès.

Merci,
L'équipe IMA World Health
`.trim();

async function processQueueOfMessages(server, queue) {
  const stmt = db.prepare(`
    INSERT INTO inbox (smtp_id, seq, message_id, from_address, subject, attachments, date, gdrive_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `);

  const mailer = setupSMTPTransport(server.host, server.user, server.pass);

  const promises = queue
    .map(async ({ message, attachments }) => {
      const {
        normalizedStructure, normalizedReportName,
      } = utils.parseSubjectLine(message.envelope.subject);

      debug('normalized structure : %s', normalizedStructure);

      const folderPath = path.join(`${process.env.NEXTCLOUD_BASE_FOLDER}`, normalizedStructure);

      debug('Looking up folder: %s', folderPath);

      let folder = await ncnc.getFolder(folderPath);

      if (!folder && folderPath !== './') {
        debug('Could not find folder, creating %s', folderPath);
        folder = await ncnc.createFolder(folderPath);
      }

      debug(`Located folder for ${normalizedStructure}.  Uploading attachments...`);

      await utils.uploadAttachmentsToGoogleDrive(attachments, normalizedReportName, folder);

      debug('Attachment uploaded.  Reponding to user.');

      const sender = message.envelope.from.pop();
      const receiver = message.envelope.to.pop();

      /*
      // send an email response
      await mailer.sendMail({
        from: receiver.address,
        to: sender.address,
        subject: message.envelope.subject,
        text,
      });
      */

      debug('Email sent.  Recording log in database.');

      const fnames = attachments.map((attach) => attach.description).join(' , ');

      const { date } = message.envelope;

      const params = [
        server.id, message.seq, message.id, sender.address,
        message.envelope.subject, fnames, Number(date),
      ];

      // insert into database the record
      stmt.run(params);

      debug('params: ', params);

      debug('Logs recorded.');
    });

  await Promise.all(promises);
}

async function pull(id, host, user, pass, folder) {
  const client = new ImapFlow({
    host,
    logger: pino,
    port: 993,
    secure: true,
    auth: { user, pass },
  });

  const server = {
    id, host, user, pass, folder,
  };

  const log = (...args) => debug(`[${user}] `, ...args);

  log(`Connecting to ${host}.`);

  // grab the latest records from the online server.
  await client.connect();

  log(`Connected to ${host}.  Getting inbox lock.`);

  const lock = await client.getMailboxLock('INBOX');

  log('Mailbox locked.');

  try {
    log('Fetching messages...');

    // look up last message
    const { msgid } = db.prepare('SELECT IFNULL(MAX(seq), 0) + 1 AS msgid  FROM inbox WHERE smtp_id = ?;').get(id);
    log(`last message id: ${JSON.stringify(msgid)}`);

    // queue of emails
    const queue = [];

    // eslint-disable-next-line
    for await (const message of client.fetch(`${msgid}:*`, { envelope:true, bodyStructure: true })) {
      debug('downloaded uid:', message.uid);

      const attachments = (message.bodyStructure.childNodes || [])
        .filter((child) => child.disposition === 'attachment');

      queue.push({ message, attachments });
    }

    // eslint-disable-next-line
    for (const item of queue) {
      const { message, attachments } = item;
      // eslint-disable-next-line
      for (const attached of attachments) {
        log(`Fetching attachment: ${attached.description} (${attached.type}, ${attached.size} bytes)`);

        if (attachments.length === 0) {
          log(`Message ${message.uid} has no attachments! Skipping...`);
          continue; // eslint-disable-line
        }

        // eslint-disable-next-line  no-await-in-loop
        const attachment = await client.download(message.uid, attached.part, { uid: true });

        log('Attachment downloaded.');

        attached.contentType = attachment.meta.contentType;

        // return the local file name of the attachment.
        // eslint-disable-next-line  no-await-in-loop
        attached.localFileName = await utils.saveAttachmentToTempFile(attachment);
        log(`Attachment saved to ${attached.localFileName}.`);
      }
    }

    // this is asynchronous
    processQueueOfMessages(server, queue);

    log('done...');
  } catch (e) {
    log('An error occurred.');
    log('err: %o', e);
  } finally {
    log('releasing lock');
    lock.release();
  }

  log('logging out.');

  await client.logout();

  log('logged out.');
}

async function main() {
  const servers = db.prepare('SELECT * FROM smtp WHERE paused = FALSE;').all();

  // run through each server, downloading messages
  await Promise.all(servers.map(
    (s) => pull(s.id, s.host, s.username, s.password, s.gdrive_folder_id),
  ));
}

// runs every minute
cron({ on: '* * * * *' }, async () => {
  debug('Starting up cron task.');
  try {
    await main();
  } catch (err) {
    debug('An error in main() occurred.');
    debug(err);
  }
});
