import { z } from "zod/v3";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getOrders,
  getOrderByNumber,
  updateOrderStatus,
  getOrderStats,
  createOrder,
  generateOrderNumber,
} from "@/lib/db/queries/orders";
import { requireAdmin } from "@/lib/mcp/auth";

export function registerOrderTools(server: McpServer) {
  // Admin only
  server.registerTool("list_orders", {
    title: "List Orders",
    description: "[Admin] List orders with optional status filter and pagination",
    inputSchema: {
      status: z
        .enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "all"])
        .optional()
        .describe("Filter by order status"),
      page: z.number().int().min(1).optional().describe("Page number (default 1)"),
      limit: z.number().int().min(1).max(100).optional().describe("Items per page (default 20)"),
    },
  }, async (params, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const result = await getOrders({
      status: params.status,
      page: params.page,
      limit: params.limit,
    });

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("get_order", {
    title: "Get Order",
    description: "[Admin] Get full order details including line items by order number",
    inputSchema: {
      orderNumber: z.string().describe("Order number (e.g. SH-20250101-001)"),
    },
  }, async ({ orderNumber }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const order = await getOrderByNumber(orderNumber);

    if (!order) {
      return { content: [{ type: "text", text: "Order not found" }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(order, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("update_order_status", {
    title: "Update Order Status",
    description: "[Admin] Change the status of an order",
    inputSchema: {
      id: z.string().uuid().describe("Order UUID"),
      status: z
        .enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"])
        .describe("New order status"),
    },
  }, async ({ id, status }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const updated = await updateOrderStatus(id, status);

    if (!updated) {
      return { content: [{ type: "text", text: "Order not found" }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(updated, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("get_dashboard_stats", {
    title: "Dashboard Stats",
    description: "[Admin] Get dashboard statistics: today/week/month order counts, revenue, and total products",
  }, async (extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const stats = await getOrderStats();

    return {
      content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
    };
  });

  // Public - both admin and user
  server.registerTool("place_order", {
    title: "Place Order",
    description: "Place a new order with customer info and cart items. Cash on Delivery only. Pakistan shipping.",
    inputSchema: {
      customerName: z.string().min(1).describe("Customer full name"),
      customerPhone: z.string().min(1).describe("Phone number (e.g. 03001234567)"),
      customerEmail: z.string().email().optional().describe("Email address (optional)"),
      shippingAddress: z.string().min(1).describe("Full street address"),
      shippingCity: z.string().min(1).describe("City name"),
      shippingState: z.string().optional().describe("Province/state (optional)"),
      shippingZipCode: z.string().optional().describe("Zip/postal code (optional)"),
      notes: z.string().optional().describe("Order notes (optional)"),
      items: z.array(z.object({
        productId: z.string().uuid().describe("Product UUID"),
        productName: z.string().describe("Product name"),
        productSlug: z.string().describe("Product slug"),
        productImage: z.string().optional().nullable().describe("Product image URL"),
        variantId: z.string().uuid().optional().nullable().describe("Variant UUID if applicable"),
        variantLabel: z.string().optional().nullable().describe("Variant label (e.g. 'Red / Large')"),
        price: z.number().positive().describe("Unit price in PKR"),
        quantity: z.number().int().min(1).describe("Quantity"),
      })).min(1).describe("Cart items (at least 1)"),
    },
  }, async (params) => {
    const items = params.items.map((item) => ({
      ...item,
      productImage: item.productImage ?? null,
      variantId: item.variantId ?? null,
      variantLabel: item.variantLabel ?? null,
      price: item.price.toString(),
      total: (item.price * item.quantity).toString(),
    }));

    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total), 0);
    const shippingCost = 0;
    const total = subtotal + shippingCost;

    const order = await createOrder({
      orderNumber: generateOrderNumber(),
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      shippingAddress: params.shippingAddress,
      shippingCity: params.shippingCity,
      shippingState: params.shippingState,
      shippingZipCode: params.shippingZipCode,
      notes: params.notes,
      subtotal: subtotal.toString(),
      shippingCost: shippingCost.toString(),
      total: total.toString(),
      items,
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          message: "Order placed successfully!",
          orderNumber: order.orderNumber,
          total: `PKR ${total.toFixed(2)}`,
          status: order.status,
          paymentMethod: "Cash on Delivery",
        }, null, 2),
      }],
    };
  });

  // Public - both admin and user
  server.registerTool("track_order", {
    title: "Track Order",
    description: "Track an order by order number and phone number for verification",
    inputSchema: {
      orderNumber: z.string().describe("Order number (e.g. SH-20260208-001)"),
      customerPhone: z.string().describe("Phone number used when placing the order"),
    },
  }, async ({ orderNumber, customerPhone }) => {
    const order = await getOrderByNumber(orderNumber);

    if (!order) {
      return { content: [{ type: "text", text: "Order not found" }], isError: true };
    }

    // Verify phone matches for security
    if (order.customerPhone !== customerPhone) {
      return { content: [{ type: "text", text: "Order not found" }], isError: true };
    }

    // Return only customer-safe info (no internal IDs, no admin data)
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          orderNumber: order.orderNumber,
          status: order.status,
          total: `PKR ${order.total}`,
          shippingCity: order.shippingCity,
          placedAt: order.createdAt,
          items: order.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            price: `PKR ${item.price}`,
            total: `PKR ${item.total}`,
          })),
        }, null, 2),
      }],
    };
  });
}
