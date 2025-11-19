// utils/validators.js
function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

function isValidURL(url) {
  try {
    // require http/https
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (e) {
    return false;
  }
}

module.exports = { isValidCode, isValidURL };
