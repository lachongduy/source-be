const Danhmuc = require("../models/danhmucModel");
const Size = require("../models/sizeModel");
const Product = require("../models/productModel");
const TypeProduct = require("../models/typeProductModel");
const Color = require("../models/colorModel");
const { responseSuccess, responseError } = require("../utils/responseInfo");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");

const ProductController = {
  list: async (req, res) => {
    try {
      const name = req.query.name || "";
      const statusValue = req.query.status || "all"; // Lấy giá trị lọc từ tham số truy vấn "status" (mặc định là "all")

      let statusFilter = {};
      if (statusValue !== "all") {
        //  status không phải là "all", tạo điều kiện lọc tương ứng
        switch (statusValue) {
          case "hoat_dong":
            statusFilter.status = true;
            break;
          case "dung_hoat_dong":
            statusFilter.status = false;
            break;
          case "sap_het_hang":
            statusFilter.soluong_sanpham = { $lt: 5 };
            break;
          default:
            break;
        }
      }

      const filter = {
        name: { $regex: name, $options: "i" },
        ...statusFilter,
      };

      const count = await Product.countDocuments(statusFilter);
      const perPage = req.query.per_page || 10; // số lượng sản phẩm xuất hiện trên 1 page
      const totalPages = Math.ceil(count / perPage);

      const page = req.query.current_page || 1;
      const skip = perPage * (page - 1);

      const products = await Product.find(filter)
        .populate([
          {
            path: "danhmuc",
            select: "-product",
          },
          {
            path: "imageChildren",
          },
          {
            path: "colors",
            select: "-product",
            populate: {
              path: "sizes", // Populate thêm trường "sizes" trong path "colors"
            },
          },
          {
            path: "typeProduct",
            select: "-product",
          },
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage);

      const meta = {
        per_page: perPage,
        totalElements: count,
        totalPages: totalPages,
      };

      const status = {
        code: 200,
        // success: true,
      };

      responseSuccess(res, products, meta, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  getAllProduct: async (req, res) => {
    try {
      const name = req.query.name || "";
      const tenDanhMuc = req.query.tenDanhMuc || "";
      const selectedSizes = req.query.sizes ? req.query.sizes.split(",") : [];
      const fromPrice = req.query.fromPrice
        ? parseInt(req.query.fromPrice)
        : null;
      const toPrice = req.query.toPrice ? parseInt(req.query.toPrice) : null;
      const filter = {
        name: { $regex: name, $options: "i" },
      };
      if (tenDanhMuc) {
        const danhMuc = await Danhmuc.findOne({
          name: { $regex: tenDanhMuc, $options: "i" },
        });

        if (danhMuc) {
          filter["danhmuc"] = danhMuc._id;
        }
      }

      if (selectedSizes.length > 0) {
        const sizeIds = await Size.find({
          name: { $in: selectedSizes },
        }).select("_id");
        const colorIds = await Color.find({
          "sizes.size": { $in: sizeIds },
        }).select("_id");
        filter["colors"] = { $in: colorIds };
      }
      if (fromPrice !== null && toPrice !== null) {
        filter["price"] = { $gte: fromPrice, $lte: toPrice };
      } else if (fromPrice !== null) {
        filter["price"] = { $gte: fromPrice };
      } else if (toPrice !== null) {
        filter["price"] = { $lte: toPrice };
      }
      const product = await Product.find(filter)
        .populate([
          {
            path: "danhmuc",
            select: "-product",
          },
          {
            path: "imageChildren",
          },
          {
            path: "colors",
            select: "-product",
            populate: {
              path: "sizes.size", // Populate thêm trường "sizes" trong path "colors"
            },
          },
          {
            path: "typeProduct",
            select: "-product",
          },
        ])
        .sort({ createdAt: -1 });
      const status = {
        code: 200,
        // suscess: true,
        //message: "Lấy dữ liệu thành công",
      };
      responseSuccess(res, product, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },

  getByIdProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id)
        .populate([
          {
            path: "danhmuc",
            select: "-products",
          },
          {
            path: "imageChildren",
          },
          {
            path: "colors",
            select: "-products",
            populate: {
              path: "sizes.size",
              select: "-products", // Populate thêm trường "sizes" trong path "colors"
            },
          },
          {
            path: "typeProduct",
            select: "-products",
          },
        ])
        .sort({ createdAt: -1 });
      const status = {
        code: 200,
        suscess: true,
        //message: "Lấy dữ liệu thành công",
      };
      responseSuccess(res, product, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },

  createProduct: async (req, res) => {
    try {
      const { data } = req.body;
      const parserData = JSON.parse(data);
      const {
        name,
        price,
        categoryId,
        imageChildren,
        colors,
        typeProductId,
        soLuongSanPham,
        mota,
        priceDiscount,
      } = parserData;
      const file = req.file;
      let imageUrl;
      let imagePublicId;

      if (file) {
        const uploadImage = await uploadToCloudinary(file, "products");
        if (!uploadImage.secure_url) {
          return res.status(205).send({ message: "Tải ảnh thất bại" });
        }
        imageUrl = uploadImage.secure_url;
        imagePublicId = uploadImage.public_id;
      }
      const product = await Product.findOne({ name });
      if (product) return res.status(205).json("Tên sản phẩm đã tồn tại");

      const priceConvert = Number(price);
      const soLuongSanPhamConvert = Number(soLuongSanPham);
      const discount = Number(priceDiscount);
      const totalPriceAfterDiscount = Math.ceil(
        priceConvert * ((100 - discount) / 100)
      );

      const newProductAndCategory = {
        name,
        price: priceConvert,
        danhmuc: categoryId,
        imageChildren,
        imageProduct: imageUrl,
        imagePublicId: imagePublicId,
        colors,
        typeProduct: typeProductId,
        discount: priceDiscount,
        soluong_sanpham: soLuongSanPhamConvert,
        mota,
        price_discount: totalPriceAfterDiscount,
      };
      const addProduct = await new Product(newProductAndCategory).save();

      await Danhmuc.findOneAndUpdate(
        { _id: categoryId },
        { $push: { products: addProduct } }
      );
      const status = {
        code: 200,
        suscess: true,
        message: "Tạo sản phẩm thành công",
      };
      responseSuccess(res, addProduct, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  deleteProduct: async (req, res) => {
    try {
      const statusDelete = false;
      const { id } = req.params;
      // const cartOrder = await Order.find();
      // let arrayTemp = [];
      // cartOrder?.map((item) => {
      //     if (item.cart?.length > 0) {
      //         item?.cart?.filter((itemImage) => {
      //             arrayTemp.push(itemImage);
      //         });
      //     }
      // });
      // const findItem = arrayTemp?.filter(
      //     (item) => item.imagePublicId === imagePublicId
      // );
      // // const checkOrder = cartOrder.filter((item) =>
      // //   item.cart.filter((cart) => cart.product_id === id)
      // // );
      // // if (findItem.length > 0) {
      // //     return res.status(500).send("Sản phẩm đã được đặt hàng, Không thể xóa");
      // // }
      // if (imagePublicId) {
      //     const deleteImage = await deleteFromCloudinary(imagePublicId);
      //     if (deleteImage.result !== "ok") {
      //         return res.status(500).send({ message: "Error deleting image" });
      //     }
      // }
      //const product = await Product.findById(id);
      // const danhmuc = await Danhmuc.findById(product.danhmuc);
      // danhmuc.products = danhmuc.products.filter(
      //     (item) => item.product_id !== product.product_id
      // );
      // await danhmuc.save();

      const updateStatus = await Product.findOneAndUpdate(
        { _id: id },
        { status: statusDelete },
        { new: true }
      );

      const status = {
        code: 200,
        suscess: true,
        message: "Xóa sản phẩm thành công",
      };
      responseSuccess(res, updateStatus, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  updateProduct: async (req, res) => {
    try {
      const { data } = req.body;
      const parserData = JSON.parse(data);
      const {
        id,
        imageToDeletePublicId,
        name,
        price,
        categoryId,
        imageChildren,
        colors,
        typeProductId,
        soLuongSanPham,
        mota,
        priceDiscount,
        ...field
      } = parserData;
      const file = req.file;
      if (imageToDeletePublicId) {
        const deleteImage = await deleteFromCloudinary(imageToDeletePublicId);
        if (deleteImage.result !== "ok") {
          return res.status(500).send({ message: "Error deleting image" });
        }
      }
      let imageUrl;
      let imagePublicId;
      if (imageUrl && imagePublicId) {
        imageProduct = imageUrl;
        imagePublicId = imagePublicId;
      } else if (imageToDeletePublicId) {
        imageUrl = "";
        imagePublicId = "";
      }
      if (file) {
        const uploadImage = await uploadToCloudinary(file, "products");
        if (!uploadImage.secure_url) {
          return res.status(500).send({ message: "Tải ảnh thất bại" });
        }
        imageUrl = uploadImage.secure_url;
        imagePublicId = uploadImage.public_id;
      }
      const priceConvert = Number(price);
      const soLuongSanPhamConvert = Number(soLuongSanPham);
      const discount = Number(priceDiscount);
      const totalPriceAfterDiscount = Math.ceil(
        priceConvert * ((100 - discount) / 100)
      );

      const cloneProduct = {
        name,
        price: priceConvert,
        danhmuc: categoryId,
        imageChildren,
        imageProduct: imageUrl,
        imagePublicId: imagePublicId,
        colors,
        typeProduct: typeProductId,
        soluong_sanpham: soLuongSanPhamConvert,
        mota,
        discount: priceDiscount,
        price_discount: totalPriceAfterDiscount,
        ...field,
      };
      const product = await Product.findOneAndUpdate(
        { _id: id },
        {
          ...cloneProduct,
          imageProduct: imageUrl,
          imagePublicId: imagePublicId,
          price_discount: totalPriceAfterDiscount,
        },
        { new: true }
      );
      const status = {
        code: 200,
        suscess: true,
        message: "Cập nhật sản phẩm thành công",
      };
      responseSuccess(res, product, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
};

module.exports = ProductController;
