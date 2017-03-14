module.exports.genRandomToken = () => (crypto.randomBytes(32).toString('hex'));
