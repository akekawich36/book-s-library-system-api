const express = require("express");
const SystemRouter = express.Router();
const controller = require("../controllers");

// Categories
SystemRouter.post("/system/categories", controller.categories.createCategory);
SystemRouter.get("/system/categories", controller.categories.getCategories);

// Members
SystemRouter.post("/system/members", controller.members.createMember);

// Books
SystemRouter.post("/system/books", controller.books.createBook);
SystemRouter.put("/system/books/:id", controller.books.updateBook);
SystemRouter.delete("/system/books/:id", controller.books.deleteBook);
SystemRouter.get("/system/books", controller.books.getBookList);
SystemRouter.get("/system/books/:id", controller.books.getBookById);

// Borrow Book
SystemRouter.post("/system/borrow", controller.borrow.borrowBook);
SystemRouter.put("/system/borrow", controller.borrow.returnBook);

module.exports = SystemRouter;
