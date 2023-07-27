const multer = require("multer");
const AuthController = require("./controllers/AuthController");

const router = require("express").Router();
const { checkIfUser, checkIfAdmin } = require("./utils/projectedRoute");
const { DanhmucController } = require("./controllers/DanhmucController");
const ColorController = require("./controllers/ColorController");

const SizeController = require("./controllers/SizeController");
const TypeProductController = require("./controllers/TypeProductController");
const ImageController = require("./controllers/ImageController");
const UserController = require("./controllers/UserControllerl");
const NewController = require("./controllers/NewController");
const BannerController = require("./controllers/BannerController");
const ProductController = require("./controllers/ProductController");
const OrderController = require("./controllers/OrderController");
const DashboardController = require("./controllers/DashboardController");
//Khi sử dụng bộ nhớ lưu trữ, thông tin tệp sẽ chứa một trường được gọi là bộ đệm chứa toàn bộ tệp.
const storage = multer.memoryStorage();
const multerUpload = multer({ storage });

router.get("/", (req, res) => res.send("Hello API Ecommerce"));
/**
 * Authentication
 */
router.post("/signup", AuthController.signUp);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/reset-password", AuthController.resetPassword);
/*
 *User
 */

router.get("/user/all", UserController.list);
router.get("/user", checkIfUser, UserController.getUserByEmail);
router.get("/userbyid", UserController.getUserById);
router.post(
  "/user/upload-photo",
  [checkIfUser, multerUpload.single("image")],
  UserController.uploadPhoto
);
router.put("/user/update", UserController.updateUser);
router.post("/user/create", UserController.createUser);
router.put(
  "/user/update-without-password",
  UserController.updateUserWithoutPassword
);
/* Admin */
/*
 *Danh muc
 */
router.get("/danhmuc/search", DanhmucController.list);
router.get("/danhmuc/all", DanhmucController.getAllDanhmuc);
router.post("/danhmuc/create", checkIfAdmin, DanhmucController.create);
router.put("/danhmuc/update", checkIfAdmin, DanhmucController.update);
router.delete(
  "/danhmuc/delete/:id",
  checkIfAdmin,
  DanhmucController.updateStatus
);

/*
 *Màu
 */
router.get("/color/search", ColorController.list);
router.get("/color/all", ColorController.getAllColor);
router.post(
  "/color/create",
  [checkIfAdmin, multerUpload.single("image")],
  ColorController.create
);
router.put(
  "/color/update",
  [checkIfAdmin, multerUpload.single("image")],
  ColorController.update
);
router.delete("/color/delete/:id", checkIfAdmin, ColorController.updateStatus);

/*
 *Size
 */
router.get("/size/search", SizeController.list);
router.get("/size/all", SizeController.getAllSize);
router.post("/size/create", checkIfAdmin, SizeController.createSize);
router.put("/size/update", checkIfAdmin, SizeController.updateSize);
router.delete("/size/delete/:id", checkIfAdmin, SizeController.updateStatus);
/*
 *Type product
 */
router.get("/type/search", TypeProductController.list);
router.get("/type/all", TypeProductController.getAllTypeProduct);
router.post("/type/create", checkIfAdmin, TypeProductController.createType);
router.put("/type/update", checkIfAdmin, TypeProductController.updateType);
router.delete(
  "/type/delete/:id",
  checkIfAdmin,
  TypeProductController.updateStatus
);
/*
 *Image
 */
router.get("/image/search", ImageController.list);
router.get("/image/all", ImageController.getAllImage);
router.post(
  "/image/upload-photo",
  [checkIfAdmin, multerUpload.single("image")],
  ImageController.upLoadImage
);
router.delete("/image/delete/:id", checkIfAdmin, ImageController.uploadStatus);
router.put(
  "/image/update",
  [checkIfAdmin, multerUpload.single("image")],
  ImageController.updateImage
);
/*
 *NEW
 */
router.get("/new/search", NewController.list);
router.get("/new/getId/:id", NewController.getByIdNew);
router.post(
  "/new/create",
  [checkIfAdmin, multerUpload.single("image")],
  NewController.createNew
);
router.delete("/new/delete/:id", checkIfAdmin, NewController.updateStatus);
router.put(
  "/new/update",
  [checkIfAdmin, multerUpload.single("image")],
  NewController.updateNew
);

/*
 *Banner
 */
router.get("/banner/search", BannerController.list);
router.delete(
  "/banner/delete/:id",
  checkIfAdmin,
  BannerController.updateStatus
);
router.put(
  "/banner/update",
  [checkIfAdmin, multerUpload.single("image")],
  BannerController.updateDoUuTien
);
router.post(
  "/banner/upload",
  [checkIfAdmin, multerUpload.single("image")],
  BannerController.uploadBanner
);
/*
  Product
  */
router.get("/product/search", ProductController.list);
router.get("/product/getId/:id", ProductController.getByIdProduct);
router.get("/product/all", ProductController.getAllProduct);
router.post(
  "/product/create",
  [checkIfAdmin, multerUpload.single("image")],
  ProductController.createProduct
);
router.put(
  "/product/update",
  [checkIfAdmin, multerUpload.single("image")],
  ProductController.updateProduct
);
router.delete(
  "/product/delete/:id",
  checkIfAdmin,
  ProductController.deleteProduct
);
/*
  Order
  */
router.post("/order/create", OrderController.createOder);
router.get("/order/search", OrderController.list);
router.get("/order/byUserId", OrderController.getAllOrderByUser);
router.get("/order/excel", OrderController.ExportExCel);
// 1
router.put(
  "/order/update/:id",
  checkIfAdmin,
  OrderController.updateStatusSuccessOfAdmin
);
// 2
router.put("/order/delete/:id", OrderController.updateStatusCancelOfUser);
// 3
router.put(
  "/order/updateCancel/:id",
  checkIfAdmin,
  OrderController.updateStatusCancelOrderAdmin
);

/*
 * Dashboard
 */
router.get("/dashboard/thong-ke", DashboardController.getCountTotalOrder);
router.get("/dashboard/chart", DashboardController.getChart);
router.get("/dashboard/table", DashboardController.getTable);
module.exports = router;
