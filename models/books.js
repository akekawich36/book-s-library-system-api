module.exports = (sequelize, DataTypes) => {
  const books = sequelize.define(
    "books",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bookCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      author: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      publisher: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      publishedDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      languange: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      pageCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "books",
      timestamps: true,
      charset: "utf8",
      collate: "utf8_general_ci",
      underscored: true,
    }
  );

  books.associate = (models) => {
    books.hasMany(models.book_categories, {
      foreignKey: "bookId",
    });

    books.hasMany(models.book_copies, {
      foreignKey: "bookId",
    });
  };

  return books;
};
