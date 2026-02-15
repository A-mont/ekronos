import React from "react";
import "./creator-studio.css";
import {
  FiPlusCircle,
  FiLayers,
  FiDollarSign,
  FiUsers,
  FiActivity,
  FiArrowRight,
} from "react-icons/fi";

type Stat = {
  icon: React.ReactNode;
  value: string;
  label: string;
};

type Project = {
  name: string;
  status: "live" | "preview" | "draft";
  desc: string;
  tags: string[];
};

const stats: Stat[] = [
  { icon: <FiLayers size={18} />, value: "3", label: "Total Projects" },
  { icon: <FiDollarSign size={18} />, value: "$2.34M", label: "Total TVL" },
  { icon: <FiUsers size={18} />, value: "2,847", label: "Active Users" },
  { icon: <FiActivity size={18} />, value: "1", label: "Live Economies" },
];

const projects: Project[] = [
  {
    name: "NexToken Economy",
    status: "live",
    desc: "A community-driven DeFi protocol with sustainable tokenomics.",
    tags: ["DeFi", "Fair Launch"],
  },
  {
    name: "GameVault",
    status: "preview",
    desc: "A gaming economy with play-to-earn mechanics.",
    tags: ["Game", "Community Heavy"],
  },
  {
    name: "RealAsset DAO",
    status: "draft",
    desc: "Tokenized real-world assets with governance.",
    tags: ["RWA", "Team Allocation"],
  },
];

const StatusBadge = ({ status }: { status: Project["status"] }) => {
  const map = {
    live: { text: "live", cls: "badge badge--live" },
    preview: { text: "preview", cls: "badge badge--preview" },
    draft: { text: "draft", cls: "badge badge--draft" },
  }[status];

  return <span className={map.cls}>{map.text}</span>;
};

export const CreatorStudio = () => {
  return (
    <section className="cs">
      <div className="cs__inner">
        {/* Header */}
        <div className="cs__top">
          <div>
            <h1 className="cs__title">Creator Studio</h1>
            <p className="cs__sub">Manage your economies and launch new projects.</p>
          </div>

          <button className="csBtn">
            <span className="csBtn__icon" aria-hidden="true">
              <FiPlusCircle size={18} />
            </span>
            New Project
          </button>
        </div>

        {/* Stats */}
        <div className="cs__stats">
          {stats.map((s) => (
            <div className="statCard" key={s.label}>
              <div className="statCard__icon">{s.icon}</div>
              <div className="statCard__meta">
                <div className="statCard__value">{s.value}</div>
                <div className="statCard__label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        <div className="cs__row">
          <h2 className="cs__h2">Recent Projects</h2>
          <a className="cs__viewAll" href="#projects">
            View All <FiArrowRight />
          </a>
        </div>

        <div className="cs__projects">
          {projects.map((p) => (
            <article className="projCard" key={p.name}>
              <div className="projCard__top">
                <h3 className="projCard__title">{p.name}</h3>
                <StatusBadge status={p.status} />
              </div>

              <p className="projCard__desc">{p.desc}</p>

              <div className="projCard__tags">
                {p.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
