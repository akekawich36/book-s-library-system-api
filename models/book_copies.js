module.exports = (sequelize, DataTypes) => {
  const book_copies = sequelize.define(
    "book_copies",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      copyNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("new", "used", "damaged"),
        allowNull: false,
        defaultValue: "new",
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      condition: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "book_copies",
      timestamps: true,
      charset: "utf8",
      collate: "utf8_general_ci",
      underscored: true,
    }
  );

  book_copies.associate = (models) => {
    book_copies.belongsTo(models.books, {
      foreignKey: "bookId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    book_copies.hasMany(models.member_borrow, {
      foreignKey: "bookCopyId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return book_copies;
};
