/**
 * Calculate price using pricing table based on color variant, size, and quantity
 * @param {Object} product - Product document with pricingTable
 * @param {Object} selectedOptions - Customer's selected options
 * @param {Number} quantity - Order quantity
 * @returns {Object} - {price, totalPrice}
 */
const calculatePricingTablePrice = (
  product,
  selectedOptions = {},
  quantity = 1,
) => {
  // Determine which variant to use.
  // Priority: shape (stickers) → color (blueprints) → first variant
  let variant = null;

  const normalize = (str) =>
    String(str || "")
      .trim()
      .toLowerCase();

  // Stickers: variant is determined by shape in customOptions
  const shapeId = selectedOptions.customOptions?.shape;
  if (shapeId && product.pricingTable.variants) {
    variant = product.pricingTable.variants.find(
      (v) =>
        normalize(v.variantName) === normalize(shapeId) ||
        normalize(v.variantId) === normalize(shapeId),
    );
  }

  // Blueprints / other color-variant products
  if (!variant && selectedOptions.color && product.pricingTable.variants) {
    variant = product.pricingTable.variants.find(
      (v) => normalize(v.variantName) === normalize(selectedOptions.color),
    );
    if (!variant) {
      const colorId = selectedOptions.color
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      variant = product.pricingTable.variants.find(
        (v) => normalize(v.variantId) === colorId,
      );
    }
  }

  // Fallback: first variant
  if (!variant && product.pricingTable.variants.length > 0) {
    variant = product.pricingTable.variants[0];
  }

  if (!variant) {
    return {
      price: product.basePrice,
      totalPrice: product.basePrice * quantity,
    };
  }

  // Resolve size dimension from selectedOptions.size.
  // The frontend may store the size as:
  //   1. The exact display name  ("2\" x 2\"")
  //   2. A slug of the name      ("2-x-2")
  //   3. The dimensions string   ("2x2")
  // Try all three against the product sizes.
  const toSlug = (str) =>
    String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  let sizeDimension = null;
  if (selectedOptions.size && product.options?.sizes) {
    const sel = selectedOptions.size;
    const found = product.options.sizes.find(
      (s) => s.name === sel || s.dimensions === sel || toSlug(s.name) === sel,
    );
    if (found) sizeDimension = found.dimensions;
  }

  // Get quantity from selectedOptions.quantity if it's a string option
  let lookupQuantity = quantity;
  if (selectedOptions.quantity) {
    lookupQuantity = parseInt(selectedOptions.quantity, 10) || quantity;
  }

  // Lookup price in the table: "sizeDimension-quantity" (e.g., "18x24-1")
  let price = product.basePrice;

  if (sizeDimension && variant.prices) {
    const priceKey = `${sizeDimension}-${lookupQuantity}`;
    if (variant.prices[priceKey] !== undefined) {
      price = variant.prices[priceKey];
    }
  }

  // For pricing table products:
  // - price from table = cost for one order of N copies
  // - quantity parameter = how many such orders (cart quantity)
  // - totalPrice = price × cart quantity
  //
  // Example: User selects "2 copies" (lookupQuantity=2), price=$4.50
  //   - If cart quantity=1: totalPrice = $4.50 × 1 = $4.50
  //   - If cart quantity=2: totalPrice = $4.50 × 2 = $9.00
  const totalPrice = price * quantity;

  return {
    price: Math.round(price * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
};

/**
 * Calculate item price based on product and selected options
 * @param {Object} product - Product document
 * @param {Object} selectedOptions - Customer's selected options
 * @param {Number} quantity - Order quantity
 * @returns {Object} - {price, totalPrice}
 */
const calculateItemPrice = (product, selectedOptions = {}, quantity = 1) => {
  // Check if product uses pricing table
  if (
    product.pricingTable?.enabled &&
    product.pricingTable?.variants?.length > 0
  ) {
    return calculatePricingTablePrice(product, selectedOptions, quantity);
  }

  let price = product.basePrice;

  // Add price modifiers for selected options
  if (selectedOptions.size && product.options?.sizes) {
    const sizeOption = product.options.sizes.find(
      (s) => s.name === selectedOptions.size,
    );
    if (sizeOption && sizeOption.priceModifier) {
      price += sizeOption.priceModifier;
    }
  }

  if (selectedOptions.paperType && product.options?.paperTypes) {
    const paperOption = product.options.paperTypes.find(
      (p) => p.name === selectedOptions.paperType,
    );
    if (paperOption && paperOption.priceModifier) {
      price += paperOption.priceModifier;
    }
  }

  if (selectedOptions.finish && product.options?.finishes) {
    const finishOption = product.options.finishes.find(
      (f) => f.name === selectedOptions.finish,
    );
    if (finishOption && finishOption.priceModifier) {
      price += finishOption.priceModifier;
    }
  }

  if (selectedOptions.color && product.options?.colors) {
    const colorOption = product.options.colors.find(
      (c) => c.name === selectedOptions.color,
    );
    if (colorOption && colorOption.priceModifier) {
      price += colorOption.priceModifier;
    }
  }

  if (selectedOptions.coating && product.options?.coatings) {
    const coatingOption = product.options.coatings.find(
      (c) => c.name === selectedOptions.coating,
    );
    if (coatingOption && coatingOption.priceModifier) {
      price += coatingOption.priceModifier;
    }
  }

  if (selectedOptions.roundedCorners && product.options?.roundedCorners) {
    const roundedCornersOption = product.options.roundedCorners.find(
      (r) => r.name === selectedOptions.roundedCorners,
    );
    if (roundedCornersOption && roundedCornersOption.priceModifier) {
      price += roundedCornersOption.priceModifier;
    }
  }

  if (selectedOptions.raisedPrint && product.options?.raisedPrint) {
    const raisedPrintOption = product.options.raisedPrint.find(
      (r) => r.name === selectedOptions.raisedPrint,
    );
    if (raisedPrintOption && raisedPrintOption.priceModifier) {
      price += raisedPrintOption.priceModifier;
    }
  }

  // Apply 50% upcharge for postcards with Spot UV Coating
  if (
    product.category === "postcards" &&
    selectedOptions.coating &&
    selectedOptions.coating.includes("Spot UV")
  ) {
    price = price * 1.5;
  }

  // Apply 50% upcharge for postcards with raised print
  if (
    product.category === "postcards" &&
    selectedOptions.raisedPrint &&
    selectedOptions.raisedPrint !== "None" &&
    !selectedOptions.raisedPrint.toLowerCase().includes("none")
  ) {
    price = price * 1.5;
  }

  const totalPrice = price * quantity;

  return {
    price: Math.round(price * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
};

/**
 * Calculate order totals
 * @param {Array} items - Array of order items
 * @param {Object} options - {shippingCost, taxRate, discountAmount}
 * @returns {Object} - {subtotal, tax, shipping, discount, total}
 */
const calculateOrderTotal = (
  items,
  { shippingCost = 0, taxRate = 0.08, discountAmount = 0 } = {},
) => {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Apply discount
  const discount = Math.min(discountAmount, subtotal);
  const subtotalAfterDiscount = subtotal - discount;

  // Calculate tax (on subtotal after discount, before shipping)
  const tax = subtotalAfterDiscount * taxRate;

  // Shipping
  const shipping = shippingCost;

  // Total
  const total = subtotalAfterDiscount + tax + shipping;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

/**
 * Calculate shipping cost based on order details
 * @param {Array} items - Array of order items
 * @param {Object} address - Shipping address
 * @returns {Number} - Shipping cost
 */
const calculateShipping = (items, address) => {
  // Simple shipping calculation
  // In production, this would integrate with shipping APIs

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Free shipping over $100
  if (subtotal >= 100) {
    return 0;
  }

  // Base shipping rate
  let shipping = 5.99;

  // Add per item
  if (itemCount > 1) {
    shipping += (itemCount - 1) * 2;
  }

  // International shipping (non-USA)
  if (address && address.country && address.country !== "USA") {
    shipping += 15;
  }

  return Math.round(shipping * 100) / 100;
};

/**
 * Get tax rate based on location
 * @param {Object} address - Shipping address
 * @returns {Number} - Tax rate (e.g., 0.08 for 8%)
 */
const getTaxRate = (address) => {
  // In production, this would use a tax rate API
  // For now, return default rate

  if (!address || !address.state) {
    return 0.08; // Default 8%
  }

  // Example state tax rates
  const stateTaxRates = {
    CA: 0.1125, // California (Palmdale combined rate)
    TX: 0.0625, // Texas
    NY: 0.08, // New York
    FL: 0.06, // Florida
    // Add more states as needed
  };

  return stateTaxRates[address.state] || 0.08;
};

module.exports = {
  calculateItemPrice,
  calculatePricingTablePrice,
  calculateOrderTotal,
  calculateShipping,
  getTaxRate,
};
