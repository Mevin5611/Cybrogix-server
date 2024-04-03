"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const course_controller_1 = require("../controllers/course.controller");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const courseRouter = express_1.default.Router();
courseRouter.post("/create-course", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.uploadCourse);
courseRouter.put("/edit-course/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.editCourse);
courseRouter.get("/getsingle-course/:id", course_controller_1.getSingleCource);
courseRouter.get("/getAll-courses", course_controller_1.getAllCourses);
courseRouter.get("/getcourseby-user/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, course_controller_1.getCourseByUser);
courseRouter.put("/addquestion", user_controller_1.updateAccessToken, auth_1.isAuthenticated, course_controller_1.AddQuestion);
courseRouter.put("/addanswer", user_controller_1.updateAccessToken, auth_1.isAuthenticated, course_controller_1.addAnswer);
courseRouter.put("/add-review/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, course_controller_1.addReview);
courseRouter.put("/add-review-replay", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.addReviewReplay);
courseRouter.get("/get-all-course", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.getAllCourse);
courseRouter.post("/getVideoCipherOTP", course_controller_1.generateVideoUrl);
courseRouter.delete("/delete-course/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.deleteCourse);
exports.default = courseRouter;
