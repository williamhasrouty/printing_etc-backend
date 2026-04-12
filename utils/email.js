const { Resend } = require("resend");
const {
  RESEND_API_KEY,
  EMAIL_FROM,
  NODE_ENV,
  FRONTEND_URL,
} = require("../config/config");

// Initialize Resend
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Format currency for display
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Format product options for display in email
 */
const formatProductOptions = (options) => {
  if (!options || typeof options !== "object") return "";

  // Define important fields to display in order
  const importantFields = [
    "paperType",
    "size",
    "orientation",
    "color",
    "coating",
    "roundedCorner",
    "finish",
    "velvetFinish",
    "raisedPrint",
  ];

  // Field name mappings for better display
  const fieldLabels = {
    paperType: "Paper",
    size: "Size",
    orientation: "Orientation",
    color: "Color",
    coating: "Coating",
    roundedCorner: "Rounded Corners",
    finish: "Finish",
    velvetFinish: "Velvet Finish",
    raisedPrint: "Raised Print",
  };

  const formattedOptions = [];

  // Process important fields in order
  importantFields.forEach((field) => {
    const value = options[field];
    // Only include if value exists and is not empty
    if (
      value &&
      value.toString().trim() !== "" &&
      value !== "none" &&
      value !== "None"
    ) {
      const label = fieldLabels[field] || field;
      formattedOptions.push(`${label}: ${value}`);
    }
  });

  return formattedOptions.length > 0
    ? `<br/><span style="font-size: 13px; color: #666;">${formattedOptions.join(" • ")}</span>`
    : "";
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmation = async (order, userEmail) => {
  if (!resend) {
    console.warn(
      "⚠️  Email service not configured. Skipping order confirmation email.",
    );
    return false;
  }

  try {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <strong>${item.productName}</strong>
            ${formatProductOptions(item.selectedOptions)}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.totalPrice)}</td>
        </tr>
      `,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - ${order.orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">Thank you for your order! We've received your request and will begin processing it shortly.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #00b4d8; font-size: 20px;">Order Details</h2>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Confirmed</span></p>
          </div>

          <h3 style="color: #00b4d8; margin-top: 30px;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #00b4d8;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #00b4d8;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #00b4d8;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="border-top: 2px solid #00b4d8; padding-top: 15px; margin-top: 20px;">
            <table style="width: 100%; margin-bottom: 10px;">
              <tr>
                <td style="text-align: right; padding: 5px;"><strong>Subtotal:</strong></td>
                <td style="text-align: right; padding: 5px; width: 100px;">${formatCurrency(order.subtotal)}</td>
              </tr>
              ${
                order.discount && order.discount.amount > 0
                  ? `
              <tr>
                <td style="text-align: right; padding: 5px; color: #28a745;"><strong>Discount (${order.discount.code}):</strong></td>
                <td style="text-align: right; padding: 5px; color: #28a745;">-${formatCurrency(order.discount.amount)}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="text-align: right; padding: 5px;"><strong>Tax:</strong></td>
                <td style="text-align: right; padding: 5px;">${formatCurrency(order.tax)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 5px;"><strong>Shipping:</strong></td>
                <td style="text-align: right; padding: 5px;">${order.shipping > 0 ? formatCurrency(order.shipping) : "FREE"}</td>
              </tr>
              <tr style="border-top: 2px solid #00b4d8;">
                <td style="text-align: right; padding: 10px 5px; font-size: 18px;"><strong>Total:</strong></td>
                <td style="text-align: right; padding: 10px 5px; font-size: 18px; color: #00b4d8;"><strong>${formatCurrency(order.total)}</strong></td>
              </tr>
            </table>
          </div>

          ${
            order.shippingAddress
              ? `
          <div style="margin-top: 30px;">
            <h3 style="color: #00b4d8;">${order.deliveryMethod === "pickup" ? "Pick Up Address" : "Shipping Address"}</h3>
            <p style="margin: 5px 0;">${order.shippingAddress.street}</p>
            <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
            <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
          </div>
          `
              : ""
          }

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px;"><strong>Next Steps:</strong></p>
            <p style="margin: 5px 0 0; font-size: 14px;">${
              order.deliveryMethod === "pickup"
                ? "You will receive a payment receipt once your payment is processed. We'll send you another email when your order is ready for pickup!"
                : "You will receive a payment receipt once your payment is processed. We'll send you another email when your order ships!"
            }</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${FRONTEND_URL}/orders/${order._id}" style="display: inline-block; background: #00b4d8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order Details</a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
            <p>Questions? Contact us at <a href="tel:6612722869" style="color: #00b4d8;">(661) 272-2869</a></p>
            <p>1747 E Ave Q Ste B2, Palmdale, CA 93550</p>
            <p style="margin-top: 15px;">© ${new Date().getFullYear()} Printing Etc. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: userEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html,
    });

    if (error) {
      console.error("❌ Failed to send order confirmation email:", error);
      return false;
    }

    console.log(
      `✅ Order confirmation email sent to ${userEmail} (${data.id})`,
    );
    return true;
  } catch (error) {
    console.error("❌ Error sending order confirmation email:", error);
    return false;
  }
};

