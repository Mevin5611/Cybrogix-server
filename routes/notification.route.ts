import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getNotification, updateNotification } from "../controllers/notification.controller.moder";
import { updateAccessToken } from "../controllers/user.controller";

const notificationRoute = express.Router();

notificationRoute.get(
  "/get-all-notifications",
  
  getNotification
);
notificationRoute.put(
  "/update-notification/:id",
  
  updateNotification
);


export default notificationRoute;