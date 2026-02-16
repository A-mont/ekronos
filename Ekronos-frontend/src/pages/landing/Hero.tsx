import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import './hero.css';

export const Hero = () => {
  return (
    <section className="hero" data-reveal-section="hero">
      <div className="hero__inner">
        <div className="hero__badge reveal-will-change" data-reveal-item data-hero-intro="badge">
          ⚡ Powered by Vara Network
        </div>

        <h1 className="hero__title">
          <span className="hero__titleLine reveal-will-change" data-reveal-item data-hero-intro="title-line">
            Launch a Live Economy
          </span>
          <span className="hero__titleAccent reveal-will-change" data-reveal-item data-hero-intro="title-accent">
            From a Single Prompt
          </span>
        </h1>

        <p className="hero__subtitle reveal-will-change" data-reveal-item data-hero-intro="subtitle">
          EkronOS is the Economic Operating System. Describe your vision and we generate tokenomics,
          deployment plans, and a launch flow orchestrated by AI.
        </p>

        <div className="hero__actions reveal-will-change" data-reveal-item data-hero-intro="actions">
          <Button asChild className="heroBtn heroBtn--primary">
            <Link to="/dashboard">Launch Project →</Link>
          </Button>

          <Button asChild variant="ghost" className="heroBtn heroBtn--ghost">
            <Link to="/dashboard/projects">Explore Projects</Link>
          </Button>
        </div>

        <div className="hero__stats">
          <div className="reveal-will-change" data-reveal-item data-hero-intro="stat">
            <strong>127</strong>
            <span>Economies Launched</span>
          </div>
          <div className="reveal-will-change" data-reveal-item data-hero-intro="stat">
            <strong>$4.2M</strong>
            <span>Total Value Locked</span>
          </div>
          <div className="reveal-will-change" data-reveal-item data-hero-intro="stat">
            <strong>8,400+</strong>
            <span>Active Users</span>
          </div>
          <div className="reveal-will-change" data-reveal-item data-hero-intro="stat">
            <strong>512</strong>
            <span>Contracts Deployed</span>
          </div>
        </div>
      </div>
    </section>
  );
};
