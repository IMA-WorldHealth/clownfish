require('dotenv').config();
const fs = require('fs');
const { google } = require('googleapis');
const debug = require('debug')('clownfish:drive');

try {
  const TOKEN = JSON.parse(fs.readFileSync('./credentials/token.json'));
  const { installed } = JSON.parse(fs.readFileSync('./credentials/credentials.json'));

  const auth = new google.auth.OAuth2(
    installed.client_id,
    installed.client_secret,
    installed.redirect_uris[0],
  );

  // set the credentials for the drive API
  auth.setCredentials(TOKEN);

  module.exports = google.drive({ version: 'v3', auth });
} catch (e) {
  debug('An error occurred loading google drive link.');
  debug(e);
}
