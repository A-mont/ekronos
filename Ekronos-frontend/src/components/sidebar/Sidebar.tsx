import React from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FiGrid,
  FiPlusCircle,
  FiFolder,
  FiBarChart2,
  FiSettings,
  FiArrowLeft,
} from "react-icons/fi";

import "./dashboard-sidebar.css";

type Item = {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
};

const items: Item[] = [
  { label: "Overview", to: "/dashboard", icon: <FiGrid size={20} /> },
  { label: "New Project", to: "/dashboard/new", icon: <FiPlusCircle size={20} />, badge: "New" },
  { label: "My Projects", to: "/dashboard/projects", icon: <FiFolder size={20} /> },
  { label: "Analytics", to: "/dashboard/analytics", icon: <FiBarChart2 size={20} /> },
  { label: "Settings", to: "/dashboard/settings", icon: <FiSettings size={20} /> },
];

export const Sidebar = () => {
  return (
    <aside className="dsb">
      <div className="dsb__glow dsb__glow--a" aria-hidden="true" />
      <div className="dsb__glow dsb__glow--b" aria-hidden="true" />

      {/* Top */}
      <div className="dsb__top">
        <div
          className="dsb__brand"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: "12px 8px",
          }}
        >
          <img
            src="/ekronos.png"
            alt="EkronOS"
            width={96}
            height={96}
            style={{ display: "block", objectFit: "contain" }}
          />

          <div className="dsb__brandMeta" style={{ textAlign: "center", lineHeight: 1.1 }}>
            <div className="dsb__brandText" style={{ fontWeight: 700 }}>
              EkronOS
            </div>
            <div className="dsb__brandSub" style={{ opacity: 0.8, fontSize: 12 }}>
              Economic OS
            </div>
          </div>
        </div>
      </div>

      <div className="dsb__divider" />

      {/* Nav */}
      <nav className="dsb__nav" aria-label="Dashboard Navigation">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/dashboard"}
            className={({ isActive }) => `dsb__item ${isActive ? "is-active" : ""}`}
          >
            <span className="dsb__leftAccent" aria-hidden="true" />
            <span className="dsb__icon">{it.icon}</span>

            <span className="dsb__labelWrap">
              <span className="dsb__label">{it.label}</span>
              {it.badge ? <span className="dsb__badge">{it.badge}</span> : null}
            </span>

            <span className="dsb__chev" aria-hidden="true">
              →
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="dsb__bottom">
        <div className="dsb__divider" />
        <Link to="/" className="dsb__back">
          <span className="dsb__backIcon" aria-hidden="true">
            <FiArrowLeft size={18} />
          </span>
          Back to Home
        </Link>
      </div>
    </aside>
  );
};
