import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getCourseAnlytics, getOrderAnlytics, getUserAnlytics } from "../controllers/analytics.controller";
import { updateAccessToken } from "../controllers/user.controller";

const analyticsRoute = express.Router();

analyticsRoute.get(
  "/get-user-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getUserAnlytics
);
analyticsRoute.get(
  "/get-course-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getCourseAnlytics
);
analyticsRoute.get(
  "/get-order-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getOrderAnlytics
);


export default analyticsRoute