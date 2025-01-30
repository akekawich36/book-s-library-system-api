const services = require("../../services");
const db = require("../../models");

const borrowBook = async (req, res) => {
  let t;
  try {
    const { memberId, bookCopyId } = req.body;

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

    t = await db.sequelize.transaction();
    const borrow = await db.member_borrow.create({
      memberId: services.DecodeKey(memberId),
      bookCopyId: services.DecodeKey(bookCopyId),
      borrowDate: new Date(),
      status: "borrowed",
      createdBy: req.user.id,
    });

    await bookCopy.update({
      isAvailable: false,
      updatedBy: req.user.id,
      status: "used",
    });

    await t.commit();
    return res.status(200).json({
      status: true,
      message: "Book borrowed successfully",
      data: {
        id: services.EncodeKey(borrow.id),
      },
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
  try {
    const { bookCopyId, condition, bookStatus } = req.body;

    let checkBookStatus = bookStatus == "" || !bookStatus ? "new" : bookStatus;
    const borrow = await db.member_borrow.findOne({
      where: {
        bookCopyId: services.DecodeKey(bookCopyId),
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
        message: "Borrow record not found",
      });
    }

    t = await db.sequelize.transaction();
    await borrow.update(
      {
        returnDate: new Date(),
        status: "returned",
        updatedBy: req.user.id,
      },
      { transaction: t }
    );

    await borrow.book_copy.update(
      {
        isAvailable: true,
        condition: condition || borrow.book_copy.condition,
        status: checkBookStatus,
        updatedBy: req.user.id,
      },
      { transaction: t }
    );
    
    await t.commit();
    return res.status(200).json({
      status: true,
      message: "Book has been returned",
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
