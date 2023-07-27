const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const typeProductModel = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
        products: [],
    },
    {
        timestamps: true,
    }
);
const TypeProduct = mongoose.model("TypeProduct", typeProductModel);
module.exports = TypeProduct;