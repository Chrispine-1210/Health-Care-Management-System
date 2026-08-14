import { getStorage } from "./storageManager";

export async function seedTestData() {
  try {
    const storage = getStorage();
    
    // Create test users for each role
    const testUsers = [
      { id: "customer-1", email: "customer@test.com", firstName: "John", lastName: "Doe", role: "patient" },
      { id: "driver-1", email: "driver@test.com", firstName: "Mthunzi", lastName: "Banda", role: "delivery_driver" },
      { id: "pharmacist-1", email: "pharmacist@test.com", firstName: "Dr", lastName: "Banda", role: "pharmacist" },
      { id: "staff-1", email: "staff@test.com", firstName: "Gift", lastName: "Phiri", role: "receptionist" },
      { id: "admin-1", email: "admin@test.com", firstName: "Admin", lastName: "User", role: "system_administrator" },
    ] as const;

    for (const user of testUsers) {
      await storage.upsertUser(user);
    }

    // Create test products
    const products = [
      { name: "Paracetamol 500mg", sku: "PARA-500", category: "Pain Relief", price: "250", prescriptionRequired: false },
      { name: "Amoxicillin 500mg", sku: "AMOX-500", category: "Antibiotics", price: "1500", prescriptionRequired: true },
      { name: "Vitamin C", sku: "VIT-C", category: "Supplements", price: "800", prescriptionRequired: false },
    ];

    for (const product of products) {
      if (!await storage.getProductBySku(product.sku)) {
        await storage.createProduct(product);
      }
    }

    const existingOrders = await storage.getOrdersByCustomer("customer-1");
    if (existingOrders.length === 0) {
      const order = await storage.createOrder({
        customerId: "customer-1",
        branchId: "default-branch-id",
        subtotal: "500",
        total: "1000",
        status: "pending",
        deliveryAddress: "123 Main St, Lilongwe",
        deliveryLatitude: "-13.9626",
        deliveryLongitude: "33.7741",
        deliveryDistance: "5",
      });

      await storage.createDelivery({
        orderId: order.id,
        driverId: "driver-1",
        status: "assigned",
        estimatedDeliveryTime: new Date(Date.now() + 3600000),
      });
    }

    console.log("✅ Test data seeded successfully");
  } catch (error) {
    console.error("Error seeding test data:", error);
  }
}
