const Order = require("../models/orderModel");
const mongoose = require("mongoose");
const { responseSuccess, responseError } = require("../utils/responseInfo");
const Color = require("../models/colorModel");
const path = require('path');
const xlsx = require("xlsx");
const fs = require("fs");


const OrderController = {

    list: async (req, res) => {
        try {
            let perPage = req.query.per_page || 10; // số lượng sản phẩm xuất hiện trên 1 page
            let page = req.query.current_page || 0;

            const orderStatus = req.query.orderStatus || "all";
            let statusFilter = {};
            if (orderStatus !== "all") {
                //  status không phải là "all", tạo điều kiện lọc tương ứng
                switch (orderStatus) {
                    case "0":
                        statusFilter.orderStatus = 0;
                        break;
                    case "1":
                        statusFilter.orderStatus = 1;
                        break;
                    case "2":
                        statusFilter.orderStatus = 2;
                        break;
                    case "3":
                        statusFilter.orderStatus = 3;
                        break;
                    default:
                        break;
                }
            }
            const name = req.query.name || "";
            const filter = {
                ...statusFilter,
                order_id: { $regex: name, $options: "i" },
            };
            Order.find(filter).sort({ updatedAt: -1 })
                .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
                .limit(perPage)
                .exec((err, order) => {
                    Order.countDocuments(filter, (err, count) => {
                        if (err) return next(err);
                        const meta = {
                            per_page: perPage,
                            totalElements: count,
                            totalPages: Math.ceil(count / perPage),
                        };
                        const status = {
                            code: 200,
                            // suscess: true,
                            // message: "Lấy dữ liệu thành công",
                        };
                        responseSuccess(res, order, meta, status);
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
    createOder: async (req, res) => {
        try {
            const {
                order_id,
                fullName,
                email,
                phone,
                tinh,
                huyen,
                xa,
                sonha,
                hinhThucThanhToan,
                product_total,
                price_total,
                cart,
                user_id,
            } = req.body;
            const address = `${sonha},${xa}, ${huyen}, ${tinh}`;
            const cloneValues = {
                order_id: order_id,
                fullName: fullName,
                phone: phone,
                email: email,
                address: address,
                total_product: product_total,
                total_price: price_total,
                user: user_id,
                cart: cart,
                hinhThucThanhToan
            };
            const newOrder = new Order(cloneValues);
            await newOrder.save();
            const status = {
                code: 200,
                //suscess: true,
                message: "Tạo đơn hàng thành công",
            };
            responseSuccess(res, newOrder, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message,
            });
        }
    },
    getAllOrderByUser: async (req, res, next) => {
        try {
            let perPage = req.query.per_page || 10; // số lượng sản phẩm xuất hiện trên 1 page
            let page = req.query.current_page || 0;

            const user_id = req.query.user_id || "";
            const order_id = req.query.order_id || "";

            if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
                return responseError(res, {
                    code: 400,
                    error: true,
                    message: "Invalid user_id parameter",
                });
            }

            const filter = {
                user: mongoose.Types.ObjectId(user_id),
                order_id: { $regex: order_id, $options: "i" },
            };

            const totalElements = await Order.countDocuments(filter);

            const orders = await Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(perPage * page)
                .limit(Number(perPage));

            const totalPages = Math.ceil(totalElements / perPage);
            const meta = {
                per_page: Number(perPage),
                totalElements,
                totalPages,
            };
            const status = {
                code: 200,
                // suscess: true,
                // message: "Lấy dữ liệu thành công",
            };
            responseSuccess(res, orders, meta, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: error.message,
            });
        }
    },
    // status = 0 => mặc định
    // status = 1 => Admin duyệt đơn hàng thành công
    // status = 2 => User hủy đơn hàng
    // status = 3 => Admin không duyệt đơn hàng
    updateStatusCancelOfUser: async (req, res) => {
        try {
            const statusDelete = 2;
            const { id } = req.params;
            const { lyDoHuy } = req.body;
            const file = req.file;
            if (lyDoHuy === "") {
                res.status(205).json({ message: "Vui lòng nhập lý do hủy đơn hàng" });
            }
            const updateStatus = await Order.findOneAndUpdate(
                { _id: id },
                { lyDoHuy: lyDoHuy, orderStatus: statusDelete },
                { new: true }
            );
            const status = {
                code: 200,
                //suscess: true, 
                message: "Hủy đơn hàng thành công",
            };
            responseSuccess(res, updateStatus, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: "Có lỗi trong quá trình hủy đơn hàng",
            });
        }
    },
    updateStatusCancelOrderAdmin: async (req, res) => {
        try {
            const statusDelete = 3;
            const { id } = req.params;
            const updateStatus = await Order.findOneAndUpdate(
                { _id: id },
                { orderStatus: statusDelete },
                { new: true }
            );
            const status = {
                code: 200,
                //suscess: true,
                message: "Đơn hàng đã không được duyệt",
            };
            responseSuccess(res, updateStatus, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: "Có lỗi trong quá trình duyệt đơn hàng",
            });
        }
    },
    updateStatusSuccessOfAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            // const finByProduct = await 
            // Tìm đơn hàng theo order_id và cập nhật orderStatus là 1
            const updatedOrder = await Order.findByIdAndUpdate(
                { _id: id },
                { orderStatus: 1, },

                { new: true }
            );
            // Lấy thông tin color và size từ đơn hàng
            const { cart } = updatedOrder;
            const colorIds = cart.map((item) => item.colors._id);
            // Tìm các màu trong model Color có trùng khớp với colorIds
            const sizeIds = cart.map((item) => item.sizes.size._id);
            const colorsToUpdate = await Color.find({
                _id: { $in: colorIds },
                "sizes.size": { $in: sizeIds.map((id) => mongoose.Types.ObjectId(id)) }
            })
            // Cập nhật số lượng size trong mỗi màu
            colorsToUpdate.forEach(async (color) => {
                const updatedSizes = color.sizes.map((size) => {
                    const cartItem = cart.find(
                        (item) => item.colors._id.toString() === color._id.toString() && item.sizes.size._id.toString() === size.size._id.toString()
                    );
                    if (cartItem) {
                        return {
                            size: size.size._id,
                            quantity: size.quantity - cartItem.cartQuantity,
                        };
                    }
                    return size;
                });
                // Cập nhật số lượng size trong màu
                await Color.findByIdAndUpdate(color._id, { sizes: updatedSizes });
            });

            const status = {
                code: 200,
                //suscess: true,
                message: "Đơn hàng đã được duyệt thành công",
            };
            responseSuccess(res, updatedOrder, null, status);
        } catch (error) {
            responseError(res, {
                code: 500,
                error: true,
                message: "Có lỗi trong quá trình duyệt đơn hàng",
            });
        }
    },
    ExportExCel: async (req, res) => {
        try {
            const orderStatus = req.query.orderStatus || "all";
            let statusFilter = {};
            if (orderStatus !== "all") {
                //  status không phải là "all", tạo điều kiện lọc tương ứng
                switch (orderStatus) {
                    case "0":
                        statusFilter.orderStatus = 0;
                        break;
                    case "1":
                        statusFilter.orderStatus = 1;
                        break;
                    case "2":
                        statusFilter.orderStatus = 2;
                        break;
                    case "3":
                        statusFilter.orderStatus = 3;
                        break;
                    default:
                        break;
                }
            }
            const name = req.query.name || "";
            const filter = {
                ...statusFilter,
                order_id: { $regex: name, $options: "i" },
            };
            const orders = await Order.find(filter);
            const workSheetColumnNames = [
                "Mã đơn hàng",
                "Tên người nhận",
                "Số điện thoại",
                "Email",
                "Địa chỉ",
                "Số lượng sản phẩm",
                "Tổng tiền",
                "Thời gian đặt hàng",
                "Hình thức thanh toán",
                "Tình trạng đơn hàng",
            ];
            const workSheetName = "Đơn đặt hàng";
            const data = orders.map((order) => {
                return [
                    order.order_id,
                    order.fullName,
                    order.phone,
                    order.email,
                    order.address,
                    order.total_product,
                    order.total_price,
                    order.createdAt,
                    order.hinhThucThanhToan,
                    order.orderStatus === 1
                        ? "Đã duyệt"
                        : order.orderStatus === 0
                            ? "Đang đợi duyệt"
                            : order.orderStatus === 2
                                ? "Đã hủy" : "Không duyệt"
                ];
            });
            const exportPath = path.join(__dirname, `../tmp/order.xlsx`);
            const workSheetData = [workSheetColumnNames, ...data];
            const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
            const workBook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
            xlsx.write(workBook, { bookType: "xlsx", type: "buffer" });
            xlsx.write(workBook, { bookType: "xlsx", type: "binary" });
            xlsx.writeFile(workBook, exportPath);
            res.setHeader("Content-Type", "application/force-download");
            res.setHeader("Content-Disposition", "attachment;filename=order.xlsx");
            res.download(exportPath, "order.xlsx", function (err) {
                if (err) {
                    return res.status(500).json({ message: err.message });
                }
                fs.unlinkSync(exportPath);
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

};



module.exports = OrderController;