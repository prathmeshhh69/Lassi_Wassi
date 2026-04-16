import MenuItem from "../models/MenuItem.model.js";
import Restaurant from "../models/Restaurant.model.js";

const ensureOwner = async (user, restaurantId) => {
  if (!user) {
    return { allowed: false, status: 401, message: "Not authorized" };
  }

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return { allowed: false, status: 404, message: "Restaurant not found" };
  }

  const isOwner =
    restaurant.owner && restaurant.owner.toString() === user._id.toString();

  if (!isOwner) {
    return {
      allowed: false,
      status: 403,
      message: "Only the restaurant owner can modify this menu"
    };
  }

  return { allowed: true, restaurant };
};

export const createMenuItem = async (req, res, next) => {
  try {
    const { restaurant: restaurantId, name, description, price, category, isAvailable, preparationTime, image } =
      req.body;

    if (!restaurantId || !name || typeof price === "undefined") {
      return res.status(400).json({
        success: false,
        message: "restaurant, name and price are required"
      });
    }

    const ownership = await ensureOwner(req.user, restaurantId);
    if (!ownership.allowed) {
      return res.status(ownership.status).json({
        success: false,
        message: ownership.message
      });
    }

    const menuItem = await MenuItem.create({
      restaurant: restaurantId,
      name,
      description,
      price,
      category,
      isAvailable,
      preparationTime,
      image
    });

    return res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    return next(error);
  }
};

export const getMenuByRestaurant = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId ?? req.params.id;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    const items = await MenuItem.find({ restaurant: restaurantId }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    return next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    const ownership = await ensureOwner(req.user, menuItem.restaurant);
    if (!ownership.allowed) {
      return res.status(ownership.status).json({
        success: false,
        message: ownership.message
      });
    }

    const updatableFields = [
      "name",
      "description",
      "price",
      "category",
      "isAvailable",
      "preparationTime",
      "image"
    ];

    updatableFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        menuItem[field] = req.body[field];
      }
    });

    const updated = await menuItem.save();

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    const ownership = await ensureOwner(req.user, menuItem.restaurant);
    if (!ownership.allowed) {
      return res.status(ownership.status).json({
        success: false,
        message: ownership.message
      });
    }

    await menuItem.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully"
    });
  } catch (error) {
    return next(error);
  }
};

