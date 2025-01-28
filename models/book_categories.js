module.exports = (sequelize, DataTypes) => {
  const book_categories = sequelize.define(
    "book_categories",
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
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "book_categories",
      timestamps: true,
      charset: "utf8",
      collate: "utf8_general_ci",
      underscored: true,
    }
  );

  book_categories.associate = (models) => {
    book_categories.hasMany(models.books, {
      foreignKey: "bookId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    book_categories.belongsTo(models.categories, {
      foreignKey: "categoryId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return book_categories;
};
