import React from "react";
import "./header.css";

export const Header = () => {
  return (
    <header className="header">
      <div className="header__inner">
        {/* Logo */}
        <div className="header__left">
          <div className="logo">
            <span className="logo__icon" />
            <span className="logo__text">EkronOS</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="header__center">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#roadmap">Roadmap</a>
        </nav>

        {/* Actions */}
        <div className="header__right">
          <a href="#studio" className="btn btn--ghost">
            Creator Studio
          </a>
          <a href="#launch" className="btn btn--primary">
            Launch Project
          </a>
        </div>
      </div>
    </header>
  );
};
