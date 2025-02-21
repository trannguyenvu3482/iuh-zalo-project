module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "users",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      fullname: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        // validate: {
        //   isEmail: {
        //     msg: "Email is not valid",
        //   },
        // },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      // gender: {
      //   type: DataTypes.STRING(10),
      //   allowNull: false,
      //   // validate: {
      //   //   isIn: {
      //   //     args: [["male", "female"]],
      //   //     msg: "Gender must be either male or female",
      //   //   },
      //   // },
      // },
      // birthdate: {
      //   type: DataTypes.DATEONLY,
      //   allowNull: false,
      //   // validate: {
      //   //   isDate: {
      //   //     msg: "Birthdate must be a valid date",
      //   //   },
      //   //   isBefore: {
      //   //     args: [Sequelize.literal("CURRENT_DATE")],
      //   //     msg: "Birthdate must be in the past",
      //   //   },
      //   // },
      // },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return User;
};
