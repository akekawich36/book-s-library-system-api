module.exports = (sequelize, DataTypes) => {
  const categories = sequelize.define(
    "categories",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
      tableName: "categories",
      timestamps: true,
      charset: "utf8",
      collate: "utf8_general_ci",
      underscored: true,
    }
  );

  categories.associate = (models) => {
    categories.hasMany(models.book_categories, {
      foreignKey: "categoryId",
      onUpdate: "CASCADE",
    });
  };

  const seedData = async () => {
    try {
      await categories.bulkCreate(
        [
          { name: "Fiction", description: "Fiction books", isActive: true },
          {
            name: "Non-Fiction",
            description: "Non-fiction books",
            isActive: true,
          },
          {
            name: "Children",
            description: "Books for children",
            isActive: true,
          },
          { name: "Science", description: "Science books", isActive: true },
          { name: "History", description: "History books", isActive: true },
          { name: "Biography", description: "Biography books", isActive: true },
          { name: "Fantasy", description: "Fantasy books", isActive: true },
          { name: "Mystery", description: "Mystery books", isActive: true },
          { name: "Thriller", description: "Thriller books", isActive: true },
          { name: "Romance", description: "Romance books", isActive: true },
          { name: "Novel", description: "Novel books", isActive: true },
          { name: "Poetry", description: "Poetry books", isActive: true },
          { name: "Drama", description: "Drama books", isActive: true },
          {
            name: "Short Story",
            description: "Short Story books",
            isActive: true,
          },
          {
            name: "Autobiography",
            description: "Autobiography books",
            isActive: true,
          },
        ],
        { ignoreDuplicates: true }
      );
    } catch (error) {
      console.error("Error seeding categories:", error);
    }
  };

  seedData()

  return categories;
};
