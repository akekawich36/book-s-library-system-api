const db = require("../../models");

export const createBook = async (req, res) => {
  let t;
  let success = true;
  let status = 200;
  let message;
  let data = null;
  try {
    const {
      isbn,
      title,
      author,
      publisher,
      publishedDate,
      description,
      language,
      pageCount,
      numberOfCopies = 1,
    } = req.body;

    const existingBook = await Book.findOne({
      where: { isbn, isDeleted: false },
    });
    if (existingBook) {
      return res.status(400).json({ error: "ISBN already exists" });
    }

    const result = await sequelize.transaction(async (t) => {
      const book = await db.books.create(
        {
          isbn,
          title,
          author,
          publisher,
          publishedDate,
          description,
          language,
          pageCount,
          isActive: true,
          createdBy: req.user.id,
        },
        { transaction: t }
      );

      const copies = Array.from({ length: numberOfCopies }, (_, index) => ({
        bookId: book.id,
        status: "available",
        isAvailable: true,
        purchaseDate: new Date(),
        condition: "new",
        createdBy: req.user.id,
      }));

      await db.book_copies.bulkCreate(copies, { transaction: t });

      return book;
    });

    res.status(201).json({
      message: "Book created successfully",
      book: result,
    });
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ error: "Error creating book" });
  }
};
