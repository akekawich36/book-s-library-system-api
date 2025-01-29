var CryptoJS = require("crypto-js");

const EncodeKey = (item) => {
  let id = item;
  if (!id) {
    return "";
  }
  id = CryptoJS.AES.encrypt(id.toString(), process.env.CRYPTO_KEY).toString();
  return id;
};

const DecodeKey = (item) => {
  let id = item;
  if (!id) {
    return "";
  }
  id = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY).toString(
    CryptoJS.enc.Utf8
  );
  return id;
};

module.exports = { EncodeKey, DecodeKey };
