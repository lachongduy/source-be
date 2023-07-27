const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new mongoose.Schema(
    {
        imageBanner: {
            type: String,
        },
        status: {
            type: Boolean,
            default: true,
        },
        doUuTien: {
            type: Number
        },
        imagePublicId: {
            type: String,
        },
        coverImage: String,
        coverImagePublicId: String,
    },
    {
        timestamps: true,
    }
);
const Banner = mongoose.model("Banner", bannerSchema);
module.exports = Banner;
