require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const passport = require("passport");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const routes = require("./src/routes");
const initDb = require("./src/db/connection");
const { initPassport } = require("./src/config/passportConfig");
// const socket = require("./socket");
// const { initPassport } = require("./authentication");

initDb();
initPassport();

const app = express();
app.use(cookieParser());
app.use(compression());

app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api", routes);
const httpServer = createServer(app);

const PORT = process.env.PORT || process.env.API_PORT;
httpServer.listen({ port: PORT }, () => {
  console.log(`httpServer ready at http://localhost:${PORT}`);
});
