require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES_DIR = path.join(
  __dirname,
  "../../printing_etc-frontend/src/assets/images",
);

// Image mappings from db.json
const imageMapping = [
  {
    product: "Business Cards",
    filename: "business card stock.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Flyers",
    filename: "flyer photo.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Brochures",
    filename: "brochure.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Posters",
    filename: "poster.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Banners",
    filename: "vinyl-banners.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Stickers",
    filename: "sticker stock photo.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Postcards",
    filename: "Postcard1.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Booklets",
    filename: "booklets.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Door Hangers",
    filename: "doorhanger.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Decals",
    filename: "windowdecal.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "T-shirts",
    filename: "tshirt.jpg",
    folder: "printing-etc/products",
  },
  {
    product: "Blueprints/Floor Plans",
    filename: "blueprints.jpg",
    folder: "printing-etc/products",
  },
];

async function uploadImages() {
  console.log("🚀 Starting image upload to Cloudinary...\n");
  const uploadedImages = [];

  for (const mapping of imageMapping) {
    const imagePath = path.join(IMAGES_DIR, mapping.filename);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  File not found: ${mapping.filename}`);
      uploadedImages.push({
        product: mapping.product,
        filename: mapping.filename,
        url: null,
        error: "File not found",
      });
      continue;
    }

    try {
      console.log(`📤 Uploading ${mapping.filename}...`);

      const result = await cloudinary.uploader.upload(imagePath, {
        folder: mapping.folder,
        public_id: mapping.filename
          .replace(/\.[^/.]+$/, "")
          .replace(/\s+/g, "-")
          .toLowerCase(),
        resource_type: "auto",
        overwrite: true,
      });

      console.log(`✅ Uploaded: ${result.secure_url}\n`);

      uploadedImages.push({
        product: mapping.product,
        filename: mapping.filename,
        url: result.secure_url,
      });
    } catch (error) {
      console.error(`❌ Error uploading ${mapping.filename}:`, error.message);
      uploadedImages.push({
        product: mapping.product,
        filename: mapping.filename,
        url: null,
        error: error.message,
      });
    }
  }

  console.log("\n📋 Upload Summary:");
  console.log("=".repeat(80));

  uploadedImages.forEach((img) => {
    if (img.url) {
      console.log(`✓ ${img.product.padEnd(25)} → ${img.url}`);
    } else {
      console.log(`✗ ${img.product.padEnd(25)} → ERROR: ${img.error}`);
    }
  });

  console.log("=".repeat(80));

  const successful = uploadedImages.filter((img) => img.url).length;
  const failed = uploadedImages.filter((img) => !img.url).length;

  console.log(
    `\n✅ Successfully uploaded: ${successful}/${imageMapping.length}`,
  );
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
  }

  // Output code to update seeds file
  if (successful > 0) {
    console.log("\n📝 Update your seeds/products.js with these URLs:");
    console.log("=".repeat(80));
    uploadedImages.forEach((img, index) => {
      if (img.url) {
        console.log(`// ${img.product}`);
        console.log(`imageUrl: "${img.url}",`);
        console.log(`images: ["${img.url}"],\n`);
      }
    });
  }

  return uploadedImages;
}

// Run the upload
uploadImages()
  .then(() => {
    console.log("\n🎉 Image upload process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
