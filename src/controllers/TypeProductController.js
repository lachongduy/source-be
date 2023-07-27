const path = require("path");
const Product = require("../models/productModel");
const TypeProduct = require("../models/typeProductModel");
const { responseSuccess, responseError } = require("../utils/responseInfo");

const TypeProductController = {
    list: async (req, res) => {
        try {
            let perPage = req.query.per_page || 10; // số lượng sản phẩm xuất hiện trên 1 page
            let page = req.query.current_page || 0;

            const name = req.query.name || "";
            const filter = {
                name: { $regex: name, $options: "i" },
            };

            TypeProduct.find(filter).sort({ createdAt: -1 }) // find tất cả các data
                .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
                .limit(perPage)
                .exec((err, type) => {
                    TypeProduct.countDocuments((err, count) => {
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
                        responseSuccess(res, type, meta, status);
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
    getAllTypeProduct: async (req, res) => {
        try {
            const typeProduct = await TypeProduct.find({ status: true });
            const status = {
                code: 200,
                suscess: true,
                //message: "Lấy dữ liệu thành công",
            };
            responseSuccess(res, typeProduct, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message,
            });
        }
    },
    createType: async (req, res) => {
        try {
            const { name } = req.body;
            const Type = await TypeProduct.findOne({ name });
            if (Type) {
                const status = {
                    code: 201,
                    message: "Loại đã tồn tại"
                }
                return responseSuccess(res, null, null, status)
            }
            const newType = new TypeProduct({ name });
            await newType.save();
            const status = {
                code: 200,
                suscess: true,
                message: "Tạo loại thành công",
            };
            responseSuccess(res, newType, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message,
            });
        }
    },
    // deleteType: async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const type = await TypeProduct.findById(id);
    //         if (type?.products.length > 0) {
    //             return res
    //                 .status(400)
    //                 .send("Vui lòng xóa tất cả các sản phẩm chứa trong loại sản phẩm");
    //         } else {
    //             await TypeProduct.findByIdAndRemove(id);
    //             res.json({ message: "Xóa loại sản phẩm thành công!" });
    //         }
    //     } catch (error) {
    //         return res.status(500).json({ message: error.message });
    //     }
    // },
    updateType: async (req, res) => {
        try {
            const { name, id } = req.body;
            const updateType = await TypeProduct.findOneAndUpdate(
                { _id: id },
                { name },
                { new: true }
            );
            const status = {
                code: 200,
                suscess: true,
                message: "Cập nhật loại thành công",
            };
            responseSuccess(res, updateType, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message
            });
        }
    }
    ,
    updateStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const findProduct = await Product.find().populate([
                {
                    path: "typeProduct",
                    select: "-product"
                }
            ])
            const daTonTaiSp = findProduct.filter(item => item.typeProduct && item.typeProduct?.id.toString() === id?.toString());
            if (daTonTaiSp.length > 0) {
                return res.status(500).json({ message: "Loại đang được sử dụng" })
            }

            const statusDelete = false;
            const updateStatus = await TypeProduct.findOneAndUpdate(
                { _id: id },
                { status: statusDelete },
                { new: true }
            );
            const status = {
                code: 200,
                suscess: true,
                message: "Xóa loại thành công",
            };
            responseSuccess(res, findProduct, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message
            });
        }
    }


};
module.exports = TypeProductController;
