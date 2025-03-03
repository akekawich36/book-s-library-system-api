const db = require("../../models");
const { Op } = require("sequelize");
const services = require("../../services");

const generateMemberCode = async () => {
  const prefix = "BLS";
  const year = (new Date().getFullYear() + 543).toString().slice(-2);

  const lastMember = await db.members.count();
  const runningNumber = (lastMember + 1).toString().padStart(4, "0");
  return `${prefix}${year}${runningNumber}`;
};

const createMember = async (req, res) => {
  let t;
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and email are required",
      });
    }

    const existingMember = await db.members.findOne({
      where: {
        email,
        isDeleted: false,
      },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const memberCode = await generateMemberCode();

    t = await db.sequelize.transaction();
    const member = await db.members.create(
      {
        memberCode,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email,
        isActive: true,
        createdBy: req.user.id,
      },
      { transaction: t }
    );

    const setDataResponse = {
      id: service.EncodeKey(member.id),
      memberCode: member.memberCode,
      firstName: member.firstName,
      lastName: member.lastName,
      fullName: member.fullName,
      email: member.email,
    };

    await t.commit();
    res.status(201).json({
      success: true,
      data: setDataResponse,
      message: "Member has been created",
    });
  } catch (error) {
    console.log("🚀 ~ createMember ~ error:", error.message);
    if (t) await t.rollback();
    res.status(500).json({
      success: false,
      message: "Error creating member",
    });
  }
};

// ------ for TestingOnly ------
const getDataTesting = async (req, res) => {
  const member = await db.members.findAll({
    attributes: ["id"],
    where: {
      isDeleted: false,
      isActive: true,
    },
  });

  const bookCopies = await db.book_copies.findAll({
    attributes: ["id", "isAvailable", "status"],
    where: {
      isDeleted: false,
    },
  });

  const categories = await db.categories.findAll({
    where: {
      isDeleted: false,
      isActive: true,
    },
    attributes: ["id", "name"],
    order: [["name", "ASC"]],
  });

  res.status(200).json({
    success: true,
    data: {
      member: member.map((item) => services.EncodeKey(item.id)),
      bookCopies: bookCopies.map((item) => {
        return {
          id: services.EncodeKey(item.id),
          isAvailable: item.isAvailable,
          status: item.status,
        };
      }),
      categories: categories.map((item) => {
        return {
          ...item.dataValues,
          id: services.EncodeKey(item.id),
        };
      }),
    },
  });
};
// ------ for TestingOnly ------

module.exports = {
  createMember,
  getDataTesting,
};
