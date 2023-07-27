const mongoose = require("mongoose");
const { TypeNew } = require("../constants/type");
const Schema = mongoose.Schema;

const newSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
    },
    imageNew: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    slug: {
      type: String,
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
const New = mongoose.model("New", newSchema);
module.exports = New;
