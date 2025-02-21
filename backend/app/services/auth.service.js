const { Op } = require("sequelize");
const { Role } = require("../models");

exports.assignRolesToUser = async (user, roles) => {
  if (roles) {
    const foundRoles = await Role.findAll({
      where: {
        name: {
          [Op.or]: roles,
        },
      },
    });
    await user.setRoles(foundRoles);
  } else {
    await user.setRoles([1]); // default role
  }
};
