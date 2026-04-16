/**
 * seedRestaurant.js
 *
 * Seeds the "Lassi Wassi" restaurant (linked to the owner account)
 * plus all 45 menu items.  Idempotent — safe to run multiple times.
 *
 *   node scripts/seedRestaurant.js
 */

import "dotenv/config";
import mongoose from "mongoose";

// ── Minimal schemas (avoids pulling full app graph) ───────────────────────────
const userSchema = new mongoose.Schema({ email: String, role: String });
const User = mongoose.models.User || mongoose.model("User", userSchema);

const restaurantSchema = new mongoose.Schema(
  {
    name: String, description: String, address: String,
    openingTime: String, closingTime: String, isOpen: Boolean,
    rating: Number, owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tableCapacity: Number, maxBookingPartySize: Number,
  },
  { timestamps: true }
);
const Restaurant = mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    name: String, description: String, price: Number, category: String,
    isAvailable: Boolean, preparationTime: Number, image: String,
  },
  { timestamps: true }
);
const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);

// ── Menu catalogue (mirrors client/src/data/menuData.js) ─────────────────────
const MENU_ITEMS = [
  // Shawarma
  { name: "Chicken Shawarma",          category: "Shawarma",   price: 100, preparationTime: 12, description: "Juicy chicken with garlic sauce wrapped in soft pita bread.",        image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Veg Shawarma",              category: "Shawarma",   price: 80,  preparationTime: 10, description: "Crispy veggies with tahini sauce in a warm pita.",                  image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Double Chicken Shawarma",   category: "Shawarma",   price: 140, preparationTime: 13, description: "Double the chicken, double the flavour.",                           image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Paneer Shawarma",           category: "Shawarma",   price: 110, preparationTime: 11, description: "Soft paneer cubes with our signature house sauce.",                  image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Egg Shawarma",              category: "Shawarma",   price: 90,  preparationTime: 10, description: "Fluffy egg with seasoned veggies in a wrap.",                       image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=480&h=360&fit=crop&auto=format&q=80" },
  // Lassi
  { name: "Mango Lassi",               category: "Lassi",      price: 80,  preparationTime: 5,  description: "Thick creamy lassi blended with fresh Alphonso mango pulp.",        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Sweet Lassi",               category: "Lassi",      price: 60,  preparationTime: 4,  description: "Classic chilled sweet lassi, perfect for a hot day.",               image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Salted Lassi",              category: "Lassi",      price: 55,  preparationTime: 4,  description: "Refreshing salted lassi with a hint of roasted cumin.",             image: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Rose Lassi",                category: "Lassi",      price: 75,  preparationTime: 5,  description: "Fragrant rose-flavoured lassi topped with crushed pistachios.",     image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Strawberry Lassi",          category: "Lassi",      price: 85,  preparationTime: 5,  description: "Fresh strawberry blended with smooth yoghurt.",                     image: "https://images.unsplash.com/photo-1553978520-f7a5076e9284?w=480&h=360&fit=crop&auto=format&q=80" },
  // Juice
  { name: "Fresh Orange Juice",        category: "Juice",      price: 70,  preparationTime: 4,  description: "Freshly squeezed oranges with no added sugar.",                     image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Watermelon Juice",          category: "Juice",      price: 65,  preparationTime: 4,  description: "Cool and hydrating fresh watermelon juice.",                        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Mixed Fruit Juice",         category: "Juice",      price: 90,  preparationTime: 5,  description: "Seasonal fruit blend — a glass full of vitamins.",                  image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Pomegranate Juice",         category: "Juice",      price: 100, preparationTime: 5,  description: "Rich antioxidant pomegranate juice, freshly pressed.",              image: "https://images.unsplash.com/photo-1596564046781-97c0e29cb18a?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Pineapple Juice",           category: "Juice",      price: 75,  preparationTime: 4,  description: "Sweet-tangy fresh pineapple juice.",                               image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=480&h=360&fit=crop&auto=format&q=80" },
  // Coffee
  { name: "Cold Coffee",               category: "Coffee",     price: 90,  preparationTime: 5,  description: "Chilled house blend coffee with milk — a smooth pick-me-up.",       image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Hot Espresso",              category: "Coffee",     price: 70,  preparationTime: 3,  description: "Strong single-origin espresso shot.",                               image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Cappuccino",                category: "Coffee",     price: 100, preparationTime: 5,  description: "Velvety milk foam over rich espresso.",                             image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Café Mocha",                category: "Coffee",     price: 120, preparationTime: 6,  description: "Espresso + steamed milk + rich chocolate drizzle.",                 image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Iced Latte",               category: "Coffee",     price: 110, preparationTime: 5,  description: "Espresso over ice with cold fresh milk.",                           image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=480&h=360&fit=crop&auto=format&q=80" },
  // Mojito
  { name: "Blue Island Mojito",        category: "Mojito",     price: 110, preparationTime: 6,  description: "Blue curacao layered mojito with fresh mint and lime.",              image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Classic Mint Mojito",       category: "Mojito",     price: 90,  preparationTime: 5,  description: "Original mojito — mint, lime, soda and crushed ice.",               image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Strawberry Mojito",         category: "Mojito",     price: 100, preparationTime: 6,  description: "Fresh strawberries muddled with mint and lime soda.",               image: "https://images.unsplash.com/photo-1604077092088-7fa935c62ae2?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Watermelon Mojito",         category: "Mojito",     price: 100, preparationTime: 6,  description: "Juicy watermelon chunks with classic mojito base.",                 image: "https://images.unsplash.com/photo-1563897539633-7374c13ea073?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Kiwi Mojito",               category: "Mojito",     price: 110, preparationTime: 6,  description: "Tangy kiwi muddled with fresh mint and sparkling water.",           image: "https://images.unsplash.com/photo-1616712134411-6b6ae89bc3ba?w=480&h=360&fit=crop&auto=format&q=80" },
  // Ice Cream
  { name: "Death By Chocolate",        category: "Ice Cream",  price: 130, preparationTime: 3,  description: "Triple chocolate ice cream with hot fudge and brownie crumble.",    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Vanilla Scoop",             category: "Ice Cream",  price: 60,  preparationTime: 2,  description: "Classic Madagascar vanilla bean ice cream.",                        image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Mango Sorbet",              category: "Ice Cream",  price: 80,  preparationTime: 2,  description: "Dairy-free mango sorbet — light, tangy and refreshing.",            image: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Butterscotch Sundae",       category: "Ice Cream",  price: 110, preparationTime: 3,  description: "Butterscotch ice cream with caramel swirl and cashews.",            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Strawberry Sorbet",         category: "Ice Cream",  price: 80,  preparationTime: 2,  description: "Fresh strawberry sorbet with fruit pieces.",                        image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=480&h=360&fit=crop&auto=format&q=80" },
  // Ice Tea
  { name: "Lemon Ice Tea",             category: "Ice Tea",    price: 70,  preparationTime: 4,  description: "Classic iced tea with fresh lemon and honey.",                      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Peach Ice Tea",             category: "Ice Tea",    price: 80,  preparationTime: 4,  description: "Refreshing peach-infused iced tea with a citrus kick.",             image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Mint Lemonade Tea",         category: "Ice Tea",    price: 75,  preparationTime: 4,  description: "Chilled green tea blended with fresh mint and lemon.",              image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Hibiscus Ice Tea",          category: "Ice Tea",    price: 85,  preparationTime: 5,  description: "Deep red hibiscus tea served chilled with honey.",                  image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Berry Blast Ice Tea",       category: "Ice Tea",    price: 90,  preparationTime: 5,  description: "Mixed berry iced tea with a bold fruity finish.",                   image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=480&h=360&fit=crop&auto=format&q=80" },
  // Thick Shake
  { name: "Oreo Thick Shake",          category: "Thick Shake", price: 140, preparationTime: 6, description: "Crushed Oreos blended into a thick creamy vanilla shake.",         image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "KitKat Thick Shake",        category: "Thick Shake", price: 150, preparationTime: 6, description: "Chunky KitKat pieces in a rich chocolate milk shake.",             image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Nutella Thick Shake",       category: "Thick Shake", price: 160, preparationTime: 6, description: "Decadent Nutella blended with cold milk and ice cream.",           image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Banana Thick Shake",        category: "Thick Shake", price: 120, preparationTime: 5, description: "Ripe banana shake with a hint of vanilla.",                        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Mango Thick Shake",         category: "Thick Shake", price: 140, preparationTime: 5, description: "Pure Alphonso mango blended into a glorious thick shake.",         image: "https://images.unsplash.com/photo-1546548970-71785318a17b?w=480&h=360&fit=crop&auto=format&q=80" },
  // Lemonades
  { name: "Classic Lemonade",          category: "Lemonades",  price: 60,  preparationTime: 3,  description: "Freshly squeezed lemons with sugar syrup and soda water.",          image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Mint Lemonade",             category: "Lemonades",  price: 70,  preparationTime: 4,  description: "Zingy lemonade with crushed fresh mint leaves.",                    image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Virgin Mojito Lemonade",    category: "Lemonades",  price: 80,  preparationTime: 4,  description: "Lemonade with mojito vibes — mint, lime and a soda fizz.",         image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Strawberry Lemonade",       category: "Lemonades",  price: 80,  preparationTime: 4,  description: "Bright strawberry lemonade — sweet, sour, refreshing.",             image: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=480&h=360&fit=crop&auto=format&q=80" },
  { name: "Ginger Lemonade",           category: "Lemonades",  price: 70,  preparationTime: 4,  description: "Spicy ginger-infused lemonade with a warm after-kick.",             image: "https://images.unsplash.com/photo-1607920592519-bab2a80efd43?w=480&h=360&fit=crop&auto=format&q=80" },
];

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error("❌  MONGO_URI not set"); process.exit(1); }

  console.log("🔌  Connecting to MongoDB…");
  await mongoose.connect(uri);
  console.log("✅  Connected");

  // Find the owner account
  const owner = await User.findOne({ role: "owner" });
  if (!owner) {
    console.error("❌  No owner account found. Run `npm run seed:owner` first.");
    await mongoose.disconnect(); process.exit(1);
  }
  console.log(`👤  Found owner: ${owner.email}`);

  // Upsert the restaurant
  let restaurant = await Restaurant.findOne({ owner: owner._id });
  if (!restaurant) {
    restaurant = await Restaurant.create({
      name:           "Lassi Wassi",
      description:    "Pune's favourite spot for shawarmas, thick shakes, fresh lassies & mojitos.",
      address:        "Koregaon Park, Pune, Maharashtra 411001",
      openingTime:    "10:00",
      closingTime:    "23:30",
      isOpen:         true,
      rating:         4.9,
      owner:          owner._id,
      tableCapacity:  20,
      maxBookingPartySize: 10,
    });
    console.log("🏪  Restaurant created: Lassi Wassi");
  } else {
    console.log("ℹ️   Restaurant already exists — skipping restaurant creation.");
  }

  // Seed menu items (skip if already seeded)
  const existingCount = await MenuItem.countDocuments({ restaurant: restaurant._id });
  if (existingCount > 0) {
    console.log(`ℹ️   ${existingCount} menu items already seeded — skipping menu seed.`);
  } else {
    const docs = MENU_ITEMS.map((item) => ({
      ...item,
      isAvailable: true,
      restaurant: restaurant._id,
    }));
    await MenuItem.insertMany(docs);
    console.log(`🍽️   Seeded ${docs.length} menu items.`);
  }

  console.log("\n✅  Done! Restaurant ID:", restaurant._id.toString());
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
