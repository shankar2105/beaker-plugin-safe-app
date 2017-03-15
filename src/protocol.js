/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies */
const protocol = require('electron').protocol;
/* eslint-enable import/no-unresolved, import/no-extraneous-dependencies */
const safeApp = require('safe-app');
const urlParse = require('url').parse;
const mime = require('mime');

const safeScheme = 'safe';

const appInfo = {
  id: 'net.maidsafe.app.browser',
  name: 'SAFE Browser',
  vendor: 'MaidSafe'
};

let appObj = null;

const authoriseApp = () => {
  if (appObj) {
    return Promise.resolve(true);
  }
  return safeApp.initializeApp(appInfo)
    .then((app) => app.auth.connectUnregistered())
    .then((app) => (appObj = app));
};

const fetchData = (url) => {
  if (!appObj) {
    return Promise.reject(new Error('Unable to create unregistered client'));
  }
  return appObj.webFetch(url)
    .then((f) => appObj.immutableData.fetch(f.dataMapName))
    .then((i) => i.read());
};

const registerSafeAuthProtocol = () => {
  protocol.registerBufferProtocol(safeScheme, (req, cb) => {
    const parsedUrl = urlParse(req.url);
    const fileExt = parsedUrl.pathname.split('/').slice(-1)[0].split('.')[1] || 'html';
    authoriseApp()
      .then(() => fetchData(req.url))
      .then((co) => cb({ mimeType: mime.lookup(fileExt), data: co }))
      .catch(console.error);
  }, (err) => {
    if (err) console.error('Failed to register protocol');
  });
};

module.exports = {
  scheme: safeScheme,
  label: 'SAFE',
  isStandardURL: true,
  isInternal: true,
  register: registerSafeAuthProtocol
};
