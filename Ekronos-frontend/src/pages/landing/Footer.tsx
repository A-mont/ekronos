import React from "react";
import "./footer.css";

export const Footer = () => {
  return (
    <footer className="ft" data-reveal-section="ft">
      <div className="ft__inner reveal-will-change" data-reveal-item>
        {/* Left: brand */}
        <div className="ft__brand">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ft__logo"
            aria-hidden="true"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span className="ft__name">EkronOS</span>
        </div>

        {/* Center: tagline */}
        <p className="ft__tagline">
          The Economic Operating System. Built for creators, powered by AI.
        </p>

        {/* Right: copyright */}
        <p className="ft__copy">© 2026 EkronOS. All rights reserved.</p>
      </div>
    </footer>
  );
};
