import React from "react";
import { Link } from "react-router-dom";
import "./hero.css";

export const Hero = () => {
  return (
    <section className="hero">
      <div className="hero__inner">
        {/* Badge */}
        <div className="hero__badge">
          <span className="hero__badgeIcon">⚡</span>
          Powered by Vara Network
        </div>

        {/* Title */}
        <h1 className="hero__title">
          <span className="hero__titleLine">Launch a Live Economy</span>
          <span className="hero__titleAccent">From a Single Prompt</span>
        </h1>

        {/* Subtitle */}
        <p className="hero__subtitle">
          EkronOS is the Economic Operating System. Describe your vision and we generate
          tokenomics, smart contracts, DEX listings, and a live application — all orchestrated by AI.
        </p>

        {/* Actions */}
        <div className="hero__actions">
          <Link
            to="/dashboard"
            className="heroBtn heroBtn--primary"
          >
            Launch Project →
          </Link>

          <Link
            to="/projects"
            className="heroBtn heroBtn--ghost"
          >
            Explore Projects
          </Link>
        </div>

        {/* Stats */}
        <div className="hero__stats">
          <div>
            <strong>127</strong>
            <span>Economies Launched</span>
          </div>
          <div>
            <strong>$4.2M</strong>
            <span>Total Value Locked</span>
          </div>
          <div>
            <strong>8,400+</strong>
            <span>Active Users</span>
          </div>
          <div>
            <strong>512</strong>
            <span>Contracts Deployed</span>
          </div>
        </div>
      </div>
    </section>
  );
};
