const ErrorCodes = require("../constants/errorCodes");
const passport = require("passport");
const { UserRole } = require("../constants/type");

const checkIfUser = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(ErrorCodes.Un_Authorized).send("Chưa đăng nhập");
    }

    req.user = user;
    return next();
  })(req, res, next);
};

const checkIfAdmin = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(ErrorCodes.Un_Authorized).send("Chưa đăng nhập");
    }
    console.log(user);
    const isAdmin = user.role === UserRole.Admin;
    const isPersonnel = user.role === UserRole.Personnel;
    const isManager = user.role === UserRole.Manager;
    if (!isAdmin && !isPersonnel && !isManager) {
      return res
        .status(ErrorCodes.Un_Authorized)
        .send({ message: "Bạn không có quyền truy cập" });
    }
    req.user = user;
    return next();
  })(req, res, next);
};
module.exports = { checkIfUser, checkIfAdmin };
