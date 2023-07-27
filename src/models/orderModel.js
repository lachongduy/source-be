const mongoose = require("mongoose");
const { hinhThucThanhToan } = require("../constants/type");
const Schema = mongoose.Schema;
const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    cart: {
      type: Array,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    total_product: {
      type: Number,
      default: 0,
    },
    total_price: {
      type: Number,
      default: 0,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    hinhThucThanhToan: {
      type: String,
      default: hinhThucThanhToan.cash,
    },
    orderStatus: {
      type: Number,
      default: 0,
    },
    isPayment: {
      type: Boolean,
      default: false,
    },
    lyDoHuy: {
      type: String,

    },
  },
  {
    timestamps: true,
  }
);
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
