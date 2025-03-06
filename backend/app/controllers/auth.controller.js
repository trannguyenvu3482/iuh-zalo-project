const db = require("../models");
const config = require("../config/auth.config");
const { User } = require("../models");
const { Op } = require("sequelize");
const QRCode = require("qrcode");
const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { assignRolesToUser } = require("../services/auth.service");

const pendingLogins = {};

exports.signup = async (req, res) => {
  try {
    console.log(User);

    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      fullname: req.body.fullname,
      phoneNumber: req.body.phoneNumber,
    });

    await assignRolesToUser(user, req.body.roles);
    const roles = await user.getRoles();

    res.send({
      code: 1,
      message: "User registered successfully!",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: roles.map((role) => role.name),
        updated_at: user.updated_at,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).send({ message: err.message });
  }
};

exports.signin = (req, res) => {
  User.findOne({
    where: {
      username: req.body.username,
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!",
        });
      }

      const token = jwt.sign({ id: user.id }, config.secret, {
        algorithm: "HS256",
        allowInsecureKeySizes: true,
        expiresIn: 86400, // 24 hours
      });

      var authorities = [];
      user.getRoles().then((roles) => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }
        res.status(200).send({
          id: user.id,
          username: user.username,
          email: user.email,
          roles: authorities,
          accessToken: token,
        });
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.generateQR = async (req, res) => {
  // Generate a unique token (session ID)
  const sessionId = crypto.randomBytes(16).toString("hex");

  // Save it with a pending status and a timestamp (with expiry logic in production)
  pendingLogins[sessionId] = { status: "pending", createdAt: Date.now() };

  // The mobile app will call this URL after scanning
  const callbackUrl = `http://localhost:8080/auth/qr-callback?sessionId=${sessionId}`;

  try {
    // Generate QR code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(callbackUrl);
    res.json({ qrCode: qrCodeDataUrl, sessionId });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
};

exports.scanQR = async (req, res) => {
  const { sessionId, accessToken } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: "Invalid or expired sessionId" });
  }

  // Here you would add further checks if needed (e.g., verifying the userId)
  jwt.verify(accessToken, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Invalid access token!",
      });
    }

    // Mark the login session as completed and attach user info
    pendingLogins[sessionId] = {
      status: "completed",
      completedAt: Date.now(),
    };

    // Get the user info from the decoded id
    User.findByPk(decoded.id).then((user) => {
      res.json({
        code: 1,
        message: "Login with QR code successful!",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            token: accessToken,
          },
        },
      });
    });
  });
};
