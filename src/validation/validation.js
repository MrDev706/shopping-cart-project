const mongoose = require('mongoose')

/* --------------------blank body---------------------------------------------------------- */
function isValidBody(data) {
  return (Object.keys(data).length == 0)

}

/* ----------------------------------type/input value--------------------------------------- */
const isValidInputValue = function (data) {
  if (typeof (data) === 'undefined' || data === null) return false
  if (typeof (data) === 'string' && data.trim().length > 0) return true
  if (typeof (data) === 'object'|| Object.values(data) > 0 ) return true
  return false
}

/* ---------------------------------------ObjectId format-------------------------------------- */

const isValidObjectId = function (data) {
  return (mongoose.Types.ObjectId.isValid(data))
}

/* ------------------------------------string only------------------------------------------- */
const isValidOnlyCharacters = function (data) {
  return /^[A-Za-z ]+$/.test(data)
}

/* --------------------------------------email format---------------------------------------- */
function isValidEmail(data) {
  return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data))

}

/* ----------------------------------------phone format-------------------------------------- */
function isValidPhone(data) {
    return(/^[0]?[6789]\d{9}$/.test(data))

}

/* ------------------------------------------password format--------------------------------- */
function isValidPassword(data) {
  if(data.length>=8&&data.length<=15)
  return true
}

/* --------------------------------------file should be image---------------------------------- */

const isValidImageType = function (data) {
  const reg = /image\/png|image\/jpeg|image\/jpg/;
  return reg.test(data)
}

/* -----------------------------------Blank Address---------------------------------------- */
const isValidAddress = function (data) {
  if (typeof (data) === "undefined" ||data === null) return false;
  if (typeof (data) === "object" && Array.isArray(data) === false && Object.keys(data).length > 0) return true;
  return false;
};

/* ---------------------------------------pincode format------------------------------------------- */
const isValidPincode = function(data){
  if ((/^[1-9][0-9]{5}$/.test(data)))
    return true

}


module.exports = { isValidBody, isValidInputValue, isValidObjectId, isValidImageType, isValidOnlyCharacters, isValidEmail, isValidPhone, isValidPassword, isValidAddress, isValidPincode}