const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../../models");
const services = require("../../services");

const register = async (req, res) => {
  let t;

  try {
    const { firstName, lastName, email, password } = req.body;

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email is not valid",
        data: null,
      });
    }

    const existingUser = await db.users.findOne({
      where: { email, isDeleted: false, isActive: true },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    t = await db.sequelize.transaction();
    const user = await db.users.create(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        isActive: true,
        createdBy: req.user?.id || null,
      },
      {
        transaction: t,
      }
    );

    await t.commit();
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: null,
    });
  } catch (error) {
    if (t) await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

const login = async (req, res) => {
  let t;
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        data: null,
      });
    }

    const user = await db.users.findOne({
      where: {
        email: email.toLowerCase().trim(),
        isDeleted: false,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive.",
        data: null,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect",
        data: null,
      });
    }

    t = await db.sequelize.transaction();

    if (user.activeToken) {
      await db.login_logs.update(
        { logoutAt: new Date(), status: "logout" },
        {
          where: { userId: user.id, status: "login" },
          transaction: t,
        }
      );
    }

    const token = jwt.sign(
      {
        id: services.EncodeKey(user.id),
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );

    await user.update(
      {
        lastLoginAt: new Date(),
        activeToken: token,
      },
      { transaction: t }
    );

    await db.login_logs.create(
      {
        userId: user.id,
        loginAt: new Date(),
        status: "login",
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: services.EncodeKey(user.id),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
        },
        token,
      },
    });
  } catch (error) {
    if (t) await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

const logout = async (req, res) => {
  try {
    await db.users.update(
      { activeToken: null },
      {
        where: { id: req.user.id },
      }
    );

    await db.login_logs.update(
      { logoutAt: new Date(), status: "logout" },
      {
        where: { userId: req.user.id, status: "login" },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

module.exports = {
  register,
  login,
  logout,
};