/**
 * Send payment receipt email
 */
const sendPaymentReceipt = async (order, userEmail) => {
  if (!resend) {
    console.warn(
      "⚠️  Email service not configured. Skipping payment receipt email.",
    );
    return false;
  }

  try {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <strong>${item.productName}</strong>
            ${formatProductOptions(item.selectedOptions)}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.totalPrice)}</td>
        </tr>
      `,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt - ${order.orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✓ Payment Received</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">Your payment has been successfully processed! Thank you for your business.</p>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #28a745; font-size: 20px;">Payment Confirmed</h2>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${formatDate(order.updatedAt)}</p>
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> <span style="font-size: 20px; color: #28a745;"><strong>${formatCurrency(order.total)}</strong></span></p>
            ${order.paymentInfo?.transactionId ? `<p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Transaction ID:</strong> ${order.paymentInfo.transactionId}</p>` : ""}
          </div>

          <h3 style="color: #00b4d8; margin-top: 30px;">Receipt Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #00b4d8;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #00b4d8;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #00b4d8;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="border-top: 2px solid #00b4d8; padding-top: 15px; margin-top: 20px;">
            <table style="width: 100%; margin-bottom: 10px;">
              <tr>
                <td style="text-align: right; padding: 5px;"><strong>Subtotal:</strong></td>
                <td style="text-align: right; padding: 5px; width: 100px;">${formatCurrency(order.subtotal)}</td>
              </tr>
              ${
                order.discount && order.discount.amount > 0
                  ? `
              <tr>
                <td style="text-align: right; padding: 5px; color: #28a745;"><strong>Discount:</strong></td>
                <td style="text-align: right; padding: 5px; color: #28a745;">-${formatCurrency(order.discount.amount)}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="text-align: right; padding: 5px;"><strong>Tax:</strong></td>
                <td style="text-align: right; padding: 5px;">${formatCurrency(order.tax)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 5px;"><strong>Shipping:</strong></td>
                <td style="text-align: right; padding: 5px;">${order.shipping > 0 ? formatCurrency(order.shipping) : "FREE"}</td>
              </tr>
              <tr style="border-top: 2px solid #28a745;">
                <td style="text-align: right; padding: 10px 5px; font-size: 18px;"><strong>Total Paid:</strong></td>
                <td style="text-align: right; padding: 10px 5px; font-size: 18px; color: #28a745;"><strong>${formatCurrency(order.total)}</strong></td>
              </tr>
            </table>
          </div>

          <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px;"><strong>What's Next?</strong></p>
            <p style="margin: 5px 0 0; font-size: 14px;">Your order is now being processed. You'll receive a shipping notification once your items are on their way!</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${FRONTEND_URL}/orders/${order._id}" style="display: inline-block; background: #00b4d8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Your Order</a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
            <p>Need help? Contact us at <a href="tel:6612722869" style="color: #00b4d8;">(661) 272-2869</a></p>
            <p>1747 E Ave Q Ste B2, Palmdale, CA 93550</p>
            <p style="margin-top: 15px;">© ${new Date().getFullYear()} Printing Etc. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: userEmail,
      subject: `Payment Receipt - ${order.orderNumber}`,
      html,
    });

    if (error) {
      console.error("❌ Failed to send payment receipt email:", error);
      return false;
    }

    console.log(`✅ Payment receipt email sent to ${userEmail} (${data.id})`);
    return true;
  } catch (error) {
    console.error("❌ Error sending payment receipt email:", error);
    return false;
  }
};

/**
 * Send order status update email
 */
