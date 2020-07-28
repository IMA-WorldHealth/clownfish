const debug = require('debug')('clownfish');
const drive = require('./drive');

/**
 * @function findFolderIdByName
 *
 * @param {String} name - the name of the folder to locate in Google Drive.
 * @param {String}  parentFolderId - the ID of the parent folder on Google Drive
 *
 * @returns folderOrNull
 */
async function findFolderIdByName(name, parentFolderId) {
  const { data } = await drive.files.list({
    q: `name="${name}"`,
    spaces: 'drive',
    fields: 'files(id, name)',
    parents: [parentFolderId],
  });

  if (data.files && data.files.length) {
    return data.files[0];
  }

  return null;
}

/**
 * @function createFolder
 *
 * @param {String} name - the name of the folder to create in Google Drive
 * @param {String}  parentFolderId - the ID of the parent folder on Google Drive
 *
 * @description
 * Creates a new folder in Google Drive underneath the top level directory.
 */
async function createFolder(name, parentFolderId) {
  const mimeType = 'application/vnd.google-apps.folder';
  const resource = { name, mimeType, parents: [parentFolderId] };
  const { data } = await drive.files.create({
    resource,
    fields: 'id',
  });

  return data;
}

/**
 * @function ensureFolder
 *
 * @description
 * Gracefully chains the findFolderIdByName() and createFolder() functions so that
 * folder are either created or retrieved.
 *
 */
async function ensureFolder(name, parentFolderId) {
  let folder = await findFolderIdByName(name, parentFolderId);
  if (!folder) {
    debug(`Did not locate folder on Google Drive with name "${name}".  Creating a new one.`);

    folder = await createFolder(name, parentFolderId);
    debug('Folder created!');
  }

  // id where to upload the file
  return folder.id;
}

exports.findFolderIdByName = findFolderIdByName;
exports.createFolder = createFolder;
exports.ensureFolder = ensureFolder;
