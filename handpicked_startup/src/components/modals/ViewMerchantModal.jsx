// src/components/merchants/ViewMerchantModal.jsx
import React, { useEffect, useState } from "react";
import { getMerchant } from "../../services/merchantService";
import { getAllCategories } from "../../services/merchantCategoryService.js";
import useEscClose from "../hooks/useEscClose";
import DOMPurify from "dompurify";

/**
 * Helper: convert a TipTap (ProseMirror) JSON node tree to HTML.
 * Supports: doc, paragraph, heading, text (with marks), image, bullet_list,
 * ordered_list, list_item, blockquote, codeBlock, horizontal_rule, hard_break, link.
 */
function tiptapJsonToHtml(json) {
  if (!json) return "";

  const renderMarks = (text, marks = []) => {
    if (!marks || !marks.length) return escapeHtml(text);
    return marks.reduce((acc, mark) => {
      if (mark.type === "bold" || mark.type === "strong")
        return `<strong>${acc}</strong>`;
      if (mark.type === "italic" || mark.type === "em")
        return `<em>${acc}</em>`;
      if (mark.type === "underline") return `<u>${acc}</u>`;
      if (mark.type === "strike" || mark.type === "strike-through")
        return `<s>${acc}</s>`;
      if (mark.type === "code") return `<code>${acc}</code>`;
      if (mark.type === "link" && mark.attrs?.href)
        return `<a href="${escapeAttr(
          mark.attrs.href
        )}" target="_blank" rel="noopener noreferrer">${acc}</a>`;
      return acc;
    }, escapeHtml(text));
  };

  const renderNode = (node) => {
    if (!node) return "";
    const type = node.type;
    const content = Array.isArray(node.content)
      ? node.content.map(renderNode).join("")
      : "";

    switch (type) {
      case "doc":
        return content;
      case "paragraph":
        return `<p>${content}</p>`;
      case "heading": {
        const level = node.attrs?.level || 1;
        const lvl = Math.min(6, Math.max(1, Number(level)));
        return `<h${lvl}>${content}</h${lvl}>`;
      }
      case "text":
        return renderMarks(node.text || "", node.marks);
      case "image": {
        const attrs = node.attrs || {};
        const src = escapeAttr(attrs.src || "");
        const alt = escapeAttr(attrs.alt || "");
        const title = escapeAttr(attrs.title || "");
        const width = attrs.width ? ` width="${escapeAttr(attrs.width)}"` : "";
        const height = attrs.height
          ? ` height="${escapeAttr(attrs.height)}"`
          : "";
        const style = attrs.style ? ` style="${escapeAttr(attrs.style)}"` : "";
        return `<img src="${src}" alt="${alt}" title="${title}" ${width}${height}${style} />`;
      }
      case "bullet_list":
        return `<ul>${content}</ul>`;
      case "ordered_list":
        return `<ol>${content}</ol>`;
      case "list_item":
        return `<li>${content}</li>`;
      case "blockquote":
        return `<blockquote>${content}</blockquote>`;
      case "codeBlock":
      case "fenced_code":
        return `<pre><code>${escapeHtml(
          node.content?.map?.((n) => n.text || "").join("") || ""
        )}</code></pre>`;
      case "horizontal_rule":
        return `<hr />`;
      case "hard_break":
        return `<br/>`;
      case "paragraph_with_class": // fallback
        return `<p>${content}</p>`;
      default:
        // attempt to render children generically
        return content || (node.text ? renderMarks(node.text, node.marks) : "");
    }
  };

  // safe-guard: if root is string or already html
  if (typeof json === "string") return escapeHtml(json);
  if (json.type === "doc") return renderNode(json);
  // if it's an array of nodes
  if (Array.isArray(json)) return json.map(renderNode).join("");
  return renderNode(json);
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(str = "") {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export default function ViewMerchantModal({ merchantId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [m, setM] = useState(null);

  // all categories fetched from merchant_categories table
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getMerchant(merchantId);
        if (!mounted) return;
        setM(data || {});
      } catch (e) {
        console.error("Failed to load merchant:", e?.message || e);
        if (mounted) setM({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [merchantId]);

  // fetch and normalize categories list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingCats(true);
        const res = await getAllCategories();
        if (!mounted) return;
        if (res.length === 0) {
          console.error("Failed to load categories", res.status);
          setAllCategories([]);
          return;
        }
        const json = await res.json();
        const raw = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : json?.categories ?? [];

        // normalize to objects: { id?, name }
        const normalized = raw.map((c) =>
          typeof c === "string"
            ? { id: undefined, name: c }
            : {
                id: c.id ?? c._id ?? undefined,
                name: c.name ?? c.category_name ?? String(c.id ?? ""),
              }
        );
        setAllCategories(normalized);
      } catch (err) {
        console.error("Could not fetch categories:", err);
        setAllCategories([]);
      } finally {
        if (mounted) setLoadingCats(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // helpers to resolve category item (id | name | object) -> display name
  const buildLookups = () => {
    const byId = new Map();
    const byName = new Map();
    for (const c of allCategories) {
      if (c.id !== undefined && c.id !== null) byId.set(String(c.id), c.name);
      if (c.name) byName.set(String(c.name).toLowerCase(), c.name);
    }
    return { byId, byName };
  };

  const resolveCategoryName = (item) => {
    if (item == null) return "—";
    const { byId, byName } = buildLookups();

    // plain number (id)
    if (typeof item === "number") {
      return byId.get(String(item)) ?? String(item);
    }

    // plain string: could be id string or name
    if (typeof item === "string") {
      if (byId.has(item)) return byId.get(item);
      const lower = item.toLowerCase();
      if (byName.has(lower)) return byName.get(lower);
      return item;
    }

    // object shape { id, name } or { name: ... }
    if (typeof item === "object") {
      if (item.name) return item.name;
      if (item.id && byId.has(String(item.id)))
        return byId.get(String(item.id));
      return String(item);
    }

    return String(item);
  };

  const Bool = ({ v }) => (
    <span className={v ? "text-green-600" : "text-gray-500"}>
      {v ? "Yes" : "No"}
    </span>
  );

  const Field = ({ label, children }) => (
    <div>
      <div className="text-gray-600 mb-1">{label}</div>
      <div className="border rounded px-3 py-2">{children ?? "—"}</div>
    </div>
  );

  // close on ESC
  useEscClose(onClose);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-white">
        Loading…
      </div>
    );
  }

  // compute display string for categories (robust to id/name/object)
  const renderedCategories = (() => {
    const list = Array.isArray(m?.category_names) ? m.category_names : [];
    if (!list.length) return "—";
    return list.map((it) => resolveCategoryName(it)).join(", ");
  })();

  // Build HTML for description: prefer description_html; fall back to description_json; then description.
  const rawHtml = (() => {
    if (m?.description_html) return m.description_html;
    if (m?.description_json) {
      try {
        const json =
          typeof m.description_json === "string"
            ? JSON.parse(m.description_json)
            : m.description_json;
        return tiptapJsonToHtml(json);
      } catch (e) {
        console.warn("Failed to parse description_json", e);
        return m.description || "";
      }
    }
    return m?.description || "";
  })();

  // Allow width/height/style/alt/title for images and style attribute via ADD_ATTR
  const sanitizedHtml = DOMPurify.sanitize(rawHtml || "—", {
    ADD_ATTR: ["width", "height", "style", "alt", "title"],
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-6xl rounded shadow-lg p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">View Store</h2>
          <button className="border px-3 py-1 rounded" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Top basics */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">{m?.name}</Field>
          <Field label="Slug">{m?.slug}</Field>
        </div>

        {/* Categories */}
        <Field label="Categories">{renderedCategories}</Field>

        {/* URLs and tracker */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Web URL">{m?.web_url || m?.website}</Field>
          <Field label="Affiliate URL">{m?.aff_url}</Field>
        </div>
        <Field label="Tracker Lock">
          <Bool v={!!m?.tracker_lock} />
        </Field>

        {/* H1 */}
        <Field label="H1 Keyword">{m?.h1keyword}</Field>

        {/* Logo */}
        <div>
          <div className="text-gray-600 mb-1">Store Logo</div>
          {m?.logo_url || m?.logo ? (
            <img
              src={m.logo_url || m.logo}
              alt="logo"
              className="w-32 h-32 object-cover border rounded"
            />
          ) : (
            <div className="w-32 h-32 border rounded flex items-center justify-center text-xs text-gray-500">
              —
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Field label="SEO Title">{m?.meta_title}</Field>
          <Field label="SEO Keywords">{m?.meta_keywords}</Field>
          <Field label="SEO Description">{m?.meta_description}</Field>
        </div>

        {/* Content blocks */}
        <div className="mt-4 grid grid-cols-1 gap-4">
          <Field label="Side Description">
            <div className="prose max-w-none whitespace-pre-wrap">
              {m?.side_description_html || "—"}
            </div>
          </Field>
          <Field label="Description">
            <div
              className="my-6 prose max-w-none prose-img:rounded prose-img:max-h-[400px] prose-img:object-contain"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </Field>
          <Field label="Table Content">
            <div className="prose max-w-none whitespace-pre-wrap">
              {m?.table_content_html || "—"}
            </div>
          </Field>
        </div>

        {/* Ads and brand categories */}
        <div className="mt-4">
          <Field label="Ads Description">
            <div className="prose max-w-none whitespace-pre-wrap">
              {m?.ads_description_html || "—"}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Field label="Brand Categories">
              {Array.isArray(m?.brand_categories) && m.brand_categories.length
                ? m.brand_categories.join(", ")
                : "—"}
            </Field>
            <Field label="Ads Description (Label)">
              {m?.ads_description_label}
            </Field>
          </div>
        </div>

        {/* Toggles */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Sidebar">
            <Bool v={!!m?.sidebar} />
          </Field>
          <Field label="Home">
            <Bool v={!!m?.home} />
          </Field>
          <Field label="Ads Block All">
            <Bool v={!!m?.ads_block_all} />
          </Field>
          <Field label="Ads Block Banners">
            <Bool v={!!m?.ads_block_banners} />
          </Field>
          <Field label="Is Header">
            <Bool v={!!m?.is_header} />
          </Field>
          <Field label="Deals Home">
            <Bool v={!!m?.deals_home} />
          </Field>
          <Field label="Tag Home">
            <Bool v={!!m?.tag_home} />
          </Field>
          <Field label="Amazon Store">
            <Bool v={!!m?.amazon_store} />
          </Field>
          <Field label="Active">
            <Bool v={!!m?.active} />
          </Field>
          <Field label="Show at Search Bar">
            <Bool v={!!m?.show_at_search_bar} />
          </Field>
          <Field label="Extension Active">
            <Bool v={!!m?.extension_active} />
          </Field>
          <Field label="Extension Mandatory">
            <Bool v={!!m?.extension_mandatory} />
          </Field>
          <Field label="Is Header (2)">
            <Bool v={!!m?.is_header_2} />
          </Field>
        </div>

        {/* Radios */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Coupon Icon">{m?.coupon_icon_visibility || "—"}</Field>
          <Field label="Store Status">
            {m?.store_status_visibility || "—"}
          </Field>
        </div>

        {/* Lists */}
        <div className="mt-4 border rounded p-3">
          <div className="font-medium mb-2">Coupon H2 & Descriptions</div>
          {Array.isArray(m?.coupon_h2_blocks) && m.coupon_h2_blocks.length ? (
            <ul className="list-disc pl-6">
              {m.coupon_h2_blocks.map((b, i) => (
                <li key={i}>
                  {b.heading} — {b.description}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">—</div>
          )}
        </div>

        <div className="mt-4 border rounded p-3">
          <div className="font-medium mb-2">Coupon H3 & Descriptions</div>
          {Array.isArray(m?.coupon_h3_blocks) && m.coupon_h3_blocks.length ? (
            <ul className="list-disc pl-6">
              {m.coupon_h3_blocks.map((b, i) => (
                <li key={i}>
                  {b.heading} — {b.description}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">—</div>
          )}
        </div>

        <div className="mt-4 border rounded p-3">
          <div className="font-medium mb-2">Store Question and Answers</div>
          {Array.isArray(m?.faqs) && m.faqs.length ? (
            <ul className="list-disc pl-6">
              {m.faqs.map((qa, i) => (
                <li key={i}>
                  <span className="font-medium">{qa.question}</span> —{" "}
                  {qa.answer}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">—</div>
          )}
        </div>

        <div className="mt-4 border rounded p-3">
          <div className="font-medium mb-2">Store Suggestions</div>
          {Array.isArray(m?.suggestions) && m.suggestions.length ? (
            <ul className="list-disc pl-6">
              {m.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">—</div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button className="border px-4 py-2 rounded" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
