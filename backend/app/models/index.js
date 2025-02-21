const { port } = require("pg/lib/defaults.js");
const config = require("../config/db.config.js");
const Sequelize = require("sequelize");

// Setup Sequelize
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

// Setup auth tables
db.User = require("../models/user.model.js")(sequelize, Sequelize.DataTypes);
db.Role = require("../models/role.model.js")(sequelize, Sequelize.DataTypes);

db.Role.belongsToMany(db.User, {
  through: "user_roles",
});
db.User.belongsToMany(db.Role, {
  through: "user_roles",
});

db.ROLES = ["user", "admin", "moderator"];

// Setup message tables
module.exports = db;
