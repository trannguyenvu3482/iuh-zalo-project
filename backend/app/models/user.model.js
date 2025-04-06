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
        validate: {
          isEmail: {
            msg: "Email is not valid",
          },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
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
        defaultValue: "https://via.placeholder.com/150?text=User",
        validate: {
          isUrl: {
            msg: "Avatar must be a valid URL"
          }
        }
      },
      banner: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "https://via.placeholder.com/1200x300?text=Banner",
        validate: {
          isUrl: {
            msg: "Banner must be a valid URL"
          }
        }
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