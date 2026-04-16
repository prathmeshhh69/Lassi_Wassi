import mongoose from "mongoose";

const { Schema } = mongoose;

const restaurantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String
    },
    address: {
      type: String,
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat]
        index: "2dsphere"
      }
    },
    openingTime: {
      type: String
    },
    closingTime: {
      type: String
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    averagePreparationTime: {
      type: Number,
      default: 20
    },
    rating: {
      type: Number,
      default: 0
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ── Pre-Order & Booking capacity config ─────────────────────────────────
    tableCapacity: {
      type: Number,
      default: 20   // total seats / tables
    },
    maxBookingPartySize: {
      type: Number,
      default: 10   // largest allowed single booking
    },
    slotDurationMinutes: {
      type: Number,
      default: 30   // length of one pre-order/booking slot
    },
    maxPreOrdersPerSlot: {
      type: Number,
      default: 5    // max concurrent kitchen pre-orders per slot
    },
    preOrderLeadTimeMinutes: {
      type: Number,
      default: 60   // minimum lead time before a slot
    },
    bookingSlotIntervalMinutes: {
      type: Number,
      default: 30   // gap between offered booking times
    }
  },
  {
    timestamps: true
  }
);

restaurantSchema.index({ location: "2dsphere" });

const Restaurant =
  mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;