const sendStatusUpdate = async (order, userEmail, previousStatus) => {
  if (!resend) {
    console.warn(
      "⚠️  Email service not configured. Skipping status update email.",
    );
    return false;
  }

  try {
    // Define status messages and colors
    const statusConfig = {
      confirmed: {
        title: "Order Confirmed",
        message: "Your order has been confirmed and is being prepared.",
        color: "#28a745",
        icon: "✓",
      },
      processing: {
        title: "Order Processing",
        message: "We're working on your order right now!",
        color: "#17a2b8",
        icon: "⚙️",
      },
      shipped: {
        title: "Order Shipped",
        message: "Your order is on its way!",
        color: "#007bff",
        icon: "📦",
      },
      delivered: {
        title: "Order Delivered",
        message: "Your order has been delivered. We hope you love it!",
        color: "#28a745",
        icon: "✓",
      },
      completed: {
        title:
          order.deliveryMethod === "pickup"
            ? "Order Ready for Pickup"
            : "Order Completed",
        message:
          order.deliveryMethod === "pickup"
            ? "Your order is ready! You can pick it up at our location during business hours."
            : "Your order has been completed. Thank you for your business!",
        color: "#28a745",
        icon: "✓",
      },
      cancelled: {
        title: "Order Cancelled",
        message: "Your order has been cancelled.",
        color: "#dc3545",
        icon: "✗",
      },
    };

    // Only send emails for specific status changes
    const emailableStatuses = ["shipped", "delivered", "cancelled"];

    // For pickup orders, send email when marked as "completed" (ready for pickup)
    if (order.deliveryMethod === "pickup" && order.status === "completed") {
      emailableStatuses.push("completed");
    }

    // Don't send email if status is not in the emailable list
    if (!emailableStatuses.includes(order.status)) {
      console.log(`ℹ️  Skipping email for status: ${order.status}`);
      return true;
    }

    const config = statusConfig[order.status] || statusConfig.confirmed;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${config.title} - ${order.orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${config.color}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${config.icon} ${config.title}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">${config.message}</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${config.color}; font-weight: bold; text-transform: capitalize;">${order.status}</span></p>
            <p style="margin: 5px 0;"><strong>Updated:</strong> ${formatDate(order.updatedAt)}</p>
            ${order.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${order.trackingNumber}</code></p>` : ""}
          </div>

          ${
            order.status === "shipped" && order.trackingNumber
              ? `
          <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px;"><strong>Track Your Package</strong></p>
            <p style="margin: 5px 0 0; font-size: 14px;">Use tracking number <strong>${order.trackingNumber}</strong> to monitor your shipment's progress.</p>
          </div>
          `
              : ""
          }

          ${
            order.status === "delivered"
              ? `
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px;"><strong>Was everything perfect?</strong></p>
            <p style="margin: 5px 0 0; font-size: 14px;">We'd love to hear your feedback! If you have any concerns, please don't hesitate to reach out.</p>
          </div>
          `
              : ""
          }

          ${
            order.status === "completed" && order.deliveryMethod === "pickup"
              ? `
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px;"><strong>Pickup Location</strong></p>
            <p style="margin: 5px 0 0; font-size: 14px;">1747 E Ave Q Ste B2, Palmdale, CA 93550</p>
            <p style="margin: 5px 0 0; font-size: 14px;"><strong>Phone:</strong> (661) 272-2869</p>
            <p style="margin: 10px 0 0; font-size: 13px; color: #666;">Please have your order number ready when picking up.</p>
          </div>
          `
              : ""
          }

          <div style="text-align: center; margin-top: 30px;">
            <a href="${FRONTEND_URL}/orders/${order._id}" style="display: inline-block; background: ${config.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order Details</a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
            <p>Questions? Contact us at <a href="tel:6612722869" style="color: #00b4d8;">(661) 272-2869</a></p>
            <p>1747 E Ave Q Ste B2, Palmdale, CA 93550</p>
            <p style="margin-top: 15px;">© ${new Date().getFullYear()} Printing Etc. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: userEmail,
      subject: `${config.title} - ${order.orderNumber}`,
      html,
    });

    if (error) {
      console.error("❌ Failed to send status update email:", error);
      return false;
    }

    console.log(
      `✅ Status update email sent to ${userEmail} (${order.status}) (${data.id})`,
    );
    return true;
  } catch (error) {
    console.error("❌ Error sending status update email:", error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendStatusUpdate,
};
