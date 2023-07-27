const Color = require("../models/colorModel");
const { responseSuccess, responseError } = require("../utils/responseInfo");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const Size = require("../models/sizeModel");
const Product = require("../models/productModel");
const path = require("path");
const ColorController = {
  list: async (req, res) => {
    try {
      const name = req.query.name || "";
      const statusValue = req.query.status || "all";

      let statusFilter = {};
      if (statusValue !== "all") {
        switch (statusValue) {
          case "hoat_dong":
            statusFilter.status = true;
            break;
          case "dung_hoat_dong":
            statusFilter.status = false;
            break;
          case "sap_het_hang":
            statusFilter.sizes.quantity = { $lt: 4 };
            break;
          default:
            break;
        }
      }


      const filter = {
        name: { $regex: name, $options: "i" },
        ...statusFilter,
      };

      const count = await Color.countDocuments(statusFilter);
      const perPage = req.query.per_page || 10; // số lượng sản phẩm xuất hiện trên 1 page
      const totalPages = Math.ceil(count / perPage);

      const page = req.query.current_page || 1;
      const skip = perPage * (page - 1);




      Color.find(filter)
        .sort({ createdAt: -1 })
        .populate([
          {
            path: "sizes.size",
            select: "-products",
          },
        ]) // find tất cả các data
        .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
        .limit(perPage)
        .exec((err, color) => {
          Color.countDocuments((err, count) => {
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
            responseSuccess(res, color, meta, status);
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
  getAllColor: async (req, res) => {
    try {
      const color = await Color.find().populate([
        {
          path: "sizes.size",
          select: "-products",
        },
      ]);
      const status = {
        code: 200,
        suscess: true,
        //message: "Lấy dữ liệu thành công",
      };
      responseSuccess(res, color, null, status);
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
      const { data } = req.body;
      const parserData = JSON.parse(data);
      const { name, sizeQuantities } = parserData;

      const color = await Color.findOne({ name });
      if (color) {
        responseError(res, {
          code: 201,
          error: true,
          message: "Tên màu sắc đã tồn tại",
        });
      }

      const file = req.file;
      if (name === "") {
        res.status(500).json({ message: "Vui lòng nhập trường này" });
      }
      if (!file) {
        return res.status(500).send("Vui lòng tải ảnh lên");
      }
      if (file && !file.mimetype.match(/image-*/)) {
        return res.status(500).send("Ảnh không đúng định dạng");
      }

      let imageUrl;
      let imagePublicId;
      if (file) {
        const uploadImage = await uploadToCloudinary(file, "color");
        if (!uploadImage.secure_url) {
          return res.status(500).send({ message: "Tải ảnh thất bại" });
        }
        imageUrl = uploadImage.secure_url;
        imagePublicId = uploadImage.public_id;
      }

      const newColor = new Color({
        name,
        imageColor: imageUrl,
        imagePublicId: imagePublicId,
      });

      // Lưu số lượng của từng size được chọn
      for (const { sizeId, quantity } of sizeQuantities) {
        const size = await Size.findById(sizeId);
        if (size) {
          newColor.sizes.push({ size: size._id, quantity });
        }
      }

      await newColor.save();

      await newColor.populate([
        {
          path: "sizes.size",
          select: "-products",
        },
      ]);

      const status = {
        code: 200,
        success: true,
        message: "Tạo màu sắc thành công",
      };

      responseSuccess(res, newColor, null, status);
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
      const { data } = req.body;
      const parserData = JSON.parse(data);
      const { id, name, sizeQuantities } = parserData;

      const color = await Color.findById(id);
      if (!color) {
        return responseError(res, {
          code: 404,
          error: true,
          message: "Không tìm thấy màu sắc",
        });
      }

      // Cập nhật thông tin màu sắc
      color.name = name;

      const file = req.file;
      if (file) {
        if (!file.mimetype.match(/image-*/)) {
          return res.status(500).send("Ảnh không đúng định dạng");
        }

        const uploadImage = await uploadToCloudinary(file, "color");
        if (!uploadImage.secure_url) {
          return res.status(500).send({ message: "Tải ảnh thất bại" });
        }

        // Xóa ảnh cũ trên Cloudinary nếu có
        if (color.imagePublicId) {
          await deleteFromCloudinary(color.imagePublicId);
        }

        color.imageColor = uploadImage.secure_url;
        color.imagePublicId = uploadImage.public_id;
      }

      // Xóa số lượng của tất cả size trước khi cập nhật lại
      color.sizes = [];

      // Cập nhật số lượng của từng size
      for (const { sizeId, quantity } of sizeQuantities) {
        const size = await Size.findById(sizeId);
        if (size) {
          color.sizes.push({ size: size._id, quantity });
        }
      }

      const updatedColor = await color.save({ new: true });

      await updatedColor.populate([
        {
          path: "sizes.size",
          select: "-products",
        },
      ]);

      const status = {
        code: 200,
        success: true,
        message: "Cập nhật màu sắc thành công",
      };

      responseSuccess(res, updatedColor, null, status);
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
          select: "-product"
        }
      ])

      const daTonTaiSp = findProduct.some(item => {
        if (item.colors) {
          return item.colors.some(color => color.id === id?.toString());
        }
        return false;
      });

      if (daTonTaiSp) {
        return res.status(500).json({ message: "Maù sắc đang được sử dụng" })
      }

      const statusDelete = false;

      const updateStatus = await Color.findOneAndUpdate(
        { _id: id },
        { status: statusDelete },
        { new: true }
      );
      const status = {
        code: 200,
        suscess: true,
        message: "Xóa màu thành công",
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
module.exports = ColorController;
