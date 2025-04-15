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

// Function to reset the database schema in case of OID errors
async function resetDatabaseSchema() {
  console.log("Attempting to reset database schema due to relation errors...");
  try {
    // Drop and recreate the public schema
    await sequelize.query("DROP SCHEMA public CASCADE;");
    await sequelize.query("CREATE SCHEMA public;");

    // Grant privileges
    await sequelize.query("GRANT ALL ON SCHEMA public TO postgres;");
    await sequelize.query("GRANT ALL ON SCHEMA public TO public;");

    console.log("Database schema reset successfully");
    return true;
  } catch (error) {
    console.error("Failed to reset database schema:", error);
    return false;
  }
}

// Function to check if a table exists in the database
async function tableExists(tableName) {
  try {
    // Query the information_schema to check if the table exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `);

    return results[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Define ROLES constant upfront
db.ROLES = ["user", "admin", "moderator"];

// Define base models first
db.User = require("../models/user.model.js")(sequelize, Sequelize.DataTypes);
db.Role = require("../models/role.model.js")(sequelize, Sequelize.DataTypes);
db.Conversation = require("../models/conversation.model.js")(
  sequelize,
  Sequelize.DataTypes
);

// User-Role relationships
db.Role.belongsToMany(db.User, { through: "user_roles" });
db.User.belongsToMany(db.Role, { through: "user_roles" });

// Define Message model before its dependencies
db.Message = require("../models/message.model.js")(
  sequelize,
  Sequelize.DataTypes
);

// Define remaining models
db.ConversationMember = require("../models/conversationMember.model.js")(
  sequelize,
  Sequelize.DataTypes
);
db.Friendship = require("../models/friendship.model.js")(
  sequelize,
  Sequelize.DataTypes
);
db.Reaction = require("../models/reaction.model.js")(
  sequelize,
  Sequelize.DataTypes
);

// User-User (friendship) relationships
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

// User-Conversation relationships
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

// Message relationships (depends on User and Conversation)
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

// Message self-reference relationships (for replies)
db.Message.belongsTo(db.Message, { as: "replyTo", foreignKey: "replyToId" });
db.Message.hasMany(db.Message, { as: "replies", foreignKey: "replyToId" });

// Reaction relationships (depends on Message and User)
db.Message.hasMany(db.Reaction, { foreignKey: "messageId", as: "reactions" });
db.Reaction.belongsTo(db.Message, { foreignKey: "messageId", as: "message" });
db.User.hasMany(db.Reaction, { foreignKey: "userId", as: "reactions" });
db.Reaction.belongsTo(db.User, { foreignKey: "userId", as: "user" });

// Initialize default roles for the application
async function initRoles() {
  try {
    await db.Role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" },
    ]);
    console.log("Default roles initialized successfully");
  } catch (error) {
    console.error("Error initializing roles:", error);
  }
}

// Add helper functions to db object
db.resetDatabaseSchema = resetDatabaseSchema;
db.initRoles = initRoles;
db.tableExists = tableExists;

module.exports = db;
