const express = require("express");
const AuthRouter = express.Router();
const controller = require("../controllers");
const authMiddleware = require("../middleware/auth");

AuthRouter.post("/auth/register", controller.auth.register);
AuthRouter.post("/auth/login", controller.auth.login);
AuthRouter.post("/auth/logout", authMiddleware, controller.auth.logout);

// for TestingOnly
AuthRouter.get("/testingData", controller.members.getDataTesting);

module.exports = AuthRouter;
