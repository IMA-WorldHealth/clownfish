require('dotenv').config();

const {
  PORT,
} = process.env;

const debug = require('debug')('clownfish');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const template = require('lodash.template');
const email = require('./email');
const db = require('./lib/db');

const api = require('./api');
const utils = require('./utils');
const sysinfo = require('./sysinfo');
const logger = require('./logger')('clownfish.db');

const render = template(fs.readFileSync('./views/index.html'));

const upload = multer();

const app = express();
app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ extended: true }));

app.get('/', (req, res, next) => {
  try {
    const info = sysinfo();
    const rendered = render({
      title: 'Clownfish',
      subtitle: 'by IMA World Health',
      log: logger.read(10),
      info,
    });

    res.status(200).send(rendered);
  } catch (e) {
    debug('An error occurred: %o', e);
    next(e);
  }
});


/**
 * @function receive
 *
 * @description
 * Receives post requests from mailgun and processes them to store them on Google Drive.  In order
 * to route multiple Google Drive accounts, we embed the Google Drive folder ID into the URL.
 */
app.post('/receive', upload.any(), async (req, res, next) => {
  try {
    const start = new Date();
    const mail = req.body;

    debug('received a message!');

    const toAddress = utils.parseToAddress(mail.to);

    const row = db
      .prepare('SELECT gdrive_folder_id FROM router WHERE email_address = ?;')
      .get(toAddress);

    // attempt to route to support
    if (toAddress.includes('support')) {
      await email.support(mail);
    }

    if (!row) {
      debug(`Could not find a matching record for address: ${toAddress}`);
      res.sendStatus(200);
      next();
      return;
    }

    const googleDriveParentFolderId = row.gdrive_folder_id;

    debug(`Matched ${googleDriveParentFolderId} to address ${toAddress}.`);

    const { normalizedStructure, normalizedReportName } = utils.parseSubjectLine(mail.subject);

    debug(`structure: ${normalizedStructure}`);
    debug(`report name: ${normalizedReportName}`);

    // ensures that this folder exists and returns its ID.
    const folderId = await api.ensureFolder(normalizedStructure, googleDriveParentFolderId);

    debug(`Located folder for ${normalizedStructure} with id: ${folderId}`);

    // grab attachments if they exist.
    const attachments = req.files;

    if (attachments) {
      debug(`Located ${attachments.length} attachments.`);
      await utils.uploadAttachmentsToGoogleDrive(attachments, normalizedReportName, folderId);
      debug(`Finished processing ${attachments.length} attachments`);
    }

    const sender = mail.from;

    // write to log
    logger.write({
      googleDriveParentFolderId,
      normalizedStructure,
      normalizedReportName,
      attachments,
      start,
      sender,
      end: new Date(),
    });

    email.send({ from: mail.to, to: mail.from, subject: mail.subject });
    res.sendStatus(200);
  } catch (e) {
    debug('An error occurred: %o', e);
    next(e);
  }
});


app.listen(PORT, () => debug(`listening on port: ${PORT}.`));
