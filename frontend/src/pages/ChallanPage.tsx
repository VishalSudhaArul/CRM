import React, { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { BentoCard } from "../components/BentoCard";
import { SlideOverDrawer } from "../components/SlideOverDrawer";
import { Modal } from "../components/Modal";
import { Pagination } from "../components/Pagination";
import {
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Printer,
  Eye,
  AlertTriangle,
} from "lucide-react";

export const ChallanPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canCreate = hasRole("ADMIN", "SALES");
  const canUpdateStatus = hasRole("ADMIN", "SALES", "WAREHOUSE");

  const [challans, setChallans] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<any>(null);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Multi-item form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [initialStatus, setInitialStatus] = useState<"DRAFT" | "CONFIRMED">("DRAFT");
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: "", quantity: 1 },
  ]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 8 };
      if (search) params.search = search;
      if (status) params.status = status;

      const res = await apiClient.get("/challans", { params });
      setChallans(res.data.challans);
      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch sales challans");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        apiClient.get("/customers?limit=100"),
        apiClient.get("/products?limit=100"),
      ]);
      setCustomersList(custRes.data.customers);
      setProductsList(prodRes.data.products);
    } catch (err) {
      console.error("Error loading dropdown data", err);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [page, search, status]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedCustomerId(customersList.length > 0 ? String(customersList[0].id) : "");
    setInitialStatus("DRAFT");
    setItems([
      {
        productId: productsList.length > 0 ? String(productsList[0].id) : "",
        quantity: 1,
      },
    ]);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        productId: productsList.length > 0 ? String(productsList[0].id) : "",
        quantity: 1,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: "productId" | "quantity", value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      const prod = productsList.find((p) => String(p.id) === String(item.productId));
      if (!prod) return sum;
      return sum + prod.unitPrice * (item.quantity || 0);
    }, 0);
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setFormError("Please select a customer");
      return;
    }

    if (items.some((i) => !i.productId || i.quantity <= 0)) {
      setFormError("All item rows must have a selected product and quantity >= 1");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      await apiClient.post("/challans", {
        customerId: Number(selectedCustomerId),
        items: items.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
        })),
        status: initialStatus,
      });

      setIsCreateModalOpen(false);
      fetchChallans();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create sales challan");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: "CONFIRMED" | "CANCELLED") => {
    if (
      !confirm(
        `Are you sure you want to mark this challan as ${newStatus}? ${
          newStatus === "CONFIRMED"
            ? "Stock will be deducted from inventory."
            : "Stock will be restored if previously confirmed."
        }`
      )
    ) {
      return;
    }

    try {
      await apiClient.patch(`/challans/${id}/status`, { status: newStatus });
      fetchChallans();
      if (selectedChallan && selectedChallan.id === id) {
        setIsDetailDrawerOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to update status to ${newStatus}`);
    }
  };

  const handleOpenDetailDrawer = async (id: number) => {
    try {
      const res = await apiClient.get(`/challans/${id}`);
      setSelectedChallan(res.data.challan);
      setIsDetailDrawerOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to fetch challan detail");
    }
  };

  return (
    <div className="space-y-6 font-heading">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales Challans & Dispatch</h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate sales challans, manage product snapshots, and control stock deductions</p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Sales Challan</span>
          </button>
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
              placeholder="Search by challan number or customer business name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-medium"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="">All Challan Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </BentoCard>

      {/* Cyber Table */}
      <BentoCard glowColor="blue" className="p-0 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Challan Number</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items & Qty</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    Loading sales challans...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No sales challans found.
                  </td>
                </tr>
              ) : (
                challans.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">{c.challanNumber}</div>
                      <div className="text-[10px] text-slate-500">By {c.creator?.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.customer?.businessName || c.customer?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.customer?.mobile}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 font-mono">{c.totalQuantity} units</span>
                      <div className="text-[10px] text-slate-500">{c.items?.length || 0} line items</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">
                      ₹{c.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        text={c.status}
                        variant={
                          c.status === "CONFIRMED"
                            ? "success"
                            : c.status === "DRAFT"
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenDetailDrawer(c.id)}
                          title="Open Slide-Over Invoice Drawer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canUpdateStatus && c.status === "DRAFT" && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, "CONFIRMED")}
                            title="Confirm & Reduce Stock"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {canUpdateStatus && c.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, "CANCELLED")}
                            title="Cancel Challan"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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

      {/* CREATE SALES CHALLAN MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate New Sales Challan"
        maxWidth="2xl"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateChallan} className="space-y-4 text-xs font-heading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                required
              >
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.name}) — {c.customerType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Status *</label>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="DRAFT">DRAFT (No stock reduction)</option>
                <option value="CONFIRMED">CONFIRMED (Reduces inventory immediately)</option>
              </select>
            </div>
          </div>

          {/* Multi-item selector */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] font-mono">
                Challan Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            {items.map((item, index) => {
              const selectedProd = productsList.find((p) => String(p.id) === String(item.productId));
              const lineTotal = selectedProd ? selectedProd.unitPrice * (item.quantity || 0) : 0;

              return (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — ₹{p.unitPrice} [Available Stock: {p.currentStock}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="w-28 text-right font-bold font-mono text-blue-600">
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(index)}
                    disabled={items.length === 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/80 border border-blue-200">
            <span className="font-bold text-blue-900">Grand Total Amount:</span>
            <span className="text-base font-black font-mono text-blue-700">
              ₹{calculateGrandTotal().toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {formSubmitting ? "Creating..." : `Save as ${initialStatus}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* SLIDE-OVER DRAWER FOR CHALLAN INVOICE SNAPSHOT */}
      <SlideOverDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={`Challan Snapshot: ${selectedChallan?.challanNumber}`}
        subtitle={`Created on ${selectedChallan ? new Date(selectedChallan.createdAt).toLocaleString() : ""}`}
      >
        {selectedChallan && (
          <div className="space-y-6 text-xs text-slate-700 font-heading">
            <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Challan Status</span>
                <div className="mt-1">
                  <Badge
                    text={selectedChallan.status}
                    variant={
                      selectedChallan.status === "CONFIRMED"
                        ? "success"
                        : selectedChallan.status === "DRAFT"
                        ? "warning"
                        : "danger"
                    }
                  />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Issued By</span>
                <p className="font-bold text-slate-900 mt-1">{selectedChallan.creator?.name}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Billed Customer</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedChallan.customer?.businessName}</p>
                <p className="text-slate-600 mt-1">Contact: {selectedChallan.customer?.name}</p>
                <p className="text-slate-600 font-mono">Mobile: {selectedChallan.customer?.mobile}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Delivery Address</p>
                <p className="text-slate-700 leading-relaxed mt-0.5">{selectedChallan.customer?.address}</p>
                <p className="text-slate-500 font-mono mt-2">GSTIN: {selectedChallan.customer?.gstNumber || "N/A"}</p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold mb-2">Item Breakdown</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedChallan.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-blue-600">{item.productSku}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-blue-600">
                          ₹{item.totalPrice.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700 font-mono">Grand Total Amount:</span>
              <span className="text-xl font-black font-mono text-blue-700">
                ₹{selectedChallan.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>

              <div className="flex items-center space-x-2">
                {canUpdateStatus && selectedChallan.status === "DRAFT" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedChallan.id, "CONFIRMED")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 shadow-sm"
                  >
                    Confirm & Deduct Stock
                  </button>
                )}
                {canUpdateStatus && selectedChallan.status !== "CANCELLED" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedChallan.id, "CANCELLED")}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-500"
                  >
                    Cancel Challan
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};
