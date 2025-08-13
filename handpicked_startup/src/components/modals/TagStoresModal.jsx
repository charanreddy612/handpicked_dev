// src/components/tags/TagStoresModal.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  getStoresByTag,
  addStoreToTag,
  removeStoreFromTag,
  searchStores,
} from "../../services/tagStoreService";

export default function TagStoresModal({ tagId, onClose }) {
  const [linkedStores, setLinkedStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const searchRef = useRef(null);

  // Fetch linked stores
  useEffect(() => {
    const fetchLinkedStores = async () => {
      // UPDATED: Use { data, error } structure
      const { data, error } = await getStoresByTag(tagId);
      if (error) {
        console.error("Error fetching linked stores:", error.message);
        setLinkedStores([]);
      } else if (Array.isArray(data)) {
        setLinkedStores(data);
      }
      setLoading(false);
    };
    fetchLinkedStores();
  }, [tagId]);

  // Search stores live
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      // UPDATED: Use { data, error } structure
      const { data, error } = await searchStores(searchTerm);
      if (error) {
        console.error("Error searching stores:", error.message);
        setSearchResults([]);
      } else if (Array.isArray(data)) {
        setSearchResults(data);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSelectStore = (store) => {
    setSelectedStore(store);
    setSearchTerm(store.name);
    setSearchResults([]);
  };

  const handleAddStore = async () => {
    if (!selectedStore) return;
    setAdding(true);
    // UPDATED: Use { error }
    const { error } = await addStoreToTag(tagId, selectedStore.id);
    if (error) {
      console.error("Error adding store to tag:", error.message);
    } else {
      setLinkedStores((prev) => [...prev, selectedStore]);
      setSelectedStore(null);
      setSearchTerm("");
    }
    setAdding(false);
  };

  const handleRemoveStore = async (storeId) => {
    setRemovingId(storeId);
    // UPDATED: Use { error }
    const { error } = await removeStoreFromTag(tagId, storeId);
    if (error) {
      console.error("Error removing store:", error.message);
    } else {
      setLinkedStores((prev) => prev.filter((s) => s.id !== storeId));
    }
    setRemovingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative">
        <h2 className="text-xl font-semibold mb-4">Manage Stores for Tag</h2>

        {/* Search */}
        <div className="relative mb-4" ref={searchRef}>
          <input
            type="text"
            placeholder="Search for store..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedStore(null);
            }}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
          />
          {searchResults.length > 0 && (
            <ul className="absolute z-10 bg-white border w-full rounded mt-1 max-h-48 overflow-y-auto shadow">
              {searchResults.map((store) => (
                <li
                  key={store.id}
                  onClick={() => handleSelectStore(store)}
                  className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  {store.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add store button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleAddStore}
            disabled={!selectedStore || adding}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {adding ? "Adding..." : "Add Store"}
          </button>
        </div>

        {/* Linked stores list */}
        <div>
          <h3 className="text-lg font-medium mb-2">Linked Stores</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading stores...</p>
          ) : linkedStores.length === 0 ? (
            <p className="text-sm text-gray-500">
              No stores linked to this tag.
            </p>
          ) : (
            <ul className="divide-y">
              {linkedStores.map((store) => (
                <li
                  key={store.id}
                  className="flex justify-between items-center py-2"
                >
                  <span>{store.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStore(store.id)}
                    disabled={removingId === store.id}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 text-sm"
                  >
                    {removingId === store.id ? "Removing..." : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Close button */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}