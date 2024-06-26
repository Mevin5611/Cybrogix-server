"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analytics_controller_1 = require("../controllers/analytics.controller");
const user_controller_1 = require("../controllers/user.controller");
const analyticsRoute = express_1.default.Router();
analyticsRoute.get("/get-user-analytics", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getUserAnlytics);
analyticsRoute.get("/get-course-analytics", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getCourseAnlytics);
analyticsRoute.get("/get-order-analytics", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getOrderAnlytics);
exports.default = analyticsRoute;
