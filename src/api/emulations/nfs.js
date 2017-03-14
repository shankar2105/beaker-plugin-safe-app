const genRandomToken = require('../helpers').genRandomToken;
const appTokens = require('./app_tokens');

const nfsHandles = new Map();
const fileHandles = new Map();

const emulateFile = (file) => {
  const randToken = genRandomToken();
  fileHandles.set(randToken, file);
  return randToken;
};

module.exports.emulate = (nfs) => {
  const randToken = genRandomToken();
  nfsHandles.set(randToken, nfs);
  return randToken;
};

module.exports.manifest = {
  create: 'promise',
  fetch: 'promise',
  insert: 'promise',
  update: 'promise',
  getFileMeta: 'sync'
};

module.exports.create = (appToken, nfsHandle, content) => {
  return appTokens.getApp(appToken)
    .then((app) => emulateFile(nfsHandles.get(nfsHandle).create(content)));
};

module.exports.fetch = (appTokens, nfsHandle, fileName) => {
  return appTokens.getApp(appToken)
    .then((app) => emulateFile(nfsHandles.get(nfsHandle).fetch(fileName)));
};

module.exports.insert = (appToken, nfsHandle, fileHandle, fileName) => {
  return appTokens.getApp(appToken)
    .then((app) => nfsHandles.get(nfsHandle).insert(fileName, fileHandles.get(fileHandle)));
};

module.exports.update = (appToken, nfsHandle, fileHandle, fileName, version) => {
  return appTokens.getApp(appToken)
    .then((app) => nfsHandles.get(nfsHandle).update(fileName, fileHandles.get(fileHandle), version));
};

module.exports.getFileMeta = (fileHandle) => {
  const file = fileHandles.get(fileHandle);
  return {
    dataMapName: file.dataMapName,
    created: file.created,
    modified: file.modified,
    size: file.size,
    version: file.version
  }
};
