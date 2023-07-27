const Product = require("../models/productModel");
const Size = require("../models/sizeModel");
const { responseSuccess, responseError } = require("../utils/responseInfo");

const SizeController = {
  list: async (req, res) => {
    try {
      let perPage = req.query.per_page || 10; // số lượng sản phẩm xuất hiện trên 1 page
      let page = req.query.current_page || 0;

      const name = req.query.name || "";
      const filter = {
        name: { $regex: name, $options: "i" },
      };

      Size.find(filter).sort({ name: 1 }) // find tất cả các data
        .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
        .limit(perPage)
        .exec((err, size) => {
          Size.countDocuments((err, count) => {
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
            responseSuccess(res, size, meta, status);
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
  getAllSize: async (req, res) => {
    try {
      const size = await Size.find({ status: true }).sort({ name: 1 });
      const status = {
        code: 200,
        suscess: true,
        //message: "Lấy dữ liệu thành công",
      };
      responseSuccess(res, size, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  createSize: async (req, res) => {
    try {
      const { name } = req.body;
      const size = await Size.findOne({ name });
      if (size) {
        responseError(res, {
          code: 201,
          error: true,
          message: "Size đã tồn tại",
        });
      }
      const newSize = new Size({ name });
      await newSize.save();
      const status = {
        code: 200,
        suscess: true,
        message: "Tạo size thành công",
      };
      responseSuccess(res, newSize, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  // deleteSize: async (req, res) => {
  //     try {
  //         const { id } = req.params;
  //         const size = await Size.findById(id);
  //         if (size?.products.length > 0) {
  //             return res
  //                 .status(400)
  //                 .send("Vui lòng xóa tất cả các sản phẩm chứa trong size");
  //         } else {
  //             await Size.findByIdAndRemove(id);
  //             res.json({ message: "Xóa size thành công!" });
  //         }
  //     } catch (error) {
  //         return res.status(500).json({ message: error.message });
  //     }
  // },
  updateSize: async (req, res) => {
    try {
      const { name, id } = req.body;
      const updateSize = await Size.findOneAndUpdate(
        { _id: id },
        { name },
        { new: true }
      );
      const status = {
        code: 200,
        suscess: true,
        message: "Cập nhật size thành công",
      };
      responseSuccess(res, updateSize, null, status);
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

      const { id } = req.params;
      const findProduct = await Product.find().populate([
        {
          path: "colors",
          select: "-product",
          populate: {
            path: "sizes"
          }
        }
      ])
      const daTonTaiSp = findProduct.some(item => {
        if (item.colors) {
          return item.colors.some(color => {
            if (color.sizes) {
              return color.sizes.some(size => size.size._id.toString() === id.toString())
            }
            return false
          });
        }
        return false;
      });
      console.log(daTonTaiSp);

      if (daTonTaiSp) {
        return res.status(500).json({ message: "Size sắc đang được sử dụng" })
      }

      const statusDelete = false;

      const updateStatus = await Size.findOneAndUpdate(
        { _id: id },
        { status: statusDelete },
        { new: true }
      );
      const status = {
        code: 200,
        suscess: true,
        message: "Xóa size thành công",
      };
      responseSuccess(res, findProduct, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
};
module.exports = SizeController;
