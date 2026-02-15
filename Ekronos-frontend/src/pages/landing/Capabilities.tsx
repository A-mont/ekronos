import React from "react";
import "./capabilities.css";

type Capability = {
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent?: "teal" | "cyan";
};

const items: Capability[] = [
  {
    title: "Tokenomics Engine",
    desc: "AI-designed token allocation, emission curves, and utility models tailored to your project type.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2v6l4 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 22a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M7 12h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    accent: "cyan",
  },
  {
    title: "Smart Contracts on Vara",
    desc: "Automatically generated and auditable smart contracts deployed to the Vara network.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 4h10v16H7z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 8h6M9 12h6M9 16h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    accent: "teal",
  },
  {
    title: "RivrDEX Integration",
    desc: "Instant pool creation, liquidity seeding, and trading pairs on RivrDEX.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 7h10M7 17h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10 10l-3-3 3-3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 20l3-3-3-3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    accent: "cyan",
  },
  {
    title: "Economy Simulation",
    desc: "Run simulations before launch to stress-test your tokenomics and discover vulnerabilities.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 13h4l2-6 4 12 2-6h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    accent: "teal",
  },
  {
    title: "Guardrails & Safety Score",
    desc: "Built-in risk analysis covering inflation, liquidity, whale concentration, and utility gaps.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    accent: "cyan",
  },
  {
    title: "Multi-Chain Roadmap",
    desc: "Starting on Vara, expanding to Ethereum and Vara.eth for maximum interoperability.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M2 12h20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 2c3 3 5 7 5 10s-2 7-5 10c-3-3-5-7-5-10s2-7 5-10Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
    accent: "teal",
  },
];

export const Capabilities = () => {
  return (
    <section className="cap" id="features">
      <div className="cap__inner">
        <div className="cap__head">
          <div className="cap__kicker">CAPABILITIES</div>
          <h2 className="cap__title">Everything you need to launch an economy</h2>
          <p className="cap__sub">
            From token design to deployment, EkronOS handles the full stack of
            economic infrastructure.
          </p>
        </div>

        <div className="cap__grid">
          {items.map((it) => (
            <article className="capCard" key={it.title}>
              <div className={`capIcon capIcon--${it.accent || "cyan"}`}>
                {it.icon}
              </div>

              <h3 className="capCard__title">{it.title}</h3>
              <p className="capCard__desc">{it.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
