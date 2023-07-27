const path = require("path");
const ErrorCodes = require("../constants/errorCodes");
const ErrorMessages = require("../constants/errorMessages");
const Image = require("../models/imageModel");
const Product = require("../models/productModel");
const {
    uploadToCloudinary,
    deleteFromCloudinary,
} = require("../utils/cloudinary");
const { responseSuccess } = require("../utils/responseInfo");

const ImageController = {
    list: async (req, res) => {
        try {
            let perPage = req.query.per_page || 10;
            let page = req.query.current_page || 0;

            const name = req.query.name || "";
            const filter = {
                name: { $regex: name, $options: "i" },
            };

            Image.find(filter).sort({ createdAt: -1 })
                .skip(perPage * page - perPage)
                .limit(perPage)
                .exec((err, img) => {
                    Image.countDocuments((err, count) => {
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
                        responseSuccess(res, img, meta, status);
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
    getAllImage: async (req, res) => {
        try {
            const image = await Image.find();
            const status = {
                code: 200,
                suscess: true,
                //message: "Lấy dữ liệu thành công",
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
    upLoadImage: async (req, res) => {
        try {
            const { data } = req.body;
            const parserData = JSON.parse(data);
            const { name } = parserData;

            const file = req.file;
            if (name === "") {
                res.status(205).json({ message: "Vui lòng nhập trường này" });
            }
            const imageName = await Image.findOne({ name });
            if (imageName) {
                const status = {
                    code: 201,
                    message: "Tên sản phẩm đã tồn tại"
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
                const uploadImage = await uploadToCloudinary(file, "images");
                if (!uploadImage.secure_url) {
                    return res.status(205).send({ message: "Tải ảnh thất bại" });
                }
                imageUrl = uploadImage.secure_url;
                imagePublicId = uploadImage.public_id;
            }
            const newimage = new Image({
                name,
                image: imageUrl,
                imagePublicId: imagePublicId,
            });
            await newimage.save();
            const status = {
                code: 200,
                suscess: true,
                message: "Thêm ảnh thành công",
            };
            responseSuccess(res, newimage, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message
            });
        }
    },
    upLoadMultiImage: async (req, res) => {
        try {
            const { imageMultiple } = req.body;
            const files = req.files;
            if (!files) {
                return res.status(500).send("Please upload an image.");
            }
            if (files && !files.map((item) => item.mimetype.match(/image-*/))) {
                return res.status(500).send("Please upload an image.");
            }
            const url = [];
            for (const file of files) {
                const uploadImage = uploadToCloudinary(file, "images", imageMultiple);
                url.push(uploadImage);
            }
            const urls = await Promise.all(url);
            const p = urls.map((item) => item.secure_url);
            const newimage = new Image({ imageMultiple: p });
            await newimage.save();
            res.send({
                newimage,
                message: "Tải ảnh thành công",
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    uploadStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const findProduct = await Product.find().populate([
                {
                    path: "imageChildren",
                    select: "-product"
                }
            ])
            const daTonTaiSp = findProduct.some(item => {
                if (item.imageChildren) {
                    return item.imageChildren.some(el => el._id.toString() === id?.toString());
                }
                return false;
            });

            if (daTonTaiSp) {
                return res.status(500).json({ message: "Hình ảnh đang được sử dụng" })
            }
            const statusDelete = false;

            const updateStatus = await Image.findOneAndUpdate(
                { _id: id },
                { status: statusDelete },
                { new: true }
            );
            const status = {
                code: 200,
                suscess: true,
                message: "Xóa ảnh thành công",
            };
            responseSuccess(res, findProduct, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message
            });
        }
    },
    updateImage: async (req, res) => {
        try {
            const { data } = req.body;
            const parserData = JSON.parse(data);
            const { id, imageToDeletePublicId, name, } = parserData;
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
                name
            };
            const image = await Image.findOneAndUpdate(
                { _id: id },
                { ...cloneNew, image: imageUrl, imagePublicId: imagePublicId },
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
module.exports = ImageController;
