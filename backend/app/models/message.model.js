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
        // Remove explicit references to prevent "relation 'message' does not exist" error
        // We'll handle these associations in the index.js file
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

  // Remove these associations - they'll be defined in index.js instead
  // Message.belongsTo(Message, { as: "replyTo", foreignKey: "replyToId" });
  // Message.hasMany(Message, { as: "replies", foreignKey: "replyToId" });

  return Message;
};
