const { port } = require("pg/lib/defaults.js");
const config = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  port: 6543,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Auth tables
db.User = require("../models/user.model.js")(sequelize, Sequelize.DataTypes);
db.Role = require("../models/role.model.js")(sequelize, Sequelize.DataTypes);

db.Role.belongsToMany(db.User, { through: "user_roles" });
db.User.belongsToMany(db.Role, { through: "user_roles" });

db.ROLES = ["user", "admin", "moderator"];

// Message tables
db.Message = require("../models/message.model.js")(
  sequelize,
  Sequelize.DataTypes
);
db.Conversation = require("../models/conversation.model.js")(
  sequelize,
  Sequelize.DataTypes
);
db.ConversationMember = require("../models/conversationMember.model.js")(
  sequelize,
  Sequelize.DataTypes
);
db.Reaction = require("../models/reaction.model.js")(
  sequelize,
  Sequelize.DataTypes
);
db.Friendship = require("../models/friendship.model.js")(
  sequelize,
  Sequelize.DataTypes
);

// Relationships
db.Conversation.hasMany(db.Message, {
  foreignKey: "conversationId",
  as: "messages",
});
db.Message.belongsTo(db.Conversation, {
  foreignKey: "conversationId",
  as: "conversation",
});

db.User.hasMany(db.Message, { foreignKey: "sender", as: "sentMessages" });
db.Message.belongsTo(db.User, { foreignKey: "sender", as: "senderUser" });

db.Conversation.belongsToMany(db.User, {
  through: db.ConversationMember,
  foreignKey: "conversationId",
  as: "members",
});
db.User.belongsToMany(db.Conversation, {
  through: db.ConversationMember,
  foreignKey: "userId",
  as: "conversations",
});

db.Message.hasMany(db.Reaction, { foreignKey: "messageId", as: "reactions" });
db.Reaction.belongsTo(db.Message, { foreignKey: "messageId", as: "message" });
db.User.hasMany(db.Reaction, { foreignKey: "userId", as: "reactions" });
db.Reaction.belongsTo(db.User, { foreignKey: "userId", as: "user" });

// User - User relationship
db.User.belongsToMany(db.User, {
  as: "friends",
  through: db.Friendship,
  foreignKey: "userId",
  otherKey: "friendId",
});
db.User.belongsToMany(db.User, {
  as: "friendOf",
  through: db.Friendship,
  foreignKey: "friendId",
  otherKey: "userId",
});

// Add Friendship to User associations
db.Friendship.belongsTo(db.User, { foreignKey: "userId", as: "user" });
db.Friendship.belongsTo(db.User, { foreignKey: "friendId", as: "friend" });
db.User.hasMany(db.Friendship, {
  foreignKey: "userId",
  as: "friendshipsInitiated",
});
db.User.hasMany(db.Friendship, {
  foreignKey: "friendId",
  as: "friendshipsReceived",
});

db.sequelize.sync({ force: false }).then(() => {
  console.log("Database synced");
});

module.exports = db;
