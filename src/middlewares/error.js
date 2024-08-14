const ErrorHandler = require('../utils/errorHandler');

module.exports = (err, req, res, next) => {
    err.message = err.message || "Internal Server Error";

    if (err.name === "CastError") {
        const msg = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(msg, 400);
      }
    
      if (err.name === "ValidationError") {
        let errors = Object.values(err.errors).map((el) =>
          JSON.stringify({
            [el.path]: { required: el.kind, provided: el.valueType },
          })
        );
    
        const msg = `Validation Failed. ${errors.join(" ")}`;
        err = new ErrorHandler(msg, 400);
      }
    
      // mongoose duplicate key error
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        let message;
        switch (field) {
          case "name":
            message = "Category with this name already exists.";
            break;
          case "email":
            message = "User with this email already exists.";
            break;
          default:
            message = `Duplicate Key Error ${field}.`;
        }
        err = new ErrorHandler(message, 400);
      }
    
      // wrong jwt error
      if (err.name === "JsonWebTokenError") {
        const message = `Json Web Token is invalid, try again`;
        err = new ErrorHandler(message, 400);
      }
    
      // JWT expire error
      if (err.name === "TokenExpiredError") {
        const message = `Json Web Token is expired, try again`;
        err = new ErrorHandler(message, 400);
      }
    
      res.status(err.statusCode || 500).json({
        success: false,
        error: {
          message: err.message,
        },
      });

}