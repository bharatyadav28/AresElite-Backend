const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const dotenv = require("dotenv");
const userModel = require("../models/userModel");
const { token } = require("morgan");
dotenv.config();

exports.auth = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({
      error: {
        message: `Unauthorized.Please Send token in request header`,
      },
    });
  }
  try {

    const { userId } = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    req.userId = userId;

    const userValid = await userModel.findById(userId);

    if (!userValid) {
      return res
        .status(401)
        .send({ error: { message: `Unauthorized user not valid` } });
    }
    next();
  } catch (error) {
    return res
      .status(401)
      .send({
        error: { message: `Unauthorized server error ${(error, token)}` },
      });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId).select("+password");
    if (!user)
      return next(new ErrorHandler("Invalid token. User not found.", 401));

    if (user.role !== "admin")
      return next(new ErrorHandler("Restricted: Admin Only", 401));

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler("Unauthorized is admin error", 401));
  }
};
