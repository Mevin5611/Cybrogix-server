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
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.updateUserCertificates = exports.updateUserProfile = exports.updatePassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registrationUser = void 0;
require("dotenv").config();
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.registrationUser = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = yield user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email alredy exist", 400));
        }
        const user = {
            name,
            email,
            password,
        };
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
        try {
            (0, sendMail_1.default)({
                email: user.email,
                subject: "Activate Your Account",
                template: "activation-mail.ejs",
                data,
            });
            res.status(200).json({
                success: true,
                message: `Please check your email ${user.email} to activate your account!`,
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jsonwebtoken_1.default.sign({ user, activationCode }, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        const existUser = yield user_model_1.default.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        const user = yield user_model_1.default.create({
            name,
            email,
            password,
        });
        res.status(200).json({
            success: true,
            message: "Account activated successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.loginUser = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email and password", 400));
        }
        const user = yield user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        const isPasswordMatch = yield user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// Logout user
exports.logoutUser = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const user = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || "";
        redis_1.redis.del(user);
        res.status(200).json({
            success: true,
            message: "Successfully logged out",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//update access token
exports.updateAccessToken = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refresh_token = req.cookies.refresh_token;
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        const message = "could not find refresh token";
        if (!decoded) {
            return next(new ErrorHandler_1.default(message, 400));
        }
        const session = yield redis_1.redis.get(decoded.id);
        console.log(session);
        if (!session) {
            return next(new ErrorHandler_1.default("Please login to access the resource", 400));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: "5m",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
            expiresIn: "3d",
        });
        req.user = user;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        yield redis_1.redis.set(user._id, JSON.stringify(user), "EX", 604800);
        next();
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get user info
exports.getUserInfo = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        (0, user_service_1.getUserById)(userId, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.socialAuth = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, avatar } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            const newUser = yield user_model_1.default.create({ email, name, avatar });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.updateUserInfo = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { name } = req.body;
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        const user = yield user_model_1.default.findById(userId);
        if (name && user) {
            user.name = name;
        }
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "user info updated",
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.updatePassword = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const { oldPassword, newPassword } = req.body;
        const user = yield user_model_1.default.findById((_d = req.user) === null || _d === void 0 ? void 0 : _d._id).select("+password");
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please enter old and new password", 400));
        }
        if ((user === null || user === void 0 ? void 0 : user.password) === undefined) {
            return next(new ErrorHandler_1.default("invalid user", 400));
        }
        const isPasswordMatch = yield (user === null || user === void 0 ? void 0 : user.comparePassword(oldPassword));
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invaild Old Password", 400));
        }
        user.password = newPassword;
        yield user.save();
        redis_1.redis.set((_e = req.user) === null || _e === void 0 ? void 0 : _e._id, JSON.stringify(user));
        res.status(201).json({
            success: true,
            message: "password successfully updated",
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.updateUserProfile = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h;
    try {
        const { avatar } = req.body;
        const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
        const user = yield user_model_1.default.findById(userId);
        if (avatar && user) {
            if (!user) {
                return next(new ErrorHandler_1.default("user not found", 400));
            }
            if ((_g = user === null || user === void 0 ? void 0 : user.avatar) === null || _g === void 0 ? void 0 : _g.public_id) {
                yield cloudinary_1.default.v2.uploader.destroy((_h = user === null || user === void 0 ? void 0 : user.avatar) === null || _h === void 0 ? void 0 : _h.public_id);
                const myCloud = yield cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatar",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            else {
                const myCloud = yield cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatar",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
        }
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "user profile updated",
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.updateUserCertificates = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { certificates, course, userId } = req.body;
        console.log(userId);
        const user = yield user_model_1.default.findById(userId);
        if (certificates && course && user) {
            if (!user) {
                return next(new ErrorHandler_1.default("user not found", 400));
            }
            /* if (user?.certificates?.public_id) {
              await cloudinary.v2.uploader.destroy(user?.certificates?.public_id);
    
              const myCloud = await cloudinary.v2.uploader.upload(certificates, {
                folder: "certificate",
                width: 150,
              });
              user.certificates = [{
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
              }];
            } else { */
            let updatedCertificates = [];
            // Check if the user already has certificates
            if (user.certificates && user.certificates.length > 0) {
                updatedCertificates = [...user.certificates]; // Copy existing certificates
            }
            if (certificates) {
                const myCloud = yield cloudinary_1.default.v2.uploader.upload(certificates, {
                    folder: "certificate",
                });
                updatedCertificates.push({
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                    course,
                });
            }
            // Update user's certificates array
            user.certificates = updatedCertificates;
        }
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "user certificate updated",
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get all users -- only for admin
exports.getAllUsers = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, user_service_1.getAllUserService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// update user role only for admin
exports.updateUserRole = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, role } = req.body;
        (0, user_service_1.updateUserRoleService)(res, email, role);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// delete user only for admin
exports.deleteUser = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _id = req.params.id;
        const user = yield user_model_1.default.findById(_id);
        if (!user) {
            return next(new ErrorHandler_1.default("user not found", 404));
        }
        yield user.deleteOne({ _id });
        yield redis_1.redis.del(_id);
        res.status(201).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
