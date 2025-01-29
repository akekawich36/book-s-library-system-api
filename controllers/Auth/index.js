const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../../models");
const services = require("../../services");

const register = async (req, res) => {
  let t;
  let message;
  let success = true;
  let status = 200;
  let data = null;
  try {
    const { firstName, lastName, email, password } = req.body;

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password
    ) {
      status = 400;
      message = "All fields are required";
      success = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (success && !emailRegex.test(email)) {
      status = 400;
      message = "Please provide a valid email address";
      success = false;
    }

    const existingUser = await db.users.findOne({
      where: { email, isDeleted: false, isActive: true },
    });

    if (existingUser) {
      status = 400;
      message = "Email already registered";
      success = false;
    }

    if (success) {
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

      if (user.id) {
        status = 201;
        message = "User registered successfully";
      }
    }

    if (t) await t.commit();
  } catch (error) {
    if (t) await t.rollback();
    status = 500;
    success = false;
    message = "Internal server error";
  }

  res.status(status).json({
    success: success,
    message: message,
    data: data,
  });
};

const login = async (req, res) => {
  let success = true;
  let status = 200;
  let message;
  let data = null;
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      status = 400;
      message = "Email and password are required";
      success = false;
    }

    const user = await db.users.findOne({
      where: {
        email: email.toLowerCase().trim(),
        isDeleted: false,
      },
    });

    if (!user) {
      status = 404;
      message = "User not found";
      success = false;
    }

    if (success) {
      if (!user.isActive) {
        status = 401;
        message = "Account is inactive. Please contact administrator";
        success = false;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        status = 401;
        message = "Email or password is incorrect";
        success = false;
      }

      let token = null;
      if (success) {
        token = jwt.sign(
          {
            id: services.EncodeKey(user.id),
            email: user.email,
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
        );

        await user.update({
          lastLoginAt: new Date(),
        });

        status = 200;
        message = "Login successful";
        data = {
          user: {
            id: services.EncodeKey(user.id),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
          },
          token,
        };
      }
    }
  } catch (error) {
    status = 500;
    success = false;
    message = "Internal server error";
  }
  res.status(status).json({
    success: success,
    message: message,
    data: data,
  });
};

module.exports = {
  register,
  login,
};
