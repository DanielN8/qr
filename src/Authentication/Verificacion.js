const crypto = require('crypto');

const tokens = {}; 

const generateToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

const storeToken = (token, email) => {
  tokens[token] = {
    email,
    expires: Date.now() + 20 * 60 * 1000 
  };
};

const verifyToken = (token) => {
  const record = tokens[token];
  if (!record) return false;
  if (Date.now() > record.expires) {
    delete tokens[token];
    return false;
  }
  delete tokens[token];
  return record.email;
};

module.exports = { generateToken, storeToken, verifyToken };
