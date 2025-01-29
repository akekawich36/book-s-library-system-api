const Auth = require("./Auth");
const Categories = require("./Categories");
const Members = require("./Members");
const Books = require("./Books");
const Borrow = require("./Borrow");

const controller = {
  auth: Auth,
  categories: Categories,
  members: Members,
  books: Books,
  borrow: Borrow,
};

module.exports = controller;
