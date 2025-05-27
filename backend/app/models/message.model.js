module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "message",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sender: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null for system messages
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "conversations",
          key: "id",
        },
      },
      group: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      edited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isRecalled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // Default to false
      },
      type: {
        type: DataTypes.ENUM(
          "TEXT",
          "IMAGE",
          "VIDEO",
          "FILE",
          "AUDIO",
          "SYSTEM",
          "GIF"
        ),
        allowNull: false,
        defaultValue: "TEXT",
      },
      file: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      replyToId: {
        // Self-referencing field for replying to a message
        type: DataTypes.UUID,
        allowNull: true,
      },
      isSystemMessage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      systemEventType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Message;
};
