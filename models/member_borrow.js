module.exports = (sequelize, DataTypes) => {
  const member_borrow = sequelize.define(
    "member_borrow",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      memberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bookCopyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      borrowDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      returnDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('borrowed', 'returned', 'overdue'),
        allowNull: false,
        defaultValue: 'borrowed',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: "member_borrow",
      timestamps: true,
      charset: "utf8",
      collate: "utf8_general_ci",
      underscored: true,
    }
  );

  member_borrow.associate = (models) => {
    member_borrow.belongsTo(models.members, {
      foreignKey: "memberId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    member_borrow.belongsTo(models.book_copies, {
      foreignKey: "bookCopyId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return member_borrow;
};
