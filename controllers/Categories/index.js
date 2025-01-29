const db = require("../../models");
const { Op } = require("sequelize");
const services = require("../../services");

const createCategory = async (req, res) => {
  let t;
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(200).json({
        success: false,
        data: null,
        message: "Category name is required",
      });
    }

    if (description.length > 255) {
      return res.status(200).json({
        success: false,
        data: null,
        message: "Description must be less than 255 characters",
      });
    }

    const existingCategory = await db.categories.findOne({
      where: {
        name: { [Op.iLike]: name },
        isDeleted: false,
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Category name already exists",
      });
    }

    t = await db.sequelize.transaction();

    const category = await db.categories.create(
      {
        name,
        description,
        isActive: true,
        createdBy: req.user.id,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      data: {
        id: services.EncodeKey(category.id),
        name: category.name,
        description: category.description,
      },
      message: "Category has been created successfully",
    });
  } catch (error) {
    if (t) await t.rollback();
    return res.status(500).json({
      success: false,
      data: null,
      message: "Error creating category",
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await db.categories.findAll({
      where: {
        isDeleted: false,
        isActive: true,
      },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    const formattedCategories = categories.map((category) => ({
      label: category.name,
      value: services.EncodeKey(category.id),
    }));

    return res.status(200).json({
      success: true,
      data: formattedCategories,
      message: "Success",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
};
