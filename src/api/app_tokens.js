const crypto = require('crypto'); // electron deps will be avaible inside browser
const genRandomToken = require('./helpers').genRandomToken;

const app_tokens = new Map();

module.exports.addApp = (app) => {
  let token = genRandomToken();
  app_tokens.set(token, app);
  return token;
}

module.exports.getApp = (app_token) => {
  let app = app_tokens.get(app_token);
  if (app) {
    return Promise.resolve(app);
  }
  return Promise.reject("Invalid application token");
}

module.exports.replaceApp = (token, app) => {
  if (!app_tokens.has(token)) {
    return null;
  }
  app_tokens.set(token, app);
  return token;
};
