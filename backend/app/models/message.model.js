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
        allowNull: false,
      },
      sender: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      receiver: {
        type: DataTypes.UUID,
        allowNull: true,
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
      file: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      replyToId: {
        // New field for replying to a message
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "message", // Self-referencing
          key: "id",
        },
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Message.belongsTo(Message, { as: "replyTo", foreignKey: "replyToId" });
  Message.hasMany(Message, { as: "replies", foreignKey: "replyToId" });

  return Message;
};
