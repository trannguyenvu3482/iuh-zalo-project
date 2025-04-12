module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "users",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      phoneNumber: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
        validate: {
          isNumeric: {
            msg: "Phone number must be numeric",
          },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          isIn: {
            args: [["male", "female", "other"]],
            msg: "Gender must be male, female, or other",
          },
        },
      },
      birthdate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: {
            msg: "Birthdate must be a valid date",
          },
        },
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "https://picsum.photos/200/300",
        // validate: {
        //   isUrl: {
        //     msg: "Avatar must be a valid URL",
        //   },
        // },
      },
      banner: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "https://picsum.photos/1280/720",
        // validate: {
        //   isUrl: {
        //     msg: "Banner must be a valid URL",
        //   },
        // },
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return User;
};
