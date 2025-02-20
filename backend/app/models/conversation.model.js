module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "conversations",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("PRIVATE", "GROUP"),
        allowNull: false,
        defaultValue: "PRIVATE",
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return Conversation;
};
