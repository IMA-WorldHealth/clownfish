require('dotenv').config();

const {
  PORT,
} = process.env;

const debug = require('debug')('clownfish');
const express = require('express');
const fs = require('fs');
const template = require('lodash.template');

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

// require the imap listener
require('./lib/imap');

app.listen(PORT, () => debug(`listening on port: ${PORT}.`));
