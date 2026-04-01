import { addDays, eachDayOfInterval, endOfDay, format, startOfDay, subDays } from "date-fns";
import type {
  Appointment,
  Branch,
  ContentItem,
  Delivery,
  Order,
  Product,
  Prescription,
  StockBatch,
  User,
} from "@shared/schema";
import type { ConversationSummary } from "@/hooks/useNotifications";

export type ManagedOrder = Order & {
  customer?: User | null;
  delivery?: Delivery | null;
};

export type StockBatchWithDetails = StockBatch & {
  product?: Product | null;
  branch?: Branch | null;
};

const activeOrderStatuses = new Set(["confirmed", "processing", "ready", "in_transit"]);
const activeDeliveryStatuses = new Set(["assigned", "picked_up", "in_transit"]);
const roleOrder = ["customer", "driver", "pharmacist", "staff", "admin"] as const;

const roleLabels: Record<(typeof roleOrder)[number], string> = {
  customer: "Customers",
  driver: "Drivers",
  pharmacist: "Pharmacists",
  staff: "Staff",
  admin: "Admins",
};

function asDate(value: Date | string | number | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export class AdminInsightsService {
  static buildOrderSummary(orders: ManagedOrder[]) {
    const pending = orders.filter((order) => order.status === "pending").length;
    const active = orders.filter((order) => activeOrderStatuses.has(order.status)).length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const cancelled = orders.filter((order) => order.status === "cancelled").length;
    const paymentCompleted = orders.filter((order) => order.paymentStatus === "completed").length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      total: orders.length,
      pending,
      active,
      delivered,
      cancelled,
      revenue,
      completionRate: orders.length ? Math.round((delivered / orders.length) * 100) : 0,
      paymentCompletionRate: orders.length ? Math.round((paymentCompleted / orders.length) * 100) : 0,
    };
  }

  static buildDailyOrderSeries(orders: ManagedOrder[], days = 7) {
    const today = new Date();
    const interval = eachDayOfInterval({
      start: startOfDay(subDays(today, days - 1)),
      end: endOfDay(today),
    });

    return interval.map((day) => {
      const dayStart = startOfDay(day).getTime();
      const dayEnd = endOfDay(day).getTime();
      const dayOrders = orders.filter((order) => {
        const createdAt = asDate(order.createdAt);
        if (!createdAt) {
          return false;
        }

        const time = createdAt.getTime();
        return time >= dayStart && time <= dayEnd;
      });

      return {
        label: format(day, "EEE"),
        orders: dayOrders.length,
        delivered: dayOrders.filter((order) => order.status === "delivered").length,
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      };
    });
  }

  static buildInventorySummary(stockBatches: StockBatchWithDetails[]) {
    const now = new Date();
    const expiringThreshold = addDays(now, 30);

    const lowStock = stockBatches.filter((batch) => batch.quantity <= 10).length;
    const expired = stockBatches.filter((batch) => {
      const expiryDate = asDate(batch.expiryDate);
      return expiryDate ? expiryDate < now : false;
    }).length;
    const expiringSoon = stockBatches.filter((batch) => {
      const expiryDate = asDate(batch.expiryDate);
      return expiryDate ? expiryDate >= now && expiryDate <= expiringThreshold : false;
    }).length;

    return {
      total: stockBatches.length,
      lowStock,
      expired,
      expiringSoon,
      healthy: Math.max(stockBatches.length - lowStock - expired, 0),
    };
  }

  static buildRoleDistribution(users: User[]) {
    return roleOrder
      .map((role) => ({
        name: roleLabels[role],
        value: users.filter((user) => user.role === role).length,
      }))
      .filter((entry) => entry.value > 0);
  }

  static buildBranchPerformance(
    branches: Branch[],
    orders: ManagedOrder[],
    stockBatches: StockBatchWithDetails[],
  ) {
    return branches
      .map((branch) => {
        const branchOrders = orders.filter((order) => order.branchId === branch.id);
        const branchBatches = stockBatches.filter((batch) => batch.branchId === branch.id);

        return {
          id: branch.id,
          name: branch.name,
          active: branch.isActive,
          orders: branchOrders.length,
          activeOrders: branchOrders.filter((order) => activeOrderStatuses.has(order.status)).length,
          revenue: branchOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
          lowStock: branchBatches.filter((batch) => batch.quantity <= 10).length,
        };
      })
      .sort((left, right) => right.orders - left.orders);
  }

  static buildAppointmentSummary(appointments: Appointment[]) {
    const now = new Date();

    return {
      total: appointments.length,
      upcoming: appointments.filter((appointment) => {
        const scheduledAt = asDate(appointment.scheduledAt);
        return (
          scheduledAt &&
          scheduledAt >= now &&
          ["scheduled", "confirmed", "in_progress"].includes(appointment.status)
        );
      }).length,
      completed: appointments.filter((appointment) => appointment.status === "completed").length,
      cancelled: appointments.filter((appointment) =>
        ["cancelled", "no_show"].includes(appointment.status),
      ).length,
    };
  }

  static buildPrescriptionSummary(prescriptions: Prescription[]) {
    return {
      total: prescriptions.length,
      pending: prescriptions.filter((prescription) =>
        ["pending", "under_review"].includes(prescription.status),
      ).length,
      approved: prescriptions.filter((prescription) => prescription.status === "approved").length,
      rejected: prescriptions.filter((prescription) => prescription.status === "rejected").length,
    };
  }

  static buildConversationSummary(conversations: ConversationSummary[]) {
    return {
      total: conversations.length,
      unread: conversations.filter((conversation) => conversation.unread > 0).length,
      online: conversations.filter((conversation) => conversation.online).length,
      highAttention: conversations.filter((conversation) => conversation.unread >= 3).length,
    };
  }

  static buildContentSummary(contentItems: ContentItem[]) {
    return {
      total: contentItems.length,
      published: contentItems.filter((item) => item.status === "published").length,
      draft: contentItems.filter((item) => item.status === "draft").length,
      archived: contentItems.filter((item) => item.status === "archived").length,
      views: contentItems.reduce((sum, item) => sum + Number(item.viewCount || 0), 0),
    };
  }

  static buildDeliverySummary(orders: ManagedOrder[]) {
    const deliveries = orders
      .map((order) => order.delivery)
      .filter((delivery): delivery is Delivery => Boolean(delivery));

    return {
      totalTracked: deliveries.length,
      active: deliveries.filter((delivery) => activeDeliveryStatuses.has(delivery.status)).length,
      completed: deliveries.filter((delivery) => delivery.status === "delivered").length,
      failed: deliveries.filter((delivery) => delivery.status === "failed").length,
    };
  }
}
