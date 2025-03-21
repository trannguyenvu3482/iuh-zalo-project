module.exports = (sequelize, DataTypes) => {
  const Friendship = sequelize.define(
    "friendship",
    {
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      friendId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Friendship;
};
