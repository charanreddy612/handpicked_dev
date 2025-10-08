// src/pages/coupons/CouponsValidationPage.jsx
import React, { useEffect, useState } from "react";
import { listMerchants } from "../services/merchantService.js";
import {
  fetchMerchantProofs,
  deleteProof,
} from "../services/couponsService.js";
import AddProofModal from "../components/modals/AddProofModal.jsx";

export default function CouponsValidationPage() {
  const [merchants, setMerchants] = useState([]);
  const [merchantSearch, setMerchantSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // Fetch merchants
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await listMerchants({ page: 1, limit: 1000 });
        if (!mounted) return;
        setMerchants(data);
      } catch (err) {
        console.error("Failed to load merchants:", err);
        setMerchants([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Filtered merchants for search
  const filteredMerchants = merchants.filter(
    (m) =>
      m.name?.toLowerCase().includes(merchantSearch.toLowerCase()) ||
      m.slug?.toLowerCase().includes(merchantSearch.toLowerCase())
  );

  // Fetch proofs for selected merchant with pagination
  useEffect(() => {
    if (!selectedMerchant) {
      setProofs([]);
      setPage(1);
      setTotalPages(1);
      return;
    }
    let mounted = true;
    setLoading(true);
    (async () => {
      const { data, error } = await fetchMerchantProofs(
        selectedMerchant.id,
        page,
        PAGE_SIZE
      );
      if (!mounted) return;
      if (!error) {
        setProofs(data.rows || []);
        setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE));
      } else {
        console.error("Error fetching proofs:", error);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [selectedMerchant, refreshKey, page]);

  const handleDeleteProof = async (id) => {
    if (!window.confirm("Delete this proof?")) return;
    const { error } = await deleteProof(id);
    if (!error) setRefreshKey((k) => k + 1);
    else console.error("Failed to delete proof:", error);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Coupons Validation</h1>
        {selectedMerchant && (
          <button
            className="bg-blue-600 text-white px-3 py-2 rounded"
            onClick={() => setShowAddModal(true)}
          >
            + Add Proof
          </button>
        )}
      </div>

      {/* Merchant Selector with Search */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Search Merchant</label>
        <input
          type="text"
          placeholder="Search by name or slug..."
          value={merchantSearch}
          onChange={(e) => setMerchantSearch(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-2"
        />
        <select
          value={selectedMerchant?.id || ""}
          onChange={(e) =>
            setSelectedMerchant(
              merchants.find((m) => m.id === Number(e.target.value)) || null
            )
          }
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">-- Select Merchant --</option>
          {filteredMerchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.slug}
            </option>
          ))}
        </select>
      </div>

      {/* Proofs Table */}
      <div className="border rounded mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">ID</th>
                <th className="text-left p-2 border-b">Filename / URL</th>
                <th className="text-left p-2 border-b">Uploaded At</th>
                <th className="text-left p-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center">
                    Loading…
                  </td>
                </tr>
              ) : proofs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center">
                    No proofs found.
                  </td>
                </tr>
              ) : (
                proofs.map((p) => (
                  <tr key={p.id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border-b">{p.id}</td>
                    <td className="p-2 border-b">{p.filename || p.url}</td>
                    <td className="p-2 border-b">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2 border-b">
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handleDeleteProof(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mb-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Proof Modal */}
      {showAddModal && selectedMerchant && (
        <AddProofModal
          merchant={selectedMerchant}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
