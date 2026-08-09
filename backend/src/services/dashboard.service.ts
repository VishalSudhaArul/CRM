import { query, queryOne } from "../lib/db";

export async function getDashboardStats() {
  const [
    custTotalRes,
    custActiveRes,
    custLeadRes,
    prodTotalRes,
    allProducts,
    chalTotalRes,
    chalConfirmedRes,
    chalDraftRes,
    revenueRes,
  ] = await Promise.all([
    queryOne(`SELECT COUNT(*) as count FROM customers`),
    queryOne(`SELECT COUNT(*) as count FROM customers WHERE status = 'ACTIVE'`),
    queryOne(`SELECT COUNT(*) as count FROM customers WHERE status = 'LEAD'`),
    queryOne(`SELECT COUNT(*) as count FROM products`),
    query(`SELECT current_stock, minimum_stock, unit_price FROM products`),
    queryOne(`SELECT COUNT(*) as count FROM sales_challans`),
    queryOne(`SELECT COUNT(*) as count FROM sales_challans WHERE status = 'CONFIRMED'`),
    queryOne(`SELECT COUNT(*) as count FROM sales_challans WHERE status = 'DRAFT'`),
    queryOne(`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_challans WHERE status = 'CONFIRMED'`),
  ]);

  const totalCustomers = Number(custTotalRes?.count || 0);
  const activeCustomers = Number(custActiveRes?.count || 0);
  const leadCustomers = Number(custLeadRes?.count || 0);
  const totalProducts = Number(prodTotalRes?.count || 0);
  const totalChallans = Number(chalTotalRes?.count || 0);
  const confirmedChallans = Number(chalConfirmedRes?.count || 0);
  const draftChallans = Number(chalDraftRes?.count || 0);
  const confirmedRevenue = Number(revenueRes?.total || 0);

  const lowStockCount = allProducts.filter(
    (p) => Number(p.currentStock) <= Number(p.minimumStock)
  ).length;

  const totalInventoryValue = allProducts.reduce(
    (sum, p) => sum + Number(p.currentStock) * Number(p.unitPrice),
    0
  );

  const recentMovementsRaw = await query(
    `SELECT sm.*, p.name as prod_name, p.sku as prod_sku, u.name as user_name, u.role as user_role
     FROM stock_movements sm
     LEFT JOIN products p ON sm.product_id = p.id
     LEFT JOIN users u ON sm.created_by = u.id
     ORDER BY sm.created_at DESC
     LIMIT 5`
  );

  const recentMovements = recentMovementsRaw.map((r) => ({
    id: r.id,
    productId: r.productId,
    quantityChanged: r.quantityChanged,
    movementType: r.movementType,
    reason: r.reason,
    createdAt: r.createdAt,
    product: { name: r.prodName, sku: r.prodSku },
    creator: { name: r.userName, role: r.userRole },
  }));

  const recentChallansRaw = await query(
    `SELECT sc.*, c.name as cust_name, c.business_name as cust_business_name, u.name as user_name
     FROM sales_challans sc
     LEFT JOIN customers c ON sc.customer_id = c.id
     LEFT JOIN users u ON sc.created_by = u.id
     ORDER BY sc.created_at DESC
     LIMIT 5`
  );

  const recentChallans = recentChallansRaw.map((r) => ({
    id: r.id,
    challanNumber: r.challanNumber,
    totalQuantity: r.totalQuantity,
    totalAmount: r.totalAmount,
    status: r.status,
    createdAt: r.createdAt,
    customer: { name: r.custName, businessName: r.custBusinessName },
    creator: { name: r.userName },
  }));

  return {
    customers: {
      total: totalCustomers,
      active: activeCustomers,
      leads: leadCustomers,
    },
    inventory: {
      totalProducts,
      lowStockCount,
      totalValue: totalInventoryValue,
    },
    sales: {
      totalChallans,
      confirmed: confirmedChallans,
      draft: draftChallans,
      confirmedRevenue,
    },
    recentMovements,
    recentChallans,
  };
}
