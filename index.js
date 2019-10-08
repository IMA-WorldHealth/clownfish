require('dotenv').config();

const {
  PORT,
} = process.env;

const debug = require('debug')('clownfish');
const express = require('express');
const fs = require('fs');
const template = require('lodash.template');

const api = require('./api');
const utils = require('./utils');
const sysinfo = require('./sysinfo');
const logger = require('./logger')('clownfish.db');

const render = template(fs.readFileSync('./views/index.html'));

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
app.post('/:googleDriveParentFolderId/receive', async (req, res, next) => {
  try {
    const start = new Date();
    const mail = req.body;
    const { googleDriveParentFolderId } = req.params;

    const { normalizedStructure, normalizedReportName } = utils.parseSubjectLine(mail.subject);

    debug('received a message!');
    debug(`structure: ${normalizedStructure}`);
    debug(`report name: ${normalizedReportName}`);

    // ensures that this folder exists and returns its ID.
    const folderId = await api.ensureFolder(normalizedStructure, googleDriveParentFolderId);

    debug(`Located folder for ${normalizedStructure} with id: ${folderId}`);

    // grab attachments if they exist.
    const attachments = mail.attachments && JSON.parse(mail.attachments);

    if (attachments) {
      debug(`Located ${attachments.length} attachments.`);
      await utils.uploadAttachmentsToGoogleDrive(attachments, normalizedReportName, folderId);
    }

    debug(`Finished processing ${attachments.length} attachments`);

    // write to log
    logger.write({
      googleDriveParentFolderId,
      normalizedStructure,
      normalizedReportName,
      attachments,
      start,
      sender: mail.from,
      end: new Date(),
    });

    res.sendStatus(200);
  } catch (e) {
    debug('An error occurred: %o', e);
    next(e);
  }
});

app.listen(PORT, () => debug(`listening on port: ${PORT}.`));
