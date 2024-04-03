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
exports.getLayout = exports.editLayout = exports.createLayout = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const layout_model_1 = __importDefault(require("../models/layout.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// create Layout
exports.createLayout = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.body;
        const isTypeExist = yield layout_model_1.default.findOne({ type });
        if (isTypeExist) {
            return next(new ErrorHandler_1.default(`${type} alredy exist`, 400));
        }
        if (type === "Banner") {
            const { image, title, subTitle } = req.body;
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(image, {
                folder: "Banner",
            });
            const banner = {
                type: "Banner",
                banner: {
                    image: {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    },
                    title,
                    subTitle,
                },
            };
            yield layout_model_1.default.create(banner);
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = yield Promise.all(faq.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            })));
            yield layout_model_1.default.create({ type: "FAQ", faq: faqItems });
        }
        if (type === "categories") {
            const { categories } = req.body;
            const categoriesItems = yield Promise.all(categories.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                return {
                    title: item.title,
                };
            })));
            yield layout_model_1.default.create({
                type: "categories",
                categories: categoriesItems,
            });
        }
        res.status(200).json({
            success: true,
            message: "Lyout created successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// edit layout
exports.editLayout = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.body;
        if (type === "Banner") {
            const { image, title, subTitle } = req.body;
            const bannerData = yield layout_model_1.default.findOne({ type: "Banner" });
            const data = image.startsWith("https")
                ? bannerData
                : yield cloudinary_1.default.v2.uploader.upload(image, {
                    folder: "Banner",
                });
            const banner = {
                type: "Banner",
                image: {
                    public_id: image.startsWith("https")
                        ? bannerData.banner.image.public_id
                        : data === null || data === void 0 ? void 0 : data.public_id,
                    url: image.startsWith("https")
                        ? bannerData.banner.image.url
                        : data === null || data === void 0 ? void 0 : data.secure_url,
                },
                title,
                subTitle,
            };
            yield layout_model_1.default.findByIdAndUpdate(bannerData._id, { banner }, {
                new: true,
            });
            res.status(201).json({
                success: true,
                message: "Banner updated successfully",
            });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const FaqItem = yield layout_model_1.default.findOne({ type: "FAQ" });
            const faqItems = yield Promise.all(faq.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            })));
            yield layout_model_1.default.findByIdAndUpdate(FaqItem === null || FaqItem === void 0 ? void 0 : FaqItem._id, {
                type: "FAQ",
                faq: faqItems,
            });
        }
        if (type === "categories") {
            const { categories } = req.body;
            const cateGories = yield layout_model_1.default.findOne({ type: "categories" });
            const categoriesItems = yield Promise.all(categories.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                return {
                    title: item.title,
                };
            })));
            yield layout_model_1.default.findByIdAndUpdate(cateGories === null || cateGories === void 0 ? void 0 : cateGories._id, {
                type: "categories",
                categories: categoriesItems,
            });
        }
        res.status(200).json({
            success: true,
            message: "Lyout Updated successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// get layout
exports.getLayout = (0, catchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        const layout = yield layout_model_1.default.findOne({ type });
        res.status(201).json({
            success: true,
            layout,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
