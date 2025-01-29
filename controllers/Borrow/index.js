const services = require("../../services");
const db = require("../../models");

const borrowBook = async (req, res) => {
  try {
    const { memberId, bookCopyId } = req.body;

    const member = await db.members.findOne({
      where: {
        id: memberId,
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

    const bookCopy = await db.book_copies.findOne({
      where: {
        id: services.DecodeKey(bookCopyId),
        isAvailable: true,
        isDeleted: false,
      },
      include: [
        {
          model: db.books,
          where: {
            isActive: true,
            isDeleted: false,
          },
        },
      ],
    });

    if (!bookCopy) {
      return res.status(404).json({
        status: false,
        message: "Book copy not found or unavailable",
      });
    }

    const borrow = await db.member_borrow.create({
      memberId,
      bookCopyId,
      borrowDate: new Date(),
      dueDate,
      status: "borrowed",
      createdBy: req.user.id,
    });

    await bookCopy.update({
      isAvailable: false,
      updatedBy: req.user.id,
    });

    return res.status(200).json({
      status: true,
      message: "Book borrowed successfully",
      data: borrow,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const returnBook = async (req, res) => {
  let t;
  try {
    const { borrowId, condition, status = "returned" } = req.body;

    const borrow = await services.db.member_borrow.findOne({
      where: {
        id: borrowId,
        status: "borrowed",
      },
      include: [
        {
          model: db.book_copies,
        },
      ],
    });

    if (!borrow) {
      return res.status(404).json({
        status: false,
        message: "Borrow record not found or already returned",
      });
    }

    t = await db.sequelize.transaction();
    await borrow.update({
      returnDate: new Date(),
      status: status,
      updatedBy: req.user.id,
    });

    await borrow.book_copy.update({
      isAvailable: true,
      condition: condition || borrow.book_copy.condition,
      updatedBy: req.user.id,
    });
    await t.commit();

    return res.status(200).json({
      status: true,
      message: "Book returned successfully",
      data: borrow,
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
