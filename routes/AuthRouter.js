const express = require("express");
const AuthRouter = express.Router();
const controller = require("../controllers");

AuthRouter.post("/auth/register", controller.auth.register);
AuthRouter.post("/auth/login", controller.auth.login);

// for TestingOnly
AuthRouter.get("/testingData", controller.members.getDataTesting);

module.exports = AuthRouter;
