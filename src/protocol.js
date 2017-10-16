import { setupSafeLogProtocol } from './safe-logs';

const path = require('path');
const safeApp = require('@maidsafe/safe-node-app');
const urlParse = require('url').parse;
const mime = require('mime');
const ipc = require('./api/ipc');
/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved */
const protocol = require('electron').protocol;
const app = require('electron').app;

const errorTemplate = require('./error-template.ejs');
const safeCss = require('./safe-pages.css');

const safeScheme = 'safe';
const safeLocalScheme = 'localhost';
const safeLogScheme = 'safe-logs';

const isDevMode = process.execPath.match(/[\\/]electron/);

const appInfo = {
  id: 'net.maidsafe.app.browser.safe-app-plugin',
  name: 'SAFE App Browser Plugin',
  vendor: 'MaidSafe.net Ltd',
  customExecPath: isDevMode ? `${process.execPath} ${app.getAppPath()}` : app.getPath('exe')
};

// OSX: Add bundle for electron in dev mode
if( isDevMode && process.platform === 'darwin' )
{
	appInfo.bundle = 'com.github.electron'
}

let appObj = null;

const netStateChange = (state) => {
  console.log('Network state changed to: ', state);
}

const authoriseApp = () => {
  return new Promise((resolve, reject) => {
    if (appObj) {
      return resolve();
    }
    const opts = {
      registerScheme: false,
      joinSchemes: [safeScheme]
    }
    return safeApp.initializeApp(appInfo, netStateChange, opts)
      .then((app) => app.auth.genConnUri()
        .then((connReq) => ipc.sendAuthReq(connReq, true, (err, res) => {
          if (err) {
            return reject(new Error('Unable to get connection information: ', err));
          }
          return app.auth.loginFromURI(res)
            .then((app) => {
              appObj = app;
              return resolve();
            });
        }))
      ).catch(reject);
  });
};

const fetchData = (url) => {
  if (!appObj) {
    return Promise.reject(new Error('Unexpected error. SAFE App connection not ready'));
  }
  return appObj.webFetch(url);
};


const handleError = (err, mimeType, cb) => {
  err.css = safeCss;

  const page = errorTemplate(err);

  if (mimeType === 'text/html') {
    return cb({ mimeType, data: new Buffer(page) });
  }
  return cb({ mimeType, data: new Buffer(err.message) });
};


const registerSafeLocalProtocol = () => {
  protocol.registerHttpProtocol(safeLocalScheme, (req, cb) => {
    const parsed = urlParse(req.url);

    if (!parsed.host) { return; }

    const path = parsed.pathname;
    const port = parsed.port;
    const newUrl = `http://localhost:${port}${path}`;

    cb({ url: newUrl });
  });
};

const registerSafeProtocol = () => {
  return authoriseApp().then(() => {
    protocol.registerBufferProtocol(safeScheme, (req, cb) => {
      const parsedUrl = urlParse(req.url);
      const fileExt = path.extname(path.basename(parsedUrl.pathname)) || 'html';
      const mimeType = mime.lookup(fileExt);

      fetchData(req.url)
        .then((co) => cb({ mimeType, data: co }))
        .catch((err) => handleError(err, mimeType, cb));
    }, (err) => {
      if (err) console.error('Failed to register protocol');
    });
  });
};

export const registerSafeLogs = () => {
  return authoriseApp()
    .then(() => setupSafeLogProtocol(appObj));
};

module.exports = [{
  scheme: safeScheme,
  label: 'SAFE',
  isStandardURL: true,
  isInternal: true,
  register: registerSafeProtocol
}, {
  scheme: safeLocalScheme,
  label: 'SAFE-localhost',
  isStandardURL: true,
  isInternal: true,
  register: registerSafeLocalProtocol
},
{
  scheme: safeLogScheme,
  label: 'SAFE-logs',
  register: registerSafeLogs
}];
