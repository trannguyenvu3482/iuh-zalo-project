module.exports = (sequelize, DataTypes) => {
  const Reaction = sequelize.define(
    "reaction",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      type: {
        type: DataTypes.ENUM("LIKE", "HEART", "LAUGH", "WOW", "SAD", "ANGRY"),
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      messageId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return Reaction;
};
