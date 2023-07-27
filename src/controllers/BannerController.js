const Banner = require("../models/bannerModel");
const { responseSuccess, responseError } = require("../utils/responseInfo");

const {
    uploadToCloudinary,
    deleteFromCloudinary,
} = require("../utils/cloudinary");

const BannerController = {
    list: async (req, res) => {
        try {
            let perPage = req.query.per_page || 10; // số lượng sản phẩm xuất hiện trên 1 page
            let page = req.query.current_page || 0;

            Banner.find().sort({ createdAt: -1 }) // find tất cả các data
                .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
                .limit(perPage)
                .exec((err, banner) => {
                    Banner.countDocuments((err, count) => {
                        if (err) return next(err);
                        const meta = {
                            per_page: perPage,
                            totalElements: count,
                            totalPages: Math.ceil(count / perPage),
                        };
                        const status = {
                            code: 200,
                            // suscess: true,
                            //message: "Lấy dữ liệu thành công",
                        };
                        responseSuccess(res, banner, meta, status);
                    });
                });
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message,
            });
        }
    },
    uploadBanner: async (req, res) => {
        try {
            const { data } = req.body;
            const parserData = JSON.parse(data);
            const { doUuTien } = parserData;

            const file = req.file;
            if (doUuTien === "") {
                res.status(205).json({ message: "Vui lòng nhập trường này" });
            }
            const findDoUuTien = await Banner.findOne({ doUuTien });
            if (findDoUuTien) {
                const status = {
                    code: 201,
                    message: "Thứ tự đã tồn tại"
                }
                return responseSuccess(res, null, null, status)
            }

            if (!file) {
                return res.status(205).send("Vui lòng tải ảnh lên");
            }
            if (file && !file.mimetype.match(/image-*/)) {
                return res.status(205).send("Ảnh không đúng định dạng");
            }
            let imageUrl;
            let imagePublicId;
            if (file) {
                const uploadImage = await uploadToCloudinary(file, "banners");
                if (!uploadImage.secure_url) {
                    return res.status(205).send({ message: "Tải ảnh thất bại" });
                }
                imageUrl = uploadImage.secure_url;
                imagePublicId = uploadImage.public_id;
            }
            const newBanner = new Banner({
                doUuTien,
                imageBanner: imageUrl,
                imagePublicId: imagePublicId,
            });
            await newBanner.save();
            const status = {
                code: 200,
                suscess: true,
                message: "Thêm ảnh thành công",
            };
            responseSuccess(res, newBanner, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message
            });
        }
    },
    // deleteBanner: async (req, res) => {
    //     try {
    //         const { id, imagePublicId } = req.body;
    //         if (imagePublicId) {
    //             const deleteImage = await deleteFromCloudinary(imagePublicId);
    //             if (deleteImage.result !== "ok") {
    //                 return res.status(ErrorCodes.Internal).send(ErrorMessages.Generic);
    //             }
    //         }
    //         await Banner.findByIdAndDelete(id);
    //         res.json({ message: "Xóa ảnh quảng cáo thành công" });
    //     } catch (error) {
    //         return res.status(500).json({ message: error.message });
    //     }
    // },
    updateStatus: async (req, res) => {
        try {
            const statusDelete = false;
            const { id } = req.params;
            const updateStatus = await Banner.findOneAndUpdate(
                { _id: id },
                { status: statusDelete },
                { new: true }
            );
            const status = {
                code: 200,
                suscess: true,
                message: "Xóa banner thành công",
            };
            responseSuccess(res, updateStatus, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message
            });
        }
    },
    updateDoUuTien: async (req, res) => {
        try {
            const { data } = req.body;
            const parserData = JSON.parse(data);
            const { id, imageToDeletePublicId, doUuTien, } = parserData;
            const file = req.file;
            if (imageToDeletePublicId) {
                const deleteImage = await deleteFromCloudinary(imageToDeletePublicId);
                if (deleteImage.result !== "ok") {
                    return res.status(500).send({ message: "Xóa ảnh thất bại" });
                }
            }
            let imageUrl;
            let imagePublicId;
            if (file) {
                const uploadImage = await uploadToCloudinary(file, "image");
                if (!uploadImage.secure_url) {
                    return res.status(500).send({ message: "Tải ảnh không thành công" });
                }
                imageUrl = uploadImage.secure_url;
                imagePublicId = uploadImage.public_id;
            }
            const cloneNew = {
                doUuTien
            };
            const image = await Banner.findOneAndUpdate(
                { _id: id },
                { ...cloneNew, imageBanner: imageUrl, imagePublicId: imagePublicId },
                { new: true }
            );
            const status = {
                code: 200,
                suscess: true,
                message: "cập nhật thành công",
            };
            responseSuccess(res, image, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message,
            });
        }
    },


};
module.exports = BannerController;