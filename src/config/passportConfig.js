const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const initPassport = () => {
  passport.use(
    "signup",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        const { fullName } = req.body;
        try {
          const user = new User({
            fullName,
            email,
            password,
          });
          return done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  passport.use(
    "login",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email });

          if (!user) {
            return done(null, false, {
              message: "A user with a given email has not been found.",
            });
          }
          //validate password
          if (password.length < 6) {
            return res
              .status(400)
              .json({ msg: "Password is at least 6 characters long" });
          }
          //Kiểm tra password nhập vào với pass của user đã lưu
          const match = await bcrypt.compare(password, user.password);
          if (!match) {
            return done(null, false, {
              message:
                "Your email and password combination does not match an account.",
            });
          }

          return done(null, user, { message: "Logged in Successfully." });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.SECRET,
      },
      async (token, done) => {
        try {
          const authUser = await User.findOne({ email: token.user.email });
          return done(null, authUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

module.exports = { initPassport };
