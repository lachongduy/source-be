const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const colorSchema = new mongoose.Schema(
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
        sizes: [
            {
                size: {
                    type: Schema.Types.ObjectId,
                    ref: "Size",
                },
                quantity: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        imageColor: {
            type: String,
        },
        imagePublicId: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Color = mongoose.model("Color", colorSchema);
module.exports = Color;