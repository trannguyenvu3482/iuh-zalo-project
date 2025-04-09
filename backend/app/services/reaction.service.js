const { Message, Reaction, User } = require("../models");
const { v4: uuidv4 } = require("uuid");
const { NotFoundError, AppError } = require("../exceptions/errors");

exports.editMessage = async (messageId, userId, newContent) => {
  try {
    const message = await Message.findByPk(messageId);
    if (!message) throw new NotFoundError("Message not found");
    if (message.sender !== userId)
      throw new ForbiddenError("Only the sender can edit this message");

    message.message = newContent;
    message.edited = true;
    await message.save();

    return message;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to edit message", 500);
  }
};

exports.addReaction = async (messageId, userId, reactionType) => {
  try {
    const message = await Message.findByPk(messageId);
    if (!message) throw new NotFoundError("Message not found");

    const reaction = await Reaction.create({
      id: uuidv4(),
      type: reactionType,
      userId,
      messageId,
    });

    return reaction;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to add reaction", 500);
  }
};

exports.getReactions = async (messageId, aggregate = false) => {
  try {
    if (aggregate) {
      const reactions = await Reaction.findAll({
        where: { messageId },
        attributes: [
          "type",
          [db.Sequelize.fn("COUNT", db.Sequelize.col("type")), "count"],
        ],
        group: ["type"],
      });
      return reactions.map((r) => ({
        type: r.type,
        count: parseInt(r.dataValues.count),
      }));
    } else {
      const reactions = await Reaction.findAll({
        where: { messageId },
        include: [{ model: User, as: "user", attributes: ["id", "username"] }],
      });
      return reactions;
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch reactions", 500);
  }
};
