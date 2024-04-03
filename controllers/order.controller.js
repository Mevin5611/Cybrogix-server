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
exports.newPayment = exports.sendStripePublishibleKey = exports.getAllOrders = exports.createOrder = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const course_model_1 = __importDefault(require("../models/course.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const order_service_1 = require("../services/order.service");
const redis_1 = require("../utils/redis");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// create order
exports.createOrder = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { courseId, payment_info } = req.body;
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        const courseExistInUser = user === null || user === void 0 ? void 0 : user.courses.some((course) => course._id.toString() === courseId);
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = yield stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler_1.default("payment not authorized", 400));
                }
            }
        }
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You have alredy purchased this course", 400));
        }
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("course not found", 400));
        }
        const data = {
            courseId: course._id,
            userId: user === null || user === void 0 ? void 0 : user._id,
            payment_info,
        };
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                benefits: course.benefits,
                price: course.price,
                date: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        try {
            if (user) {
                yield (0, sendMail_1.default)({
                    email: user === null || user === void 0 ? void 0 : user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 500));
        }
        user === null || user === void 0 ? void 0 : user.courses.push(course === null || course === void 0 ? void 0 : course._id);
        yield redis_1.redis.set((_b = req.user) === null || _b === void 0 ? void 0 : _b._id, JSON.stringify(user));
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield notification_model_1.default.create({
            user: user === null || user === void 0 ? void 0 : user._id,
            title: "New Order",
            message: `You Have a new order from ${course === null || course === void 0 ? void 0 : course.name}`,
        });
        course.purchased = (course.purchased || 0) + 1;
        yield course.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// get all orders only for admins
exports.getAllOrders = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, order_service_1.getAllOrderServices)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// send stripe publishible key
exports.sendStripePublishibleKey = (0, catchAsyncError_1.CatchAsyncError)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        publishablekey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
}));
// new payment
exports.newPayment = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const myPayment = yield stripe.paymentIntents.create({
            amount: req.body.amount,
            description: "Software development services",
            shipping: {
                name: "Jenny Rosen",
                address: {
                    line1: "510 Townsend St",
                    postal_code: "98140",
                    city: "San Francisco",
                    state: "CA",
                    country: "US",
                },
            },
            currency: "usd",
            payment_method_types: ["card"],
        });
        res.status(200).json({
            success: true,
            client_secret: myPayment.client_secret,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
