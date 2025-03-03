const db = require("../../models");
const services = require("../../services");
const { Op } = require("sequelize");
const moment = require("moment");

const createBook = async (req, res) => {
  let t;
  try {
    const {
      bookCode,
      title,
      author,
      publisher,
      publishedDate,
      description,
      language = "English",
      pageCount,
      categories = [],
      numberOfCopies = 1,
    } = req.body;

    if (!bookCode || !title || !author) {
      return res.status(400).json({
        success: false,
        message: "bookCode, title, and author are required",
      });
    }

    const existingBook = await db.books.findOne({
      where: { bookCode, isDeleted: false },
    });

    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: "Book code already exists",
      });
    }

    const bookFormatted = {
      bookCode,
      title,
      author,
      publisher,
      publishedDate,
      description,
      language,
      pageCount,
      isActive: true,
      createdBy: req.user.id,
      book_copies: Array.from({ length: numberOfCopies }, (_, index) => ({
        copyNumber: `${bookCode}-${index + 1}`,
        isAvailable: true,
        createdBy: req.user.id,
      })),
      book_categories:
        categories.length > 0
          ? categories.map((category) => ({
              categoryId: services.DecodeKey(category.value),
              createdBy: req.user.id,
            }))
          : [],
    };

    t = await db.sequelize.transaction();
    const bookCreated = await db.books.create(bookFormatted, {
      include: [{ model: db.book_copies }, { model: db.book_categories }],
      transaction: t,
    });
    await t.commit();

    const responseData = {
      id: services.EncodeKey(bookCreated.id),
      bookCode: bookCreated.bookCode,
      title: bookCreated.title,
      author: bookCreated.author,
      publisher: bookCreated.publisher,
      publishedDate: bookCreated.publishedDate,
      description: bookCreated.description,
      language: bookCreated.language,
      pageCount: bookCreated.pageCount,
      book_copies: bookCreated.book_copies.map((copy) => ({
        id: services.EncodeKey(copy.id),
        copyNumber: copy.copyNumber,
        status: copy.status,
        isAvailable: copy.isAvailable,
        condition: copy.condition,
      })),
    };

    res.status(201).json({
      success: true,
      data: responseData,
      message: "Book has been created!",
    });
  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({
      success: false,
      message: "Error creating book",
    });
  }
};

