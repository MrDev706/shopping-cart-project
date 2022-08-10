const jwt = require('jsonwebtoken')
const Validator = require("../validation/validation")
const userModel = require("../models/userModel")


//---------------------------------------Authentication------------------------------------------------//

const authentication = async function (req, res, next) {
  try {
    let token = req.header("Authorization")
    if (!token) return res.status(400).send({ status: false, message: "Token is required" })
    token = token.split(" ")
    if (token[0] != "Bearer") return res.status(400).send({ status: false, message: "Please give a bearer token" })

    jwt.verify(token[1], "group-22-productManangement", function (err, decodedToken) {
      if (err) return res.status(401).send({ status: false, message: "invalid Token" });
      req.idDecoded = decodedToken.userId
      next()
    })
  }
  catch (err) {
    return res.status(500).send({ err: err.message })
  }
}

//--------------------------------------------Authorization--------------------------------------//

const authorization = async function (req, res, next) {
  try {
    let userId = req.params.userId

    if (!Validator.isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "enter valid UserId" });
    }

    if (!await userModel.findOne({ _id: userId, isDeleted: false })) {
      return res.status(404).send({ status: false, message: "this user doesn't exist" });
    }

    if (req.idDecoded != userId.toString()) {
      return res.status(403).send({ status: false, message: "you aren't authorized" });
    }
    next()

  }
  catch (err) {
    return res.status(500).send({ err: err.message })
  }
}

module.exports = { authentication, authorization }