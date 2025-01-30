module.exports = (sequelize, DataTypes) => {
  const login_logs = sequelize.define(
    "login_logs",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      loginAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      logoutAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("login", "logout"),
        allowNull: false,
      },
    },
    {
      tableName: "login_logs",
      timestamps: true,
      charset: "utf8",
      collate: "utf8_general_ci",
      underscored: true,
    }
  );

  login_logs.associate = (models) => {
    login_logs.belongsTo(models.users, {
      foreignKey: "userId",
    });
  };

  return login_logs;
};
