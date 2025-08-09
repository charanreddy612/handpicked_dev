import { useState } from 'react';

const menuItems = [
  {
    title: "Merchants",
    children: ["Add Merchant", "View Merchants"],
  },
  {
    title: "Coupons",
    children: ["Add Coupon", "View Coupons"],
  },
  {
    title: "Tags",
    children: ["Add Tag", "Manage Tags"],
  },
  {
    title: "Banners",
    children: ["Upload Banner", "Manage Banners"],
  },
];

export default function SidebarMenu() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (index) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <nav aria-label="Admin Sidebar Menu">
      <ul role="list" style={{ listStyle: 'none', padding: 0 }}>
        {menuItems.map((item, index) => (
          <li key={item.title}>
            <button
              onClick={() => toggleIndex(index)}
              aria-expanded={openIndex === index}
              aria-controls={`submenu-${index}`}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {item.title}
            </button>
            {openIndex === index && (
              <ul
                id={`submenu-${index}`}
                role="group"
                style={{
                  paddingLeft: '1rem',
                  marginTop: '0.25rem',
                }}
              >
                {item.children.map((subItem) => (
                  <li key={subItem}>
                    <a
                      href={`/dashboard/${subItem.toLowerCase().replace(/ /g, '-')}`}
                      style={{ display: 'block', padding: '0.25rem 0' }}
                    >
                      {subItem}
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