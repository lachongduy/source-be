const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      trim: true,
    },

    danhmuc: {
      type: Schema.Types.ObjectId,
      ref: "Danhmuc",
    },
    imageChildren: [
      {
        type: Schema.Types.ObjectId,
        ref: "Image",
      },
    ],
    colors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Color",
      },
    ],
    typeProduct: {
      type: Schema.Types.ObjectId,
      ref: "TypeProduct",
    },
    imageProduct: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    soluong_sanpham: {
      type: Number,
      default: 0,
    },
    soluong_daban: {
      type: Number,
      default: 0,
    },
    mota: {
      type: String,
      require: true,
    },
    discount: {
      type: Number,
    },
    price_discount: {
      type: Number,
      default: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
