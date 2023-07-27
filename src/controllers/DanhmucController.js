const path = require("path");
const Danhmuc = require("../models/danhmucModel");
const Product = require("../models/productModel");
const { responseSuccess, responseError } = require("../utils/responseInfo");

const DanhmucController = {
  list: async (req, res) => {
    try {
      let perPage = req.query.per_page || 10;
      let page = req.query.current_page || 0;

      const name = req.query.name || "";
      const filter = {
        name: { $regex: name, $options: "i" },
      };
      Danhmuc.find(filter).sort({ createdAt: 1 })
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec((err, danhmuc) => {
          Danhmuc.countDocuments(filter, (err, count) => {
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
            responseSuccess(res, danhmuc, meta, status);
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
  getAllDanhmuc: async (req, res) => {
    try {
      const danhmuc = await Danhmuc.find({ status: true }).sort({ createdAt: 1 });
      const status = {
        code: 200,
        suscess: true,
        //message: "Lấy dữ liệu thành công",
      };
      responseSuccess(res, danhmuc, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },

  create: async (req, res) => {
    try {
      const { name } = req.body;
      const danhmuc = await Danhmuc.findOne({ name });
      if (danhmuc) {
        const status = {
          code: 201,
          message: "Tên sản phẩm đã tồn tại"
        }
        return responseSuccess(res, null, null, status)
      }
      const newDanhmuc = new Danhmuc({ name });
      await newDanhmuc.save();
      const status = {
        code: 200,
        suscess: true,
        message: "Tạo danh mục thành công",
      };
      responseSuccess(res, newDanhmuc, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  update: async (req, res) => {
    try {
      const { name, id } = req.body;
      const updateDanhmuc = await Danhmuc.findOneAndUpdate(
        { _id: id },
        { name },
        { new: true }
      );
      const status = {
        code: 200,
        suscess: true,
        message: "Cập nhật danh mục thành công",
      };
      responseSuccess(res, updateDanhmuc, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  // delete: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     await Danhmuc.findByIdAndRemove(id);
  //     res.json({ message: "Xóa danh mục thành công" });
  //   } catch (error) {
  //     return res.status(500).json({ message: error.message });
  //   }
  // },
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;

      const findProduct = await Product.find().populate([
        {
          path: "danhmuc",
          select: "-products",
        }
      ]);
      const tonTaiSPChuDM = findProduct.filter(item => item.danhmuc && item.danhmuc?.id.toString() === id?.toString());
      if (tonTaiSPChuDM.length > 0) {
        return res.status(500).json({ message: "Danh mục đang được sử dụng" })
      }
      const statusDelete = false;
      const updateStatus = await Danhmuc.findOneAndUpdate(
        { _id: id },
        { status: statusDelete },
        { new: true }
      );
      const status = {
        code: 200,
        suscess: true,
        message: "Xóa danh mục thành công",
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
module.exports = { DanhmucController };
