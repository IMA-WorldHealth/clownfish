CREATE TABLE IF NOT EXISTS logger (
  googleDriveParentFolderId TEXT,
  normalizedStructure TEXT,
  normalizedReportName TEXT,
  attachments TEXT,
  start TEXT,
  sender TEXT,
  end TEXT,
  elapsed TEXT
);

CREATE TABLE IF NOT EXISTS router (
  gdrive_folder_id TEXT NOT NULL,
  email_address TEXT NOT NULL,
  UNIQUE (gdrive_folder_id, email_address) ON CONFLICT REPLACE
);
