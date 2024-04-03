require("dotenv").config();
import express from "express";
import { Request, Response, NextFunction } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRoute from "./routes/notification.route";
import analyticsRoute from "./routes/analytics.route";
import layoutRoute from "./routes/layout.route";
import { rateLimit } from 'express-rate-limit'

//body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser

app.use(cookieParser());



//cors
app.use(
  cors({
    origin:['https://cybrogix-client.vercel.app'],
    credentials:true,
  })
);

// api limiter
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	limit: 100, 
	standardHeaders: 'draft-7',
	legacyHeaders: false,

})

app.use(
  "/",
  userRouter,
  courseRouter,
  orderRouter,
  notificationRoute,
  analyticsRoute,
  layoutRoute
);

// testing api

/* app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    messege: "API is Working",
  });
}); */

// Unknown route

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

app.use(limiter)
app.use(ErrorMiddleware);
