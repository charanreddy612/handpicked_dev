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
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    if (!selectedMerchant) {
      setProofs([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    (async () => {
      const { data, error } = await fetchMerchantProofs(selectedMerchant.id);
      if (!mounted) return;
      if (!error) setProofs(data);
      else console.error("Error fetching proofs:", error);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [selectedMerchant, refreshKey]);

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

      {/* Merchant Selector */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Merchant</label>
        <select
          value={selectedMerchant?.id || ""}
          onChange={(e) =>
            setSelectedMerchant(
              merchants.find((m) => m.id === e.target.value) || null
            )
          }
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">-- Select Merchant --</option>
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.slug}
            </option>
          ))}
        </select>
      </div>

      {/* Proofs Table */}
      <div className="border rounded">
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
