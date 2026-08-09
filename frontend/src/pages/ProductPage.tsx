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
  Edit2,
  Eye,
  Trash2,
  AlertTriangle,
  MapPin,
} from "lucide-react";

export const ProductPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "WAREHOUSE");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Hardware",
    unitPrice: 0,
    currentStock: 0,
    minimumStock: 5,
    warehouseLocation: "",
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 8 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (lowStock) params.lowStock = "true";

      const res = await apiClient.get("/products", { params });
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, category, lowStock]);

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: "Hardware",
      unitPrice: 999,
      currentStock: 10,
      minimumStock: 5,
      warehouseLocation: "Rack A1",
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minimumStock: p.minimumStock,
      warehouseLocation: p.warehouseLocation,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDetailDrawer = (p: any) => {
    setSelectedProduct(p);
    setIsDetailDrawerOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setFormError(null);
      await apiClient.post("/products", formData);
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create product");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setFormError(null);
      await apiClient.put(`/products/${selectedProduct.id}`, formData);
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to update product");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      setError(null);
      await apiClient.delete(`/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete product";
      setError(msg);
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900 tracking-tight">Products & Inventory Catalog</h2>
          <p className="text-xs text-slate-500 font-heading mt-0.5">Manage SKU pricing, warehouse locations, and minimum threshold alerts</p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold font-heading shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product SKU</span>
          </button>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-heading font-semibold">
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
              placeholder="Search by product name, SKU, or category..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-heading font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto font-heading">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Hardware">Hardware</option>
              <option value="Office Equipment">Office Equipment</option>
              <option value="Accessories">Accessories</option>
            </select>

            <button
              onClick={() => {
                setLowStock(!lowStock);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
                lowStock
                  ? "bg-amber-500 text-white border-amber-600 font-bold shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Only</span>
            </button>
          </div>
        </div>
      </BentoCard>

      {/* Cyber Table */}
      <BentoCard glowColor="blue" className="p-0 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider font-heading">
                <th className="py-3.5 px-4">Product Name & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-4">Available Stock</th>
                <th className="py-3.5 px-4">Warehouse Location</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                    Loading products catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-heading">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= p.minimumStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-heading">{p.name}</div>
                        <div className="font-mono text-[10px] text-blue-600 font-medium">{p.sku}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge text={p.category} variant="neutral" size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        ₹{p.unitPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold font-mono text-sm ${isLow ? "text-amber-700" : "text-slate-800"}`}>
                            {p.currentStock} units
                          </span>
                          {isLow && <Badge text="Low Stock" variant="warning" size="sm" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">Min Alert: {p.minimumStock}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-heading">
                        <div className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1" />
                          {p.warehouseLocation}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenDetailDrawer(p)}
                            title="View Details Drawer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit Product SKU"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                title="Delete SKU"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* PRODUCT SLIDE-OVER DRAWER */}
      <SlideOverDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={`Product SKU: ${selectedProduct?.name}`}
        subtitle={selectedProduct?.sku}
      >
        {selectedProduct && (
          <div className="space-y-4 text-xs text-slate-700 font-heading">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Product Name</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedProduct.name}</p>
                <p className="font-mono text-blue-600 text-xs mt-1">{selectedProduct.sku}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Pricing & Stock</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5 font-mono">
                  ₹{selectedProduct.unitPrice.toLocaleString("en-IN")}
                </p>
                <p className="text-slate-600 font-mono mt-1">
                  Available: <span className="font-bold text-emerald-600">{selectedProduct.currentStock} units</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Category</p>
                <p className="font-bold text-slate-800 mt-1">{selectedProduct.category}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Warehouse Rack Location</p>
                <p className="font-bold text-slate-800 mt-1">{selectedProduct.warehouseLocation}</p>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* ADD / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? "Add New Product SKU" : `Edit Product: ${selectedProduct?.name}`}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-heading">
            {formError}
          </div>
        )}

        <form onSubmit={isAddModalOpen ? handleCreateProduct : handleUpdateProduct} className="space-y-4 text-xs font-heading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="4K UltraHD Monitor"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PROD-MON-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Electronics"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                min={0}
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Stock Qty *</label>
              <input
                type="number"
                min={0}
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Stock Alert Qty *</label>
              <input
                type="number"
                min={0}
                required
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Warehouse Bay / Rack Location *</label>
            <input
              type="text"
              required
              value={formData.warehouseLocation}
              onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
              placeholder="Warehouse A - Bay 4 - Shelf B"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {formSubmitting ? "Saving..." : isAddModalOpen ? "Create Product" : "Update Product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
