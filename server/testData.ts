import { getStorage } from "./storageManager";

export async function seedTestData() {
  try {
    const storage = getStorage();
    
    // Create test users for each role
    const testUsers = [
      { id: "customer-1", email: "customer@test.com", firstName: "John", lastName: "Doe", role: "customer" },
      { id: "driver-1", email: "driver@test.com", firstName: "Mthunzi", lastName: "Banda", role: "driver" },
      { id: "pharmacist-1", email: "pharmacist@test.com", firstName: "Dr", lastName: "Banda", role: "pharmacist" },
      { id: "staff-1", email: "staff@test.com", firstName: "Gift", lastName: "Phiri", role: "staff" },
      { id: "admin-1", email: "admin@test.com", firstName: "Admin", lastName: "User", role: "admin" },
    ];

    for (const user of testUsers) {
      await storage.upsertUser(user);
    }

    // Create test products
    const products = [
      { id: "prod-1", name: "Paracetamol 500mg", category: "Pain Relief", price: "250", requiresPrescription: false },
      { id: "prod-2", name: "Amoxicillin 500mg", category: "Antibiotics", price: "1500", requiresPrescription: true },
      { id: "prod-3", name: "Vitamin C", category: "Supplements", price: "800", requiresPrescription: false },
    ];

    for (const product of products) {
      await storage.createProduct(product);
    }

    // Create test orders
    const order = await storage.createOrder({
      customerId: "customer-1",
      total: "1000",
      status: "pending",
      deliveryAddress: "123 Main St, Lilongwe",
      deliveryLatitude: "-13.9626",
      deliveryLongitude: "33.7741",
      deliveryDistance: "5",
    });

    // Create test delivery
    if (order) {
      await storage.createDelivery({
        orderId: order.id,
        driverId: "driver-1",
        status: "assigned",
        estimatedDeliveryTime: new Date(Date.now() + 3600000).toISOString(),
      });
    }

    console.log("✅ Test data seeded successfully");
  } catch (error) {
    console.error("Error seeding test data:", error);
  }
}
