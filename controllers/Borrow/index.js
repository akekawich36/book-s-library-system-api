const services = require("../../services");
const db = require("../../models");
const { Op } = require("sequelize");

const borrowBook = async (req, res) => {
  let t;
  try {
    const { memberId, bookCopyId } = req.body;

    // Validate data
    if (
      !memberId ||
      !bookCopyId ||
      !Array.isArray(bookCopyId) ||
      bookCopyId.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "book copy ID are required.",
      });
    }

    // Check member
    const member = await db.members.findOne({
      where: {
        id: services.DecodeKey(memberId),
        isActive: true,
        isDeleted: false,
      },
    });

    if (!member) {
      return res.status(404).json({
        status: false,
        message: "Member not found or inactive",
      });
    }

    const booksId = bookCopyId.map((id) => services.DecodeKey(id));
    const bookCopies = await db.book_copies.findAll({
      where: {
        id: { [Op.in]: booksId },
      },
    });

    // Check Book Copies
    if (bookCopies.length !== booksId.length) {
      return res.status(404).json({
        success: false,
        message: "Some book not found",
      });
    }

    const unavailableBooks = bookCopies.filter((book) => !book.isAvailable);
    if (unavailableBooks.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Some book not avaliable",
        unavailableBookIds: unavailableBooks.map((book) =>
          services.EncodeKey(book.id)
        ),
      });
    }

    const _borrowBooks = booksId.map((id) => {
      return {
        memberId: services.DecodeKey(memberId),
        bookCopyId: id,
        borrowDate: new Date(),
        status: "borrowed",
        createdBy: req.user.id,
      };
    });

    t = await db.sequelize.transaction();
    await db.member_borrow.bulkCreate(_borrowBooks, {
      transaction: t,
    });

    // Update Book Status
    await db.book_copies.update(
      {
        isAvailable: false,
        updatedBy: req.user.id,
        status: "used",
      },
      {
        where: {
          id: { [Op.in]: booksId },
        },
        transaction: t,
      }
    );

    await t.commit();
    return res.status(200).json({
      status: true,
      message: "Book borrowed successfully",
    });
  } catch (error) {
    if (t) await t.rollback();
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const returnBook = async (req, res) => {
  let t;
  let message = "Book has been returned";
  let data;
  try {
    const { booksReturn, memberId } = req.body;

    if (booksReturn.length == 0) {
      return res
        .status(404)
        .json({ message: "Book return not found", status: false });
    }

    if (!memberId)
      return res
        .status(404)
        .json({ message: "member not found", status: false });

    const bookdsId = booksReturn.map((book) => services.DecodeKey(book.id));
    // find borrow data
    const _borrow = await db.member_borrow.findAll({
      attributes: ["id"],
      where: {
        memberId: services.DecodeKey(memberId),
        status: "borrowed",
      },
      include: [
        {
          attributes: ["id"],
          model: db.book_copies,
          include: [
            {
              attributes: ["id", "title"],
              model: db.books,
            },
          ],
        },
      ],
    });

    if (_borrow.length == 0) {
      return res.json({ message: "No book borrowed", status: false });
    }

    // filter only book return
    const bookReturned = _borrow.filter((item) =>
      bookdsId.some((id) => id == item.book_copy.id)
    );

    // filter book not return
    const bookNotReturned = _borrow.filter(
      (item) => !bookdsId.some((id) => id == item.book_copy.id)
    );

    if (bookNotReturned.length > 0) {
      message += ", Some book not return";
      data = bookNotReturned.map((item) => item.book_copy.book.title);
    }

    t = await db.sequelize.transaction();
    await db.member_borrow.update(
      {
        returnDate: new Date(),
        status: "returned",
        updatedBy: req.user.id,
      },
      {
        where: {
          id: { [Op.in]: bookReturned.map((item) => item.id) },
        },
        transaction: t,
      }
    );

    for (let book of booksReturn) {
      const bookId = services.DecodeKey(book.id);
      if (bookReturned.some((item) => item.book_copy.id === bookId)) {
        await db.book_copies.update(
          {
            isAvailable: true,
            status: book.status ? book.status : "new",
            condition: book.condition,
            updatedBy: req.user.id,
          },
          {
            where: {
              id: services.DecodeKey(book.id),
            },
            transaction: t,
          }
        );
      }
    }

    await t.commit();
    return res.status(200).json({
      status: true,
      message,
      bookNotReturn: data,
    });
  } catch (error) {
    if (t) await t.rollback();
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  borrowBook,
  returnBook,
};
