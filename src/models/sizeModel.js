const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sizeSchema = new mongoose.Schema(
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
const Size = mongoose.model("Size", sizeSchema);
module.exports = Size;
