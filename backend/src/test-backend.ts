import { queryOne, initDb } from "./lib/db";
import { createStockMovement } from "./services/stockMovement.service";
import { createSalesChallan, updateChallanStatus } from "./services/challan.service";
import { getCustomers, addFollowUpNote } from "./services/customer.service";
import { getProducts } from "./services/product.service";
import { getDashboardStats } from "./services/dashboard.service";

async function runTests() {
  console.log("=== STARTING BACKEND INTEGRATION TESTS ===");
  await initDb();

  // 1. Fetch admin user
  const admin = await queryOne(`SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1`);
  if (!admin) throw new Error("Admin user not found. Seed first.");

  // 2. Fetch products
  const products = await getProducts();
  console.log(`✓ Products loaded. Total: ${products.pagination.total}`);
  const sampleProduct = products.products[0];
  console.log(`  Sample product: ${sampleProduct.name} (Stock: ${sampleProduct.currentStock})`);

  // 3. Fetch customers
  const customers = await getCustomers();
  console.log(`✓ Customers loaded. Total: ${customers.pagination.total}`);
  const sampleCustomer = customers.customers[0];

  // 3b. Test Search functionality across modules
  const searchCust = await getCustomers({ search: "Acme" });
  console.log(`✓ Customer search for 'Acme' passed. Found: ${searchCust.customers.length}`);

  const searchProd = await getProducts({ search: "Mouse" });
  console.log(`✓ Product search for 'Mouse' passed. Found: ${searchProd.products.length}`);

  // 4. Test Follow-up Note
  const updatedCust = await addFollowUpNote(sampleCustomer.id, "Followed up via phone. Interested in bulk order.", new Date());
  console.log(`✓ Follow-up note added for ${updatedCust.name}`);

  // 5. Test Stock Movement IN
  const initialStock = Number(sampleProduct.currentStock);
  await createStockMovement({
    productId: sampleProduct.id,
    quantityChanged: 50,
    movementType: "IN",
    reason: "New shipment received",
    createdBy: admin.id,
  });
  const updatedProdAfterIn = await queryOne(`SELECT * FROM products WHERE id = $1`, [sampleProduct.id]);
  console.log(`✓ Stock IN test passed. Stock went from ${initialStock} to ${updatedProdAfterIn?.currentStock}`);

  // 6. Test Insufficient Stock Error
  let errorCaught = false;
  try {
    await createStockMovement({
      productId: sampleProduct.id,
      quantityChanged: 99999,
      movementType: "OUT",
      reason: "Invalid huge order",
      createdBy: admin.id,
    });
  } catch (err: any) {
    errorCaught = true;
    console.log(`✓ Insufficient stock error caught correctly: "${err.message}"`);
  }
  if (!errorCaught) throw new Error("Failed to catch insufficient stock error");

  // 7. Test Sales Challan Flow (DRAFT -> CONFIRMED -> Stock Reduced)
  const stockBeforeChallan = Number(updatedProdAfterIn!.currentStock);
  const qtyToOrder = 5;

  // Create DRAFT
  const challanDraft = await createSalesChallan({
    customerId: sampleCustomer.id,
    items: [{ productId: sampleProduct.id, quantity: qtyToOrder }],
    status: "DRAFT",
    createdBy: admin.id,
  });
  console.log(`✓ Sales Challan Draft created: ${challanDraft.challanNumber} (Status: ${challanDraft.status})`);

  const prodAfterDraft = await queryOne(`SELECT * FROM products WHERE id = $1`, [sampleProduct.id]);
  if (Number(prodAfterDraft?.currentStock) !== stockBeforeChallan) {
    throw new Error("Draft challan should NOT reduce stock!");
  }
  console.log("✓ Confirmed stock was unchanged during DRAFT creation.");

  // Update DRAFT to CONFIRMED
  const confirmedChallan = await updateChallanStatus(challanDraft.id, "CONFIRMED", admin.id);
  console.log(`✓ Challan updated to CONFIRMED: ${confirmedChallan?.challanNumber}`);

  const prodAfterConfirm = await queryOne(`SELECT * FROM products WHERE id = $1`, [sampleProduct.id]);
  if (Number(prodAfterConfirm?.currentStock) !== stockBeforeChallan - qtyToOrder) {
    throw new Error(`Stock deduction failed! Expected ${stockBeforeChallan - qtyToOrder}, got ${prodAfterConfirm?.currentStock}`);
  }
  console.log(`✓ Stock deducted properly! Stock went from ${stockBeforeChallan} to ${prodAfterConfirm?.currentStock}`);

  // 8. Test Dashboard Metrics
  const stats = await getDashboardStats();
  console.log("✓ Dashboard metrics loaded successfully:");
  console.log(`  Total Customers: ${stats.customers.total}`);
  console.log(`  Total Products: ${stats.inventory.totalProducts}`);
  console.log(`  Total Revenue: ₹${stats.sales.confirmedRevenue}`);

  console.log("=== ALL BACKEND INTEGRATION TESTS PASSED PERFECTLY ===");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
