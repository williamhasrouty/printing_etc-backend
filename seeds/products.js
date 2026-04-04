const mongoose = require("mongoose");
const Product = require("../models/product");
const config = require("../config/config");

// Products from your db.json - using placeholder images until you upload real ones
const sampleProducts = [
  {
    position: 1,
    name: "Business Cards",
    description:
      "Professional business cards printed on premium cardstock. Perfect for networking and making a lasting impression.",
    category: "business-cards",
    basePrice: 35,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003091/printing-etc/products/business-card-stock.png",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003091/printing-etc/products/business-card-stock.png",
    ],
    options: {
      sizes: [
        {
          name: 'Standard (3.5" x 2")',
          dimensions: "3.5x2",
          priceModifier: 0,
        },
        {
          name: 'Square (2.5" x 2.5")',
          dimensions: "2.5x2.5",
          priceModifier: 5,
        },
      ],
      paperTypes: [
        { name: "Standard (100 lb)", priceModifier: 0 },
        { name: "Premium (130 lb)", priceModifier: 10 },
        { name: "Glossy", priceModifier: 15 },
      ],
      finishes: [
        { name: "Matte", priceModifier: 0 },
        { name: "Glossy", priceModifier: 5 },
        { name: "UV Coating", priceModifier: 10 },
      ],
    },
    inStock: true,
    featured: true,
  },
  {
    position: 2,
    name: "Flyers",
    description:
      "Eye-catching flyers for events, promotions, and announcements. Available in multiple sizes.",
    category: "flyers",
    basePrice: 0.25,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003092/printing-etc/products/flyer-photo.webp",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003092/printing-etc/products/flyer-photo.webp",
    ],
    options: {
      sizes: [
        {
          name: '8.5" x 11"',
          dimensions: "8.5x11",
          priceModifier: 0,
        },
        {
          name: '11" x 17"',
          dimensions: "11x17",
          priceModifier: 0.5,
        },
      ],
      paperTypes: [
        { name: "Standard (80 lb)", priceModifier: 0 },
        { name: "Premium (100 lb)", priceModifier: 0.1 },
        { name: "Glossy (100 lb)", priceModifier: 0.15 },
      ],
      colors: [
        { name: "Full Color", priceModifier: 0 },
        { name: "Black & White", priceModifier: -0.1 },
      ],
    },
    inStock: true,
    featured: true,
  },
  {
    position: 3,
    name: "Brochures",
    description:
      "Tri-fold brochures perfect for showcasing your products and services in detail.",
    category: "brochures",
    basePrice: 0.45,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003093/printing-etc/products/brochure.webp",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003093/printing-etc/products/brochure.webp",
    ],
    options: {
      sizes: [
        {
          name: '8.5" x 11" Tri-fold',
          dimensions: "8.5x11-tri",
          priceModifier: 0,
        },
        {
          name: '11" x 17" Bi-fold',
          dimensions: "11x17-bi",
          priceModifier: 1,
        },
      ],
      paperTypes: [
        { name: "Standard (100 lb)", priceModifier: 0 },
        { name: "Premium (130 lb)", priceModifier: 0.5 },
        { name: "Glossy (130 lb)", priceModifier: 0.75 },
      ],
      finishes: [
        { name: "Matte", priceModifier: 0 },
        { name: "Glossy", priceModifier: 0.25 },
      ],
    },
    inStock: true,
    featured: false,
  },
  {
    position: 4,
    name: "Posters",
    description:
      "Large format posters for maximum visibility. Great for events, promotions, and advertising.",
    category: "posters",
    basePrice: 2.5,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003094/printing-etc/products/poster.png",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003094/printing-etc/products/poster.png",
    ],
    options: {
      sizes: [
        {
          name: '18" x 24"',
          dimensions: "18x24",
          priceModifier: 0,
        },
        {
          name: '24" x 36"',
          dimensions: "24x36",
          priceModifier: 10,
        },
      ],
      paperTypes: [
        { name: "Standard Poster Paper", priceModifier: 0 },
        { name: "Premium Photo Paper", priceModifier: 10 },
        { name: "Canvas", priceModifier: 25 },
      ],
      finishes: [
        { name: "Matte", priceModifier: 0 },
        { name: "Glossy", priceModifier: 5 },
      ],
    },
    inStock: true,
    featured: true,
  },
  {
    position: 5,
    name: "Banners",
    description:
      "Durable vinyl banners for indoor and outdoor use. Weather-resistant and long-lasting.",
    category: "banners",
    basePrice: 5,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003094/printing-etc/products/vinyl-banners.webp",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003094/printing-etc/products/vinyl-banners.webp",
    ],
    options: {
      sizes: [
        {
          name: "2' x 4'",
          dimensions: "2x4",
          priceModifier: 0,
        },
        {
          name: "3' x 6'",
          dimensions: "3x6",
          priceModifier: 30,
        },
        {
          name: "4' x 8'",
          dimensions: "4x8",
          priceModifier: 60,
        },
      ],
      materials: [
        { name: "13 oz Vinyl", priceModifier: 0 },
        { name: "18 oz Heavy Duty Vinyl", priceModifier: 20 },
        { name: "Mesh (Wind Resistant)", priceModifier: 15 },
      ],
    },
    inStock: true,
    featured: false,
  },
  {
    position: 6,
    name: "Stickers",
    description:
      "Custom stickers in any shape or size. Perfect for branding, packaging, and promotions.",
    category: "stickers",
    basePrice: 0.2,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003096/printing-etc/products/sticker-stock-photo.jpg",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003096/printing-etc/products/sticker-stock-photo.jpg",
    ],
    options: {
      sizes: [
        {
          name: '2" x 2"',
          dimensions: "2x2",
          priceModifier: 0,
        },
        {
          name: '3" x 3"',
          dimensions: "3x3",
          priceModifier: 0.1,
        },
        {
          name: '4" x 4"',
          dimensions: "4x4",
          priceModifier: 0.2,
        },
      ],
      materials: [
        { name: "Paper (Indoor)", priceModifier: 0 },
        { name: "Vinyl (Outdoor)", priceModifier: 0.15 },
        { name: "Clear Vinyl", priceModifier: 0.25 },
      ],
      finishes: [
        { name: "Matte", priceModifier: 0 },
        { name: "Glossy", priceModifier: 0.05 },
      ],
    },
    inStock: true,
    featured: true,
  },
  {
    position: 7,
    name: "Postcards",
    description:
      "High-quality postcards for direct mail campaigns, event invitations, or thank you cards.",
    category: "postcards",
    basePrice: 0.3,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003099/printing-etc/products/postcard1.jpg",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003099/printing-etc/products/postcard1.jpg",
    ],
    options: {
      sizes: [
        {
          name: '4" x 6"',
          dimensions: "4x6",
          priceModifier: 0,
        },
        {
          name: '5" x 7"',
          dimensions: "5x7",
          priceModifier: 0.15,
        },
      ],
      paperTypes: [
        { name: "Standard (100 lb)", priceModifier: 0 },
        { name: "Premium (130 lb)", priceModifier: 0.1 },
        { name: "Glossy (130 lb)", priceModifier: 0.15 },
      ],
      finishes: [
        { name: "Matte", priceModifier: 0 },
        { name: "Glossy", priceModifier: 0.05 },
        { name: "UV Coating", priceModifier: 0.1 },
      ],
    },
    inStock: true,
    featured: false,
  },
  {
    position: 8,
    name: "Booklets",
    description:
      "Multi-page booklets bound professionally. Ideal for catalogs, programs, and manuals.",
    category: "booklets",
    basePrice: 1.5,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003100/printing-etc/products/booklets.webp",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003100/printing-etc/products/booklets.webp",
    ],
    options: {
      sizes: [
        {
          name: '5.5" x 8.5"',
          dimensions: "5.5x8.5",
          priceModifier: 0,
        },
        {
          name: '8.5" x 11"',
          dimensions: "8.5x11",
          priceModifier: 1,
        },
      ],
      pages: [
        { name: "8 pages", count: 8, priceModifier: 0 },
        { name: "16 pages", count: 16, priceModifier: 2 },
        { name: "24 pages", count: 24, priceModifier: 4 },
        { name: "32 pages", count: 32, priceModifier: 6 },
      ],
      paperTypes: [
        { name: "Standard (80 lb)", priceModifier: 0 },
        { name: "Premium (100 lb)", priceModifier: 1 },
      ],
      binding: [
        { name: "Saddle Stitch", priceModifier: 0 },
        { name: "Perfect Bound", priceModifier: 3 },
      ],
    },
    inStock: true,
    featured: false,
  },
  {
    position: 9,
    name: "Door Hangers",
    description:
      "Eye-catching door hangers for direct marketing. Perfect for promotions, announcements, and advertising.",
    category: "door-hangers",
    basePrice: 0.35,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003101/printing-etc/products/doorhanger.jpg",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003101/printing-etc/products/doorhanger.jpg",
    ],
    options: {
      sizes: [
        {
          name: '3.5" x 8.5"',
          dimensions: "3.5x8.5",
          priceModifier: 0,
        },
        {
          name: '4.25" x 11"',
          dimensions: "4.25x11",
          priceModifier: 0.2,
        },
      ],
      paperTypes: [
        { name: "Standard (100 lb)", priceModifier: 0 },
        { name: "Premium (130 lb)", priceModifier: 0.15 },
      ],
      finishes: [
        { name: "Matte", priceModifier: 0 },
        { name: "Glossy", priceModifier: 0.1 },
        { name: "UV Coating", priceModifier: 0.15 },
      ],
    },
    inStock: true,
    featured: false,
  },
  {
    position: 10,
    name: "Decals",
    description:
      "Durable vinyl decals for windows, vehicles, and equipment. Weather-resistant and long-lasting.",
    category: "decals",
    basePrice: 0.5,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003102/printing-etc/products/windowdecal.jpg",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003102/printing-etc/products/windowdecal.jpg",
    ],
    options: {
      sizes: [
        {
          name: '3" x 3"',
          dimensions: "3x3",
          priceModifier: 0,
        },
        {
          name: '6" x 6"',
          dimensions: "6x6",
          priceModifier: 2,
        },
        {
          name: '12" x 12"',
          dimensions: "12x12",
          priceModifier: 5,
        },
      ],
      materials: [
        { name: "Removable Vinyl", priceModifier: 0 },
        { name: "Permanent Vinyl", priceModifier: 0.5 },
        { name: "Clear Vinyl", priceModifier: 1 },
      ],
      finishes: [
        { name: "Matte", priceModifier: 0 },
        { name: "Glossy", priceModifier: 0.5 },
      ],
    },
    inStock: true,
    featured: false,
  },
  {
    position: 11,
    name: "T-shirts",
    description:
      "Custom printed t-shirts with high-quality graphics. Perfect for events, teams, and promotions.",
    category: "custom-printing",
    basePrice: 12,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003102/printing-etc/products/tshirt.webp",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003102/printing-etc/products/tshirt.webp",
    ],
    options: {
      sizes: [
        { name: "Small", priceModifier: 0 },
        { name: "Medium", priceModifier: 0 },
        { name: "Large", priceModifier: 0 },
        { name: "X-Large", priceModifier: 2 },
        { name: "2X-Large", priceModifier: 4 },
      ],
      colors: [
        { name: "White", priceModifier: 0 },
        { name: "Black", priceModifier: 0 },
        { name: "Navy", priceModifier: 0 },
        { name: "Red", priceModifier: 0 },
      ],
    },
    inStock: true,
    featured: false,
  },
  {
    position: 12,
    name: "Blueprints/Floor Plans",
    description:
      "Large format architectural blueprints and floor plans. Professional printing for construction and design.",
    category: "custom-printing",
    basePrice: 3,
    imageUrl:
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003103/printing-etc/products/blueprints.jpg",
    images: [
      "https://res.cloudinary.com/dlonvpwii/image/upload/v1775003103/printing-etc/products/blueprints.jpg",
    ],
    options: {
      sizes: [
        {
          name: '18" x 24"',
          dimensions: "18x24",
          priceModifier: 0,
        },
        {
          name: '24" x 36"',
          dimensions: "24x36",
          priceModifier: 2,
        },
        {
          name: '36" x 48"',
          dimensions: "36x48",
          priceModifier: 5,
        },
      ],
      paperTypes: [
        { name: "Standard Bond", priceModifier: 0 },
        { name: "Vellum", priceModifier: 1 },
        { name: "Mylar", priceModifier: 3 },
      ],
    },
    inStock: true,
    featured: false,
  },
];

// Connect to MongoDB and seed products
async function seedProducts() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing products
    console.log("Clearing existing products...");
    await Product.deleteMany({});
    console.log("Existing products cleared");

    // Insert sample products
    console.log("Inserting sample products...");
    const results = await Product.insertMany(sampleProducts);
    console.log(`Successfully inserted ${results.length} products`);

    // Display inserted products
    results.forEach((product) => {
      console.log(
        `- ${product.name} (${product.category}) - $${product.basePrice}`,
      );
    });

    console.log("\n✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the seed function
seedProducts();
