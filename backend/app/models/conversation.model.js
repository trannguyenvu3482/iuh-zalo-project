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
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Conversation;
};
