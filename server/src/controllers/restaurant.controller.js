import Restaurant from "../models/Restaurant.model.js";

const buildRestaurantResponse = (restaurant) => {
  if (!restaurant) return null;
  return restaurant;
};

export const createRestaurant = async (req, res, next) => {
  try {
    const { name, description, address, location, openingTime, closingTime } =
      req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    if (!["admin", "owner"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admins or restaurant owners can create restaurants"
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Restaurant name is required"
      });
    }

    const payload = {
      name,
      description,
      address,
      openingTime,
      closingTime,
      owner: req.user._id
    };

    if (location && Array.isArray(location.coordinates)) {
      payload.location = {
        type: "Point",
        coordinates: location.coordinates
      };
    }

    const restaurant = await Restaurant.create(payload);

    return res.status(201).json({
      success: true,
      data: buildRestaurantResponse(restaurant)
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllRestaurants = async (req, res, next) => {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Restaurant.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: restaurants,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getSingleRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: buildRestaurantResponse(restaurant)
    });
  } catch (error) {
    return next(error);
  }
};

export const updateRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    const isOwner =
      restaurant.owner &&
      restaurant.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only the owner or an admin can update this restaurant"
      });
    }

    const updatableFields = [
      "name",
      "description",
      "address",
      "location",
      "openingTime",
      "closingTime",
      "isOpen",
      "averagePreparationTime",
      "rating"
    ];

    updatableFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        if (field === "location" && req.body.location?.coordinates) {
          restaurant.location = {
            type: "Point",
            coordinates: req.body.location.coordinates
          };
        } else {
          restaurant[field] = req.body[field];
        }
      }
    });

    const updated = await restaurant.save();

    return res.status(200).json({
      success: true,
      data: buildRestaurantResponse(updated)
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteRestaurant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete restaurants"
      });
    }

    const { id } = req.params;

    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Restaurant deleted successfully"
    });
  } catch (error) {
    return next(error);
  }
};

