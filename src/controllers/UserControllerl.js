const { UserRole } = require("../constants/type");
const User = require("../models/userModel");
const { uploadToCloudinary } = require("../utils/cloudinary");
const { responseSuccess, responseError } = require("../utils/responseInfo");
const bcrypt = require("bcrypt");

const UserController = {
  list: async (req, res) => {
    try {
      let perPage = parseInt(req.query.per_page) || 10; // số lượng sản phẩm xuất hiện trên 1 page
      let page = parseInt(req.query.current_page) || 1;

      const name = req.query.name || "";

      const filter = {
        email: { $regex: name, $options: "i" },
        role: { $ne: UserRole.Admin },
      };
      const totalElements = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalElements / perPage);

      const users = await User.find(filter)
        .sort({ createdAt: -1 }) // find tất cả các data
        .skip((page - 1) * perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
        .limit(perPage);
      const meta = {
        per_page: perPage,
        totalElements,
        totalPages: totalPages, // Trừ tài khoản admin
      };
      const status = {
        code: 200,
      };
      responseSuccess(res, users, meta, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  getUserById: async (req, res) => {
    try {
      const { id } = req.query;
      const user = await User.findById(id);
      const status = {
        code: 200,
      };
      responseSuccess(res, user, null, status);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  getUserByEmail: async (req, res) => {
    try {
      const { email } = req.query;
      const user = await User.findOne({ email });
      res.json(user);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  banUser: async (req, res) => { },
  uploadPhoto: async (req, res) => {
    const { imagePublicId, coverImagePublicId, isCover } = req.body;
    const authUser = req.user;
    const image = req.file;
    if (!image) {
      return res.status(500).send("Vui lòng tải ảnh lên");
    }
    if (image && !image.mimetype.match(/image-*/)) {
      return res.status(500).send("Ảnh không đúng định dạng");
    }

    const coverOrImagePublicId =
      isCover === "true" ? coverImagePublicId : imagePublicId;
    const uploadImage = await uploadToCloudinary(
      image,
      "user",
      coverOrImagePublicId
    );

    if (uploadImage.secure_url) {
      const fieldsToUpdate = {};

      if (isCover === "true") {
        fieldsToUpdate.coverImage = uploadImage.secure_url;
        fieldsToUpdate.coverImagePublicId = uploadImage.public_id;
      } else {
        fieldsToUpdate.image = uploadImage.secure_url;
        fieldsToUpdate.imagePublicId = uploadImage.public_id;
      }

      const updatedUser = await User.findOneAndUpdate(
        {
          _id: authUser._id,
        },
        fieldsToUpdate
      );
      return res.json({ user: updatedUser, message: "Lưu ảnh thành công" });
    }
    return res
      .status(500)
      .send({ message: "Lưu ảnh thất bại, vui lòng thử lại" });
  },
  updateUser: async (req, res) => {
    try {
      const {
        fullName,
        email,
        id,
        date,
        tinh,
        huyen,
        xa,
        sonha,
        phone,
        gender,
      } = req.body;
      const address = `${sonha},${xa},${huyen},${tinh}`;
      const userUpdate = await User.findOneAndUpdate(
        { _id: id },
        { fullName, email, date, address: address, gender, phone },
        { new: true }
      );
      const status = {
        code: 200,
        // suscess: true,
        message: "Cập nhật thông tin thành công",
      };
      responseSuccess(res, userUpdate, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  createUser: async (req, res) => {
    const { email, password, role, fullName, permissions } = req.body;
    try {
      // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        responseError(res, {
          code: 500,
          error: true,
          message: "Email đã tồn tại trong hệ thống",
        });
      }

      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo người dùng mới
      const newUser = new User({
        email,
        fullName,
        password: hashedPassword,
        role: role || UserRole.Personnel, // Nếu không có role được cung cấp, mặc định là UserRole.Personnel
        permissions: permissions,
      });

      // Lưu người dùng vào cơ sở dữ liệu
      await newUser.save();

      const status = {
        code: 200,
        message: "Tạo tài khoản người dùng thành công",
      };
      responseSuccess(res, newUser, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
  updateUserWithoutPassword: async (req, res) => {
    const { id, email, fullName, role, permissions } = req.body;
    try {
      // Tìm người dùng trong cơ sở dữ liệu dựa vào ID
      const user = await User.findById(id);

      // Kiểm tra xem người dùng có tồn tại hay không
      if (!user) {
        return responseError(res, {
          code: 404,
          error: true,
          message: "Người dùng không tồn tại",
        });
      }

      // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa (trừ người dùng hiện tại)
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return responseError(res, {
          code: 500,
          error: true,
          message: "Email đã tồn tại trong hệ thống",
        });
      }

      // Cập nhật thông tin người dùng
      user.email = email;
      user.fullName = fullName;
      user.role = role; // Nếu không có role được cung cấp, mặc định là UserRole.Personnel
      user.permissions = permissions;
      // Lưu người dùng vào cơ sở dữ liệu
      await user.save();

      const status = {
        code: 200,
        message: "Cập nhật thông tin người dùng thành công",
      };
      responseSuccess(res, user, null, status);
    } catch (error) {
      responseError(res, {
        code: 500,
        error: true,
        message: error.message,
      });
    }
  },
};
module.exports = UserController;
