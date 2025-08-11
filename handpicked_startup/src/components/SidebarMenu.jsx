import { useState, useEffect } from "react";
import * as FiIcons from "react-icons/fi"; // You can import from multiple packs if DB stores other icon sets

export default function SidebarMenu({ isCollapsed }) {
  const [menuItems, setMenuItems] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  // Load menus from localStorage on mount
  useEffect(() => {
    const storedMenus = localStorage.getItem("sidebarMenus");
    if (storedMenus) {
      try {
        setMenuItems(JSON.parse(storedMenus));
      } catch (err) {
        console.error("Failed to parse sidebarMenus:", err);
      }
    }
  }, []);

  const toggleIndex = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  // Helper to get icon component dynamically
  const getIcon = (iconName) => {
    if (!iconName) return null;
    const IconComponent = FiIcons[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <nav aria-label="Admin Sidebar Menu" className="px-2">
      <ul role="list" className="space-y-1">
        {menuItems.map((item, index) => (
          <li key={item.id || item.title}>
            <button
              onClick={() => toggleIndex(index)}
              aria-expanded={openIndex === index}
              aria-controls={`submenu-${index}`}
              className="flex items-center w-full p-2 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              <span className="text-lg">{getIcon(item.icon)}</span>
              {!isCollapsed && (
                <span className="ml-3 font-medium">{item.title}</span>
              )}
            </button>

            {openIndex === index && !isCollapsed && item.children?.length > 0 && (
              <ul
                id={`submenu-${index}`}
                role="group"
                className="pl-8 mt-1 space-y-1"
              >
                {item.children.map((subItem) => (
                  <li key={subItem.id || subItem.label}>
                    <a
                      href={`/dashboard/${subItem.label
                        .toLowerCase()
                        .replace(/ /g, "-")}`}
                      className="flex items-center p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-md"
                    >
                      <span className="text-base">{getIcon(subItem.icon)}</span>
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