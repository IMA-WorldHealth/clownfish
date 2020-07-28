/**
Design:

The `smtp` table keeps a record of each hostname which is the mail
server.  It also contains the individual accounts and passwords, an
the mapping to the google drive identifier.

The `emails` table contains a key to the smtp table for the email address
matched, and then contains ids to the message on the IMAP server and in
google drive.

Importantly, the `emails.seq` record must match the latest IMAP sequence
from the folder.  It will be used for looking up new emails.

The `envelope` is optional.  It contains the message body for posterity.

*/

-- SMTP credentials for different servers.  Each email host maps
-- to it's own Google Drive folder.
CREATE TABLE IF NOT EXISTS `smtp` (
  id INTEGER PRIMARY KEY NOT NULL,
  host TEXT NOT NULL, -- mail.domain.com
  username TEXT NOT NULL, -- user@mail.domain.com
  password TEXT NOT NULL,
  gdrive_folder_id TEXT NOT NULL,
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (gdrive_folder_id, username) ON CONFLICT REPLACE
);

-- inbox
CREATE TABLE IF NOT EXISTS `inbox` (
  smtp_id INTEGER NOT NULL,
  seq INTEGER NOT NULL,
  message_id TEXT NOT NULL,
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  attachments TEXT NOT NULL,
  date DATETIME NOT NULL,
  gdrive_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (smtp_id) REFERENCES smtp (id)
);
