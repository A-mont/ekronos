import React from "react";
import "./roadmap.css";

type Phase = {
  phase: string;
  title: string;
  desc: string;
  badge?: string;
  featured?: boolean;
};

const phases: Phase[] = [
  {
    phase: "PHASE 1",
    title: "Vara Network",
    desc: "Core platform launch on Vara with AI-powered project creation.",
    badge: "In Progress",
    featured: true,
  },
  {
    phase: "PHASE 2",
    title: "Ethereum Expansion",
    desc: "Cross-chain deployment to Ethereum with bridge infrastructure.",
  },
  {
    phase: "PHASE 3",
    title: "Vara.eth",
    desc: "Full interoperability with Vara.eth for seamless multi-chain economies.",
  },
];

export const Roadmap = () => {
  return (
    <section className="rm" id="roadmap">
      <div className="rm__inner">
        <div className="rm__head">
          <div className="rm__kicker">ROADMAP</div>
          <h2 className="rm__title">Building the future of economic infrastructure</h2>
        </div>

        <div className="rm__grid">
          {phases.map((p) => (
            <article className={`rmCard ${p.featured ? "rmCard--featured" : ""}`} key={p.phase}>
              <div className="rmCard__phase">{p.phase}</div>
              <h3 className="rmCard__title">{p.title}</h3>
              <p className="rmCard__desc">{p.desc}</p>

              {p.badge ? <div className="rmBadge">{p.badge}</div> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
