var CryptoJS = require("crypto-js");

const EncodeKey = (item) => {
  if (!item) {
    return "";
  }
  const encrypted = CryptoJS.AES.encrypt(
    item.toString(),
    process.env.CRYPTO_KEY
  ).toString();
  const bufferStr = Buffer.from(encrypted).toString("base64");
  return bufferStr;
};

const DecodeKey = (item) => {
  if (!item) {
    return "";
  }
  const originalEncrypted = Buffer.from(item, "base64").toString();
  const decrypted = CryptoJS.AES.decrypt(
    originalEncrypted,
    process.env.CRYPTO_KEY
  ).toString(CryptoJS.enc.Utf8);
  return decrypted;
};

module.exports = { EncodeKey, DecodeKey };
