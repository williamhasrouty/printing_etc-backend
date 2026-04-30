/**
 * Calculate item price based on product and selected options
 * @param {Object} product - Product document
 * @param {Object} selectedOptions - Customer's selected options
 * @param {Number} quantity - Order quantity
 * @returns {Object} - {price, totalPrice}
 */
const calculateItemPrice = (product, selectedOptions = {}, quantity = 1) => {
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
  calculateOrderTotal,
  calculateShipping,
  getTaxRate,
};
