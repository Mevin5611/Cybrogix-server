"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_moder_1 = require("../controllers/notification.controller.moder");
const notificationRoute = express_1.default.Router();
notificationRoute.get("/get-all-notifications", notification_controller_moder_1.getNotification);
notificationRoute.put("/update-notification/:id", notification_controller_moder_1.updateNotification);
exports.default = notificationRoute;
