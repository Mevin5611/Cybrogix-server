import express from "express";
import { AddQuestion, addAnswer, addReview, addReviewReplay, deleteCourse, editCourse, generateVideoUrl, getAllCourse, getAllCourses, getCourseByUser, getSingleCource, uploadCourse } from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";
const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);
courseRouter.put(
  "/edit-course/:id",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);
courseRouter.get(
  "/getsingle-course/:id",
  updateAccessToken,
  getSingleCource
);
courseRouter.get(
  "/getAll-courses",
  updateAccessToken,
  getAllCourses
);
courseRouter.get(
  "/getcourseby-user/:id",
  updateAccessToken,
  isAuthenticated,
  getCourseByUser
);
courseRouter.put(
  "/addquestion",
  updateAccessToken,
  isAuthenticated,
  AddQuestion
);
courseRouter.put(
  "/addanswer",
  updateAccessToken,
  isAuthenticated,
  addAnswer
);
courseRouter.put(
  "/add-review/:id",
  updateAccessToken,
  isAuthenticated,
  addReview,
);
courseRouter.put(
  "/add-review-replay",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  addReviewReplay,
);
courseRouter.get(
  "/get-all-course",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCourse
);
courseRouter.post(
  "/getVideoCipherOTP",
  generateVideoUrl
)

courseRouter.delete(
  "/delete-course/:id",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCourse
);

export default courseRouter;
