const jwt = require("jsonwebtoken");
const db = require("../models");
const services = require("../services");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authentication token, access denied"
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.users.findOne({
        where: {
          id: services.DecodeKey(decoded.id),
          isDeleted: false,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "User account is inactive"
        });
      }

      const tokenExp = decoded.exp * 1000;
      const now = Date.now();

      if (now >= tokenExp) {
        return res.status(401).json({
          success: false,
          message: "Token has expired"
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
      };
      req.token = token;
      next();

    } catch (error) {
      throw error;
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = authMiddleware;
