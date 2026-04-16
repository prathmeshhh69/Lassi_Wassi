import mongoose from "mongoose";

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (val) => Array.isArray(val) && val.length > 0,
        message: "Order must contain at least one item"
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "out_for_delivery", "completed", "cancelled"],
      default: "pending"
    },
    orderType: {
      type: String,
      enum: ["instant", "pre-order"],
      default: "instant"
    },
    fulfillmentType: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery"
    },
    scheduledTime: {
      type: Date,
      default: null
    },
    estimatedReadyTime: {
      type: Date
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },
    deliveryAddress: {
      street:  { type: String, default: "" },
      city:    { type: String, default: "" },
      pincode: { type: String, default: "" },
      notes:   { type: String, default: "" }
    },
    estimatedDeliveryTime: {
      type: Date
    },
    specialInstructions: {
      type: String,
      default: "",
      trim: true,
      maxLength: 300
    }
  },
  {
    timestamps: true
  }
);

const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);

// Compound index for efficient pre-order slot queries
orderSchema.index({ restaurant: 1, scheduledTime: 1, orderType: 1, status: 1 });

export default Order;

