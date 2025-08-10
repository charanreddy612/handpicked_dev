import { useState } from "react";
import { FiFolder, FiPlus, FiEye } from "react-icons/fi";

const menuItems = [
  {
    title: "Merchants",
    icon: <FiFolder />,
    children: [
      { label: "Add Merchant", icon: <FiPlus /> },
      { label: "View Merchants", icon: <FiEye /> },
    ],
  },
  {
    title: "Coupons",
    icon: <FiFolder />,
    children: [
      { label: "Add Coupon", icon: <FiPlus /> },
      { label: "View Coupons", icon: <FiEye /> },
    ],
  },
  {
    title: "Tags",
    icon: <FiFolder />,
    children: [
      { label: "Add Tag", icon: <FiPlus /> },
      { label: "Manage Tags", icon: <FiEye /> },
    ],
  },
  {
    title: "Banners",
    icon: <FiFolder />,
    children: [
      { label: "Upload Banner", icon: <FiPlus /> },
      { label: "Manage Banners", icon: <FiEye /> },
    ],
  },
];

export default function SidebarMenu({ isCollapsed }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <nav aria-label="Admin Sidebar Menu" className="px-2">
      <ul role="list" className="space-y-1">
        {menuItems.map((item, index) => (
          <li key={item.title}>
            <button
              onClick={() => toggleIndex(index)}
              aria-expanded={openIndex === index}
              aria-controls={`submenu-${index}`}
              className="flex items-center w-full p-2 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && (
                <span className="ml-3 font-medium">{item.title}</span>
              )}
            </button>
            {openIndex === index && !isCollapsed && (
              <ul
                id={`submenu-${index}`}
                role="group"
                className="pl-8 mt-1 space-y-1"
              >
                {item.children.map((subItem) => (
                  <li key={subItem.label}>
                    <a
                      href={`/dashboard/${subItem.label
                        .toLowerCase()
                        .replace(/ /g, "-")}`}
                      className="flex items-center p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-md"
                    >
                      <span className="text-base">{subItem.icon}</span>
                      <span className="ml-2">{subItem.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}