import React from "react";
import "./footer.css";

export const Footer = () => {
  return (
    <footer className="ft">
      <div className="ft__inner">
        {/* Left: brand */}
        <div className="ft__brand">
          <span className="ft__logo" aria-hidden="true" />
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
