const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/relativeTime'));

const db = require('./lib/db');

/**
 * @class Logger
 *
 * @description
 * This class allows to read and write logs in the database
 */
class Logger {
  constructor() {
    this.db = db;
  }

  write(params) {
    const start = dayjs(params.start).format('YYYY-MM-DD HH:mm:ss');
    const end = dayjs(params.end).format('YYYY-MM-DD HH:mm:ss');
    const elapsed = dayjs(end).from(start, true);
    const parameters = {
      googleDriveParentFolderId: params.googleDriveParentFolderId,
      normalizedStructure: params.normalizedStructure,
      normalizedReportName: params.normalizedReportName,
      attachments: JSON.stringify(params.attachments),
      start,
      sender: params.sender,
      end,
      elapsed,
    };

    const insertIntoLoggerQuery = `
      INSERT INTO logger (googleDriveParentFolderId, normalizedStructure, normalizedReportName, attachments, start, sender, end, elapsed)
      VALUES ($googleDriveParentFolderId, $normalizedStructure, $normalizedReportName, $attachments, $start, $sender, $end, $elapsed)
    `;

    this.db
      .prepare(insertIntoLoggerQuery)
      .run(parameters);
  }

  read(n) {
    const limit = n ? ` LIMIT ${n}` : '';
    const query = `
      SELECT
        googleDriveParentFolderId, normalizedStructure, normalizedReportName, attachments, start, sender, end, elapsed
      FROM logger
      ORDER BY start DESC ${limit}
      `;
    const rows = this.db.prepare(query).all();
    rows.forEach((row) => {
      // eslint-disable-next-line no-param-reassign
      row.attachments = row.attachments ? JSON.parse(row.attachments) : [];
    });

    return rows;
  }
}

module.exports = (name) => new Logger(name);
