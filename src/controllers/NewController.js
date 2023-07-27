const New = require("../models/newModel");
const { responseSuccess, responseError } = require("../utils/responseInfo");
const {
    uploadToCloudinary,
    deleteFromCloudinary,
} = require("../utils/cloudinary");
const NewController = {
    list: async (req, res) => {
        try {
            let perPage = req.query.per_page || 10; // số lượng sản phẩm xuất hiện trên 1 page
            let page = req.query.current_page || 0;

            const name = req.query.name || "";
            const filter = {
                title: { $regex: name, $options: "i" },
            };
            New.find(filter).sort({ createdAt: -1 }) // find tất cả các data
                .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
                .limit(perPage)
                .exec((err, news) => {
                    New.countDocuments((err, count) => {
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
                        responseSuccess(res, news, meta, status);
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
    getByIdNew: async (req, res) => {
        try {
            const { id } = req.params;
            const news = await New.findById(id)
            const status = {
                code: 200,
                suscess: true,
                //message: "Lấy dữ liệu thành công",
            };
            responseSuccess(res, news, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message,
            });
        }
    },
    createNew: async (req, res) => {
        try {

            const { data } = req.body;
            const parserData = JSON.parse(data);
            const { title, content, slug } = parserData;
            const file = req.file;
            if (title === "" || content === "" || slug === "") {
                res.status(205).json({ message: "Vui lòng nhập trường này" });
            }
            if (!file) {
                return res.status(205).send("Vui lòng tải ảnh lên");
            }
            if (file && !file.mimetype.match(/image-*/)) {
                return res.status(205).send("Ảnh không đúng định dạng");
            }
            const titleNews = await New.findOne({ title });
            if (titleNews) {
                const status = {
                    code: 201,
                    message: "Tên bài viết đã tồn tại"
                }
                return responseSuccess(res, null, null, status)
            }
            let imageUrl;
            let imagePublicId;
            if (file) {
                const uploadImage = await uploadToCloudinary(file, "news");
                if (!uploadImage.secure_url) {
                    return res.status(205).send({ message: "Tải ảnh thất bại" });
                }
                imageUrl = uploadImage.secure_url;
                imagePublicId = uploadImage.public_id;
            }
            const cloneNew = {
                title,
                content,
                slug,
            };
            const newPost = new New({
                ...cloneNew,
                imageNew: imageUrl,
                imagePublicId: imagePublicId,
            });
            await newPost.save();
            const status = {
                code: 200,
                suscess: true,
                message: "Tạo bài viết thành công",
            };
            responseSuccess(res, newPost, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message,
            });
        }
    },
    updateNew: async (req, res) => {
        //test postman paser JSON
        try {
            const { data } = req.body;
            const parserData = JSON.parse(data);
            const { id, imageToDeletePublicId, title, content, slug } =
                parserData;
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
                const uploadImage = await uploadToCloudinary(file, "news");
                if (!uploadImage.secure_url) {
                    return res.status(500).send({ message: "Tải ảnh không thành công" });
                }
                imageUrl = uploadImage.secure_url;
                imagePublicId = uploadImage.public_id;
            }
            const cloneNew = {
                title,
                content,
                slug,
            };
            const news = await New.findOneAndUpdate(
                { _id: id },
                { ...cloneNew, imageNew: imageUrl, imagePublicId: imagePublicId },
                { new: true }
            );
            const status = {
                code: 200,
                suscess: true,
                message: "cập nhật thành công",
            };
            responseSuccess(res, news, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message,
            });
        }

    },
    updateStatus: async (req, res) => {
        try {
            const statusDelete = false;
            const { id } = req.params;
            const updateStatus = await New.findOneAndUpdate(
                { _id: id },
                { status: statusDelete },
                { new: true }
            );
            const status = {
                code: 200,
                //suscess: true,
                message: "Xóa bài viết thành công",
            };
            responseSuccess(res, updateStatus, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message
            });
        }
    }



}

module.exports = NewController;