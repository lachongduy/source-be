const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const danhmucSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      trim: true,
      unique: true,
    },
    products: [],
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

danhmucSchema.index({ name: "text" });
const Danhmuc = mongoose.model("Danhmuc", danhmucSchema);
module.exports = Danhmuc;
