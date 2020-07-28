require('dotenv').config();

const {
  PORT,
} = process.env;

const debug = require('debug')('clownfish');
const express = require('express');
const sysinfo = require('./lib/sysinfo');
const db = require('./lib/db');

const app = express();
app.set('view engine', 'pug');
app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ extended: true }));

app.get('/', (req, res, next) => {
  try {
    const info = sysinfo();

    const logs = db
      .prepare('SELECT * FROM inbox ORDER BY timestamp DESC LIMIT 10;')
      .all();

    res.render('index', {
      info, title: 'Clownfish', subtitle: 'by IMA World Health', logs,
    });
  } catch (e) {
    debug('An error occurred: %o', e);
    next(e);
  }
});

// require the imap listener
require('./lib/imap');

app.listen(PORT, () => debug(`listening on port: ${PORT}.`));
