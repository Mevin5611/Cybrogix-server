"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const FaqSchema = new mongoose_1.Schema({
    question: {
        type: String,
    },
    answer: {
        type: String,
    }
});
const CategoriesSchema = new mongoose_1.Schema({
    title: {
        type: String,
    }
});
const BannerImageSchema = new mongoose_1.Schema({
    public_id: {
        type: String,
    },
    url: {
        type: String
    },
});
const layoutSchema = new mongoose_1.Schema({
    type: {
        type: String
    },
    faq: [FaqSchema],
    categories: [CategoriesSchema],
    banner: {
        image: BannerImageSchema,
        title: {
            type: String,
        },
        subTitle: {
            type: String,
        }
    },
});
const LayoutModel = (0, mongoose_1.model)('Layout', layoutSchema);
exports.default = LayoutModel;
