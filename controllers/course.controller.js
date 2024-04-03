"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAllCourse = exports.addReviewReplay = exports.addReview = exports.addAnswer = exports.AddQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCource = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const axios_1 = __importDefault(require("axios"));
// upload course
exports.uploadCourse = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const thumpbnail = data.thumbnail;
        if (thumpbnail) {
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(thumpbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Edit course
exports.editCourse = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseID = req.params.id;
        const courseData = (yield course_model_1.default.findById(courseID));
        if (thumbnail && typeof thumbnail === "string" && !thumbnail.startsWith("https")) {
            yield cloudinary_1.default.v2.uploader.destroy(courseData.thumbnail.public_id);
            const photo = yield cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "course",
            });
            data.thumbnail = {
                public_id: photo.public_id,
                url: photo.secure_url,
            };
        }
        if (typeof thumbnail === "string" && thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData === null || courseData === void 0 ? void 0 : courseData.thumbnail.public_id,
                url: courseData === null || courseData === void 0 ? void 0 : courseData.thumbnail.url,
            };
        }
        /* if (thumbnail) {
          await cloudinary.v2.uploader.destroy(thumbnail.public_id);
  
          const mycloud = await cloudinary.v2.uploader.upload(thumbnail, {
            folder: "courses",
          });
          data.thumbnail = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
          };
        } */
        const courseId = req.params.id;
        const course = yield course_model_1.default.findByIdAndUpdate(courseId, {
            $set: data,
        }, {
            new: true,
        });
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// get single course without purchase
exports.getSingleCource = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        /* const isCacheExist = await redis.get(courseId); */
        /* if (isCacheExist) {
          const course = JSON.parse(isCacheExist);
          console.log("hitting redis");
  
          res.status(200).json({
            success: true,
            course,
          });
        } else { */
        const course = yield course_model_1.default.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        console.log("hitting mongodb");
        yield redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// get all courses without purchasing
exports.getAllCourses = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        /* const isCacheExist = await redis.get("allCourses");
        if (isCacheExist) {
          const courses = JSON.parse(isCacheExist);
          console.log("hitting redis");
          res.status(200).json({
            success: true,
            courses,
          });
        } else { */
        const courses = yield course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        yield redis_1.redis.set("allCourses", JSON.stringify(courses));
        console.log("hitting mongodb");
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// get course content--- only for valid user
exports.getCourseByUser = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userCourseList = (_a = req.user) === null || _a === void 0 ? void 0 : _a.courses;
        const courseId = req.params.id;
        const isCourseExist = userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.find((course) => course._id === courseId);
        if (!isCourseExist) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course ", 404));
        }
        const course = yield course_model_1.default.findById(courseId);
        const content = course === null || course === void 0 ? void 0 : course.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.AddQuestion = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    try {
        const { question, courseId, contentId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("invalid content id", 400));
        }
        const courseContent = (_b = course === null || course === void 0 ? void 0 : course.courseData) === null || _b === void 0 ? void 0 : _b.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("invalid content id", 400));
        }
        //create new question
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        // add this new question object to content data
        courseContent.questions.push(newQuestion);
        //notification 
        yield notification_model_1.default.create({
            user: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            title: "New Question Recived",
            message: `You Have a new question in ${courseContent.title}`,
        });
        // save the course
        yield (course === null || course === void 0 ? void 0 : course.save());
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addAnswer = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f, _g;
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("invalid content id", 400));
        }
        const courseContent = (_d = course === null || course === void 0 ? void 0 : course.courseData) === null || _d === void 0 ? void 0 : _d.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("invalid content id", 400));
        }
        const question = (_e = courseContent === null || courseContent === void 0 ? void 0 : courseContent.questions) === null || _e === void 0 ? void 0 : _e.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default("invalid question id", 400));
        }
        // create new answer
        const newAnswer = {
            user: req.user,
            answer,
        };
        // add this answer to our course content
        question.questionReplies.push(newAnswer);
        yield (course === null || course === void 0 ? void 0 : course.save());
        if (((_f = req.user) === null || _f === void 0 ? void 0 : _f._id) === question.user._id) {
            // create notification
            yield notification_model_1.default.create({
                user: (_g = req.user) === null || _g === void 0 ? void 0 : _g._id,
                title: "New Question Replay Recived",
                message: `You Have a new question replay in ${courseContent.title}`,
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-replay.ejs"), data);
            try {
                yield (0, sendMail_1.default)({
                    email: question.user.email,
                    subject: "Question Replay",
                    template: "question-replay.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 500));
            }
        }
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addReview = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j, _k;
    try {
        const userCourseList = (_h = req.user) === null || _h === void 0 ? void 0 : _h.courses;
        const courseId = req.params.id;
        // check if courseId alredu exist in userCourse list
        const courseExist = userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.some((course) => course._id.toString() === courseId.toString());
        if (!courseExist) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course", 404));
        }
        const course = yield course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const newReview = {
            user: req.user,
            comment: review,
            rating,
        };
        course === null || course === void 0 ? void 0 : course.reviews.push(newReview);
        let avg = 0;
        course === null || course === void 0 ? void 0 : course.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        if (course) {
            course.ratings = avg / course.reviews.length;
        }
        yield (course === null || course === void 0 ? void 0 : course.save());
        //create notification
        yield notification_model_1.default.create({
            user: (_j = req.user) === null || _j === void 0 ? void 0 : _j._id,
            title: "New review recived",
            message: `${(_k = req.user) === null || _k === void 0 ? void 0 : _k.name} has given a review in ${course === null || course === void 0 ? void 0 : course.name}`,
        });
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addReviewReplay = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m;
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("course not found", 404));
        }
        const review = course.reviews.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("review not found", 404));
        }
        const newReplay = {
            user: req.user,
            comment,
        };
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        review.commentReplies.push(newReplay);
        yield (course === null || course === void 0 ? void 0 : course.save());
        yield notification_model_1.default.create({
            user: (_l = req.user) === null || _l === void 0 ? void 0 : _l._id,
            title: "New review replay recived",
            message: `${(_m = req.user) === null || _m === void 0 ? void 0 : _m.name} has given a replay in your review in ${course === null || course === void 0 ? void 0 : course.name}`,
        });
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// get all courses -- only for admin
exports.getAllCourse = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, course_service_1.getAllCourseService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// delete course only for admin
exports.deleteCourse = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _id = req.params.id;
        const course = yield course_model_1.default.findById(_id);
        if (!course) {
            return next(new ErrorHandler_1.default("course not found", 404));
        }
        yield course.deleteOne({ _id });
        yield redis_1.redis.del(_id);
        res.status(201).json({
            success: true,
            message: "Course deleted successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// generate video url
exports.generateVideoUrl = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { videoId } = req.body;
        const response = yield axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Apisecret ${process.env.VIDEOCIPHER_API_SERECT}`,
            },
        });
        res.json(response.data);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
