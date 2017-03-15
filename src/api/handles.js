const genRandomString = require('./helpers').genRandomString;

const handles = new Map();

module.exports.genHandle = (obj) => {
  const randHandle = genRandomString();
  handles.set(randHandle, obj);
  return randHandle;
};

module.exports.replaceHandle = (handle, obj) => {
  if (!handles.has(handle)) {
    return null;
  }
  handles.set(handle, obj);
  return handle;
};

module.exports.getObj = (handle) => {
  return new Promise((resolve, reject) => {
    let obj = handles.get(handle);
    if (obj) {
      return resolve(obj);
    }
    return reject("Invalid handle");
  });
};

module.exports.freeObj = (handle) => {
  handles.delete(handle);
};
