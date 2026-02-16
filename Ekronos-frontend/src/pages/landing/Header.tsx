import React from "react";
import "./header.css";
import { Link } from "react-router-dom";
import { Button } from '@/components/ui/button';

export const Header = () => {
  return (
    <header className="header reveal-will-change" data-landing-header>
      <div className="header__inner">
        {/* Logo */}
        <div className="header__left">
          <div className="logo">
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
              className="logo__icon"
              aria-hidden="true"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
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
          <Button asChild variant="link" className="header__studio-link">
            <Link to="/dashboard">Creator Studio</Link>
          </Button>
          <Button asChild className="btn btn--primary">
            <Link to="/dashboard/new">Launch Project</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
