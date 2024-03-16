import ErrorHandler from "../utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";

export const  ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "internal server Error";

  //wrong mongodb id error

  if (err.name === "CastError") {
    const message = `Resource not found invalid : ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Duplicate key error
  if (err.name === 11000) {
    const message = `Dupilicate ${Object.keys(err.keValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // wrong jwt token

  if (err.name === "JsonWebTokenError") {
    const message = `jsonWebToken is invalid try again`;
    err = new ErrorHandler(message, 400);
  }
  // jwt expired eror

  if (err.name === "TokenExpiredError") {
    const message = `jsonWebToken is Expired try again`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
