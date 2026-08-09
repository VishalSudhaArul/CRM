import React, { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { BentoCard } from "../components/BentoCard";
import { Modal } from "../components/Modal";
import { Pagination } from "../components/Pagination";
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canLogStock = hasRole("ADMIN", "WAREHOUSE");

  const [movements, setMovements] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Log Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: "",
    quantityChanged: 1,
    movementType: "IN" as "IN" | "OUT",
    reason: "Restock Shipment Received",
  });

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 8 };
      if (search) params.search = search;
      if (movementType) params.movementType = movementType;

      const res = await apiClient.get("/stock-movements", { params });
      setMovements(res.data.movements);
      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch stock movements");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await apiClient.get("/products?limit=100");
      setProductsList(res.data.products);
    } catch (err) {
      console.error("Failed to load products list for stock log", err);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [page, search, movementType]);

  useEffect(() => {
    fetchProductsList();
  }, []);

  const handleOpenLogModal = (type: "IN" | "OUT") => {
    setFormData({
      productId: productsList.length > 0 ? String(productsList[0].id) : "",
      quantityChanged: 5,
      movementType: type,
      reason: type === "IN" ? "Restock Shipment Intake" : "Internal Allocation / Sample Dispatch",
    });
    setFormError(null);
    setIsLogModalOpen(true);
  };

  const handleLogStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
      setFormError("Please select a product");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      await apiClient.post("/stock-movements", {
        productId: Number(formData.productId),
        quantityChanged: Number(formData.quantityChanged),
        movementType: formData.movementType,
        reason: formData.reason,
      });

      setIsLogModalOpen(false);
      fetchMovements();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to log stock movement");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-heading">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Stock Movement & Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track inventory intake, allocations, and anti-negative stock enforcement</p>
        </div>

        {canLogStock && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenLogModal("IN")}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Stock IN (+ Intake)</span>
            </button>
            <button
              onClick={() => handleOpenLogModal("OUT")}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Stock OUT (- Allocation)</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Filter Bento */}
      <BentoCard glowColor="blue" className="p-3.5">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product name, SKU, or audit reason..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-medium"
            />
          </div>

          <select
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="">All Movement Types</option>
            <option value="IN">IN (Stock Intake)</option>
            <option value="OUT">OUT (Stock Deduction)</option>
          </select>
        </div>
      </BentoCard>

      {/* Cyber Table */}
      <BentoCard glowColor="blue" className="p-0 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Product Name & SKU</th>
                <th className="py-3.5 px-4">Movement Type</th>
                <th className="py-3.5 px-4">Quantity Changed</th>
                <th className="py-3.5 px-4">Audit Reason</th>
                <th className="py-3.5 px-4">Logged By User</th>
                <th className="py-3.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                    Loading stock movement logs...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No stock movements found matching your filters.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.product?.name || "N/A"}</div>
                      <div className="font-mono text-[10px] text-blue-600 font-medium">
                        {m.product?.sku}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        text={m.movementType}
                        variant={m.movementType === "IN" ? "success" : "danger"}
                        size="sm"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-sm font-mono">
                      <span className={m.movementType === "IN" ? "text-emerald-700" : "text-rose-700"}>
                        {m.movementType === "IN" ? "+" : "-"}{m.quantityChanged} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{m.reason}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.creator?.name}</div>
                      <div className="text-[10px] text-slate-500">{m.creator?.role}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={8}
          onPageChange={(p) => setPage(p)}
        />
      </BentoCard>

      {/* LOG STOCK MOVEMENT MODAL */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={formData.movementType === "IN" ? "Log Stock Intake (Stock IN)" : "Log Stock Allocation (Stock OUT)"}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleLogStockMovement} className="space-y-4 text-xs font-heading">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              required
            >
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available Stock: {p.currentStock} units
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Quantity to {formData.movementType === "IN" ? "Add (+)" : "Deduct (-)"} *
            </label>
            <input
              type="number"
              min={1}
              required
              value={formData.quantityChanged}
              onChange={(e) => setFormData({ ...formData, quantityChanged: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
            />
            {formData.movementType === "OUT" && (
              <p className="text-[10px] text-amber-700 mt-1 font-mono">
                System prevents negative stock if deduction exceeds available quantity.
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Audit Reason / Order Reference *</label>
            <input
              type="text"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Shipment Intake PO #4892"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className={`px-5 py-2 rounded-xl text-white font-semibold shadow-xs disabled:opacity-50 ${
                formData.movementType === "IN"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-rose-600 hover:bg-rose-500"
              }`}
            >
              {formSubmitting ? "Logging..." : `Confirm ${formData.movementType} Log`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
