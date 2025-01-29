const express = require("express");
const SystemRouter = express.Router();
const controller = require("../controllers");

SystemRouter.post("/system/categories", controller.categories.createCategory);

module.exports = SystemRouter;
