module.exports = (sequelize, DataTypes) => {
  const ConversationMember = sequelize.define(
    "conversation_members",
    {
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("CREATOR", "ADMIN", "MEMBER"),
        allowNull: false,
        defaultValue: "MEMBER", // Default to MEMBER for group chats
      },
    },
    {
      timestamps: false,
    }
  );

  return ConversationMember;
};
