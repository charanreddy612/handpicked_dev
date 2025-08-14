// src/components/blogs/ViewBlogModal.jsx
import React, { useEffect, useState } from "react";
import { getBlog } from "../../services/blogService";

export default function ViewBlogModal({ blogId, onClose }) {
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await getBlog(blogId);
      setBlog(data);
    })();
  }, [blogId]);

  if (!blog) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-white">
        Loading blog...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{blog.title}</h2>

        <p className="text-sm text-gray-500 mb-2">
          Slug: {blog.slug}
        </p>
        <p className="text-sm text-gray-500 mb-2">
          Category: {blog.category_name}
        </p>
        <p className="text-sm text-gray-500 mb-2">
          Author: {blog.author_name}
        </p>

        <div className="my-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />

        {blog.featured_thumb && (
          <div className="my-4">
            <strong>Featured Thumb:</strong>
            <img src={blog.featured_thumb} alt="Thumb" className="mt-2 max-h-40 object-cover" />
          </div>
        )}
        {blog.featured_image && (
          <div className="my-4">
            <strong>Featured Image:</strong>
            <img src={blog.featured_image} alt="Featured" className="mt-2 max-h-60 object-cover" />
          </div>
        )}

        <div className="mt-4"><strong>Meta Title:</strong> {blog.meta_title}</div>
        <div className="mt-2"><strong>Meta Keywords:</strong> {blog.meta_keywords}</div>
        <div className="mt-2"><strong>Meta Description:</strong> {blog.meta_description}</div>

        <div className="mt-4"><strong>Published:</strong> {blog.is_publish ? "Yes" : "No"}</div>
        <div className="mt-1"><strong>Featured:</strong> {blog.is_featured ? "Yes" : "No"}</div>
        <div className="mt-1"><strong>Top:</strong> {blog.is_top ? "Yes" : "No"}</div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="border px-4 py-2 rounded">Close</button>
        </div>
      </div>
    </div>
  );
}
