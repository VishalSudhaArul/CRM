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
  MessageSquarePlus,
  Trash2,
  Calendar,
  Building,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export const CustomerPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "SALES");

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals & Slide-Over Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    businessName: "",
    gstNumber: "",
    customerType: "RETAIL",
    address: "",
    status: "LEAD",
    followUpDate: "",
    notes: "",
  });

  // Follow-up Form State
  const [followUpNote, setFollowUpNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { page, limit: 8 };
      if (search) params.search = search;
      if (customerType) params.customerType = customerType;
      if (status) params.status = status;

      const res = await apiClient.get("/customers", { params });
      setCustomers(res.data.customers);
      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search, customerType, status]);

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      mobile: "",
      email: "",
      businessName: "",
      gstNumber: "",
      customerType: "RETAIL",
      address: "",
      status: "LEAD",
      followUpDate: "",
      notes: "",
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber || "",
      customerType: customer.customerType,
      address: customer.address,
      status: customer.status,
      followUpDate: customer.followUpDate ? customer.followUpDate.slice(0, 10) : "",
      notes: customer.notes || "",
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDetailDrawer = async (id: number) => {
    try {
      const res = await apiClient.get(`/customers/${id}`);
      setSelectedCustomer(res.data.customer);
      setIsDetailDrawerOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to fetch customer details");
    }
  };

  const handleOpenFollowUpModal = (customer: any) => {
    setSelectedCustomer(customer);
    setFollowUpNote("");
    setNextFollowUpDate(customer.followUpDate ? customer.followUpDate.slice(0, 10) : "");
    setFormError(null);
    setIsFollowUpModalOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setFormError(null);
      await apiClient.post("/customers", formData);
      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create customer");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setFormError(null);
      await apiClient.put(`/customers/${selectedCustomer.id}`, formData);
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to update customer");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddFollowUpNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpNote.trim()) {
      setFormError("Follow-up note content is required");
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError(null);
      await apiClient.post(`/customers/${selectedCustomer.id}/follow-up`, {
        notes: followUpNote,
        followUpDate: nextFollowUpDate || undefined,
      });
      setIsFollowUpModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to log follow-up note");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await apiClient.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete customer");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900 tracking-tight">Customer CRM Hub</h2>
          <p className="text-xs text-slate-500 font-heading mt-0.5">Manage accounts, leads, follow-ups, and business profiles</p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold font-heading shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Customer</span>
          </button>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-heading font-semibold">
          {error}
        </div>
      )}

      {/* Bento Filter Bar */}
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
              placeholder="Search by customer name, email, mobile, business, GST..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-heading font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto font-heading">
            <select
              value={customerType}
              onChange={(e) => {
                setCustomerType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="">All Customer Types</option>
              <option value="RETAIL">RETAIL</option>
              <option value="WHOLESALE">WHOLESALE</option>
              <option value="DISTRIBUTOR">DISTRIBUTOR</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="LEAD">LEAD</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </BentoCard>

      {/* Cyber Table Container */}
      <BentoCard glowColor="blue" className="p-0 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider font-heading">
                <th className="py-3.5 px-4">Customer & Business</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Follow-up Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                    Loading CRM database stream...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-heading">
                    No customer accounts found matching your query.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-heading">{c.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center mt-0.5 font-heading">
                        <Building className="w-3 h-3 mr-1 text-blue-600" />
                        {c.businessName}
                        {c.gstNumber && (
                          <span className="ml-2 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 border border-slate-200">
                            GST: {c.gstNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center text-slate-700 font-mono">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" /> {c.mobile}
                      </div>
                      <div className="flex items-center text-slate-500 text-[11px] font-mono mt-0.5">
                        <Mail className="w-3 h-3 mr-1 text-slate-400" /> {c.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        text={c.customerType}
                        variant={
                          c.customerType === "WHOLESALE"
                            ? "info"
                            : c.customerType === "DISTRIBUTOR"
                            ? "info"
                            : "neutral"
                        }
                        size="sm"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        text={c.status}
                        variant={
                          c.status === "ACTIVE"
                            ? "success"
                            : c.status === "LEAD"
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      {c.followUpDate ? (
                        <div className="flex items-center text-amber-800 font-mono font-semibold">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          {new Date(c.followUpDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenDetailDrawer(c.id)}
                          title="Open Slide-Over Profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => handleOpenFollowUpModal(c)}
                              title="Log Follow-up Note"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <MessageSquarePlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(c)}
                              title="Edit Customer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(c.id)}
                              title="Delete Account"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* SLIDE-OVER DRAWER FOR CUSTOMER DETAILS */}
      <SlideOverDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={`Customer Profile: ${selectedCustomer?.name}`}
        subtitle={selectedCustomer?.businessName}
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs text-slate-700 font-heading">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Contact Person</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedCustomer.name}</p>
                <p className="text-slate-600 font-mono mt-1">{selectedCustomer.email}</p>
                <p className="text-slate-600 font-mono">{selectedCustomer.mobile}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Business Entity</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedCustomer.businessName}</p>
                <p className="text-slate-600 font-mono mt-1">GST: {selectedCustomer.gstNumber || "N/A"}</p>
                <div className="flex space-x-2 mt-2">
                  <Badge text={selectedCustomer.customerType} variant="info" size="sm" />
                  <Badge text={selectedCustomer.status} variant="success" size="sm" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Billing Address</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start text-slate-700">
                <MapPin className="w-4 h-4 mr-2 text-blue-600 shrink-0 mt-0.5" />
                <span>{selectedCustomer.address}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Follow-up Notes & Log Stream</p>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
                {selectedCustomer.notes || "No follow-up notes recorded."}
              </div>
            </div>

            {selectedCustomer.salesChallans && selectedCustomer.salesChallans.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono font-bold mb-2">Recent Sales Orders</p>
                <div className="space-y-2">
                  {selectedCustomer.salesChallans.map((ch: any) => (
                    <div key={ch.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 font-mono">{ch.challanNumber}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">{new Date(ch.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-blue-600 font-mono">₹{ch.totalAmount.toLocaleString("en-IN")}</span>
                        <Badge text={ch.status} variant={ch.status === "CONFIRMED" ? "success" : "warning"} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>

      {/* ADD / EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? "Provision New Customer Account" : `Edit Customer: ${selectedCustomer?.name}`}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-heading">
            {formError}
          </div>
        )}

        <form onSubmit={isAddModalOpen ? handleCreateCustomer : handleUpdateCustomer} className="space-y-4 text-xs font-heading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Acme Global Solutions"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+91-9876543210"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@acme.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST Number (Optional)</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="27AAACA12341Z1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Type *</label>
              <select
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="RETAIL">RETAIL</option>
                <option value="WHOLESALE">WHOLESALE</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="LEAD">LEAD</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Billing Address *</label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full street address, city, state, postal code"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Initial Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Important notes regarding client requirements, payment terms..."
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
              {formSubmitting ? "Saving..." : isAddModalOpen ? "Create Account" : "Update Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* LOG FOLLOW-UP NOTE MODAL */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title={`Append Follow-up Note: ${selectedCustomer?.name}`}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-heading">
            {formError}
          </div>
        )}

        <form onSubmit={handleAddFollowUpNote} className="space-y-4 text-xs font-heading">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Next Scheduled Follow-up Date</label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Follow-up Note Details *</label>
            <textarea
              required
              rows={4}
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="Discussed pricing terms, client requested revised quotation..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsFollowUpModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              {formSubmitting ? "Saving..." : "Append Follow-up Note"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