const updateBook = async (req, res) => {
  let t;
  try {
    const { id } = req.params;
    const {
      title,
      author,
      publisher,
      publishedDate,
      description,
      language,
      pageCount,
      categories = [],
      numberOfNewCopies = 0,
    } = req.body;

    const book = await db.books.findOne({
      where: { id: services.DecodeKey(id), isDeleted: false },
      include: [{ model: db.book_copies }],
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const updateData = {
      title,
      author,
      publisher,
      publishedDate,
      description,
      language,
      pageCount,
      updatedBy: req.user.id,
    };

    t = await db.sequelize.transaction();
    await book.update(updateData, { transaction: t });

    if (categories.length > 0) {
      await db.book_categories.destroy({
        where: { bookId: services.DecodeKey(id) },
        transaction: t,
      });

      await db.book_categories.bulkCreate(
        categories.map((category) => ({
          bookId: services.DecodeKey(id),
          categoryId: services.DecodeKey(category.value),
          createdBy: req.user.id,
        })),
        { transaction: t }
      );
    }

    if (numberOfNewCopies > 0) {
      const lastCopy = await db.book_copies.findOne({
        where: { bookId: services.DecodeKey(id) },
        order: [["copyNumber", "DESC"]],
      });

      const lastCopyNumber = parseInt(lastCopy.copyNumber.split("-")[1]);

      const newCopies = Array.from(
        { length: numberOfNewCopies },
        (_, index) => ({
          bookId: services.DecodeKey(id),
          copyNumber: `${book.bookCode}-${lastCopyNumber + index + 1}`,
          isAvailable: true,
          createdBy: req.user.id,
        })
      );

      await db.book_copies.bulkCreate(newCopies, { transaction: t });
    }

    await t.commit();
    res.status(200).json({
      success: true,
      message: "Book has been updated!",
    });
  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({
      success: false,
      message: "Error updating book",
    });
  }
};

const deleteBook = async (req, res) => {
  let t;
  try {
    const { id } = req.params;

    const book = await db.books.findOne({
      where: { id: services.DecodeKey(id), isDeleted: false },
      include: [
        {
          model: db.book_copies,
          required: false,
        },
      ],
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const borrowedCopies = book.book_copies.filter(
      (copy) => copy.member_borrow && copy.member_borrow.length > 0
    );

    if (borrowedCopies.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot Deleted Book with Borrowed",
      });
    }

    t = await db.sequelize.transaction();

    await book.update(
      {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        updatedBy: req.user.id,
      },
      { transaction: t }
    );

    await db.book_copies.update(
      {
        isDeleted: true,
        deletedAt: new Date(),
        updatedBy: req.user.id,
      },
      {
        where: { bookId: services.DecodeKey(id) },
        transaction: t,
      }
    );

    await t.commit();

    res.status(200).json({
      success: true,
      message: "Book has been deleted",
    });
  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({
      success: false,
      message: "Error deleting book",
    });
  }
};

const getBookList = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, category } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = { isDeleted: false, isActive: true };

    if (search) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { bookCode: { [Op.iLike]: `%${search}%` } },
          { title: { [Op.iLike]: `%${search}%` } },
          { author: { [Op.iLike]: `%${search}%` } },
          { publisher: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const { count, rows: books } = await db.books.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: db.book_copies,
          attributes: ["id", "copyNumber", "isAvailable", "condition"],
        },
        {
          model: db.book_categories,
          include: [
            {
              model: db.categories,
              attributes: ["name"],
              ...(category && {
                where: {
                  name: { [Op.iLike]: `%${category}%` },
                },
              }),
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    const totalPages = Math.ceil(books.length / limit);

    const formattedBooks = books.map((book) => ({
      id: services.EncodeKey(book.id),
      bookCode: book.bookCode,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      publishedDate: moment(book.publishedDate).format("DD MMM, YYYY"),
      description: book.description,
      language: book.language,
      pageCount: book.pageCount,
      categories: book.book_categories.map((cat) => cat.category.name),
      bookAvailable: book.book_copies.filter((copy) => copy.isAvailable).length,
    }));

    res.status(200).json({
      success: true,
      data: {
        books: formattedBooks,
        pagination: {
          total: books.length,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching books",
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await db.books.findOne({
      where: {
        id: services.DecodeKey(id),
        isDeleted: false,
      },
      include: [
        {
          model: db.book_copies,
          attributes: ["id", "copyNumber", "isAvailable", "status"],
          required: false,
        },
        {
          model: db.book_categories,
          include: [
            {
              model: db.categories,
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const formattedBook = {
      id: services.EncodeKey(book.id),
      bookCode: book.bookCode,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      description: book.description,
      language: book.language,
      pageCount: book.pageCount,
      categories: book.book_categories.map((cat) => cat.category.name),
      bookAvailable: book.book_copies.filter((copy) => copy.isAvailable).length,
      book_copies: book.book_copies.map((item) => {
        return {
          ...item.dataValues,
          id: services.EncodeKey(item.id),
        };
      }),
    };

    res.status(200).json({
      success: true,
      data: formattedBook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching book",
    });
  }
};

const getPopularBook = async (req, res) => {
  try {
    const popularBooks = await db.books.findAll({
      attributes: [
        "id",
        "title",
        "author",
        "description",
        [
          db.sequelize.literal(`
            (SELECT COUNT(*) 
             FROM member_borrow mb 
             JOIN book_copies bc ON mb.book_copy_id = bc.id 
             WHERE bc.book_id = books.id)
          `),
          "borrowCount",
        ],
      ],
      where: {
        isDeleted: false,
        isActive: true,
      },
      order: [["borrowCount", "DESC"]],
      limit: 10,
    });

    const _popularBooks = popularBooks.map((item) => {
      return {
        ...item.dataValues,
        id: services.EncodeKey(item.id),
      };
    });

    return res.json({ message: "success", status: _popularBooks });
  } catch (error) {
    return res.json({ message: error.message, status: false });
  }
};

module.exports = {
  createBook,
  updateBook,
  deleteBook,
  getBookList,
  getBookById,
  getPopularBook,
};
