const Database = require('better-sqlite3');
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/relativeTime'));

/**
 * @class Logger
 * @description this class allows to read and write logs in the database
 */
class Logger {
  constructor(name) {
    this.db = new Database(name || './database.db');

    const createLoggerTableQuery = `
      CREATE TABLE IF NOT EXISTS logger (
        googleDriveParentFolderId INTEGER,
        normalizedStructure TEXT,
        normalizedReportName TEXT,
        attachments TEXT,
        start TEXT,
        sender TEXT,
        end TEXT,
        elapsed TEXT
      )`;

    this.db
      .prepare(createLoggerTableQuery)
      .run();
  }

  write(params) {
    const start = dayjs(params.start).format('YYYY-MM-DD HH:mm:ss');
    const end = dayjs(params.end).format('YYYY-MM-DD HH:mm:ss');
    const elapsed = dayjs(end).from(start, true);
    const parameters = {
      googleDriveParentFolderId: params.googleDriveParentFolderId,
      normalizedStructure: params.normalizedStructure,
      normalizedReportName: params.normalizedReportName,
      attachments: params.attachments,
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
      FROM logger ORDER BY start DESC ${limit}
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
