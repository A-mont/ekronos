import React, { useMemo } from "react";
import "./analytics-page.css";
import { FiTrendingUp, FiDollarSign, FiUsers, FiCreditCard } from "react-icons/fi";

type Stat = {
  icon: React.ReactNode;
  value: string;
  label: string;
};

const stats: Stat[] = [
  { icon: <FiTrendingUp size={18} />, value: "$4.5M", label: "Market Cap" },
  { icon: <FiDollarSign size={18} />, value: "$2.3M", label: "Total Value Locked" },
  { icon: <FiUsers size={18} />, value: "2,847", label: "Active Users" },
  { icon: <FiCreditCard size={18} />, value: "$1.25M", label: "Treasury" },
];

const formatK = (n: number) => `$${Math.round(n / 1000)}K`;

function buildPath(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  return points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
}

export const AnalyticsPage = () => {
  // Fake-but-realistic curve like the screenshot
  const series = useMemo(
    () => [
      520, 560, 600, 630, 660, 680, 720, 750, 780, 820,
      840, 870, 910, 950, 980, 1010, 1060, 1090, 1130, 1170,
      1210, 1250, 1275, 1300, 1340, 1380, 1400, 1430, 1470, 1500,
    ].map((v) => v * 1000),
    []
  );

  const labels = useMemo(
    () => [
      "Feb 2","Feb 4","Feb 6","Feb 8","Feb 10","Feb 12","Feb 14","Feb 16",
      "Feb 18","Feb 20","Feb 22","Feb 24","Feb 26","Feb 28","Feb 30",
    ],
    []
  );

  // SVG chart sizing
  const W = 1120;
  const H = 360;
  const padL = 78;
  const padR = 24;
  const padT = 22;
  const padB = 44;

  const yMax = 1600000; // 1600K
  const yMin = 0;

  const points = useMemo(() => {
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    return series.map((v, i) => {
      const x = padL + (innerW * i) / (series.length - 1);
      const t = (v - yMin) / (yMax - yMin);
      const y = padT + (1 - t) * innerH;
      return { x, y };
    });
  }, [series]);

  const linePath = useMemo(() => buildPath(points), [points]);
  const areaPath = useMemo(() => {
    if (!points.length) return "";
    const last = points[points.length - 1];
    const first = points[0];
    const baseY = H - padB;
    return `${linePath} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
  }, [linePath, points]);

  const yTicks = [
    0,
    400000,
    800000,
    1200000,
    1600000,
  ];

  return (
    <section className="an">
      <div className="an__inner">
        {/* header */}
        <header className="an__head">
          <h1 className="an__title">Analytics</h1>
          <p className="an__sub">Platform-wide performance metrics across all your projects.</p>
        </header>

        {/* stats */}
        <div className="an__stats">
          {stats.map((s) => (
            <div className="anStat" key={s.label}>
              <div className="anStat__icon">{s.icon}</div>
              <div className="anStat__meta">
                <div className="anStat__value">{s.value}</div>
                <div className="anStat__label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* chart card */}
        <div className="anChartCard">
          <div className="anChartCard__top">
            <h2 className="anChartCard__title">Total Value Locked</h2>
          </div>

          <div className="anChart">
            <svg
              className="anChart__svg"
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label="Total Value Locked chart"
            >
              {/* Grid */}
              <g opacity="0.9">
                {/* horizontal grid + labels */}
                {yTicks.map((t) => {
                  const innerH = H - padT - padB;
                  const y = padT + (1 - (t - yMin) / (yMax - yMin)) * innerH;

                  return (
                    <g key={t}>
                      <line
                        x1={padL}
                        x2={W - padR}
                        y1={y}
                        y2={y}
                        className="anChart__gridLine"
                      />
                      <text x={16} y={y + 5} className="anChart__yLabel">
                        {formatK(t)}
                      </text>
                    </g>
                  );
                })}

                {/* vertical grid based on label count */}
                {labels.map((_, i) => {
                  const innerW = W - padL - padR;
                  const x = padL + (innerW * i) / (labels.length - 1);
                  return (
                    <line
                      key={i}
                      x1={x}
                      x2={x}
                      y1={padT}
                      y2={H - padB}
                      className="anChart__gridLineV"
                    />
                  );
                })}
              </g>

              {/* Area fill */}
              <path d={areaPath} className="anChart__area" />

              {/* Line */}
              <path d={linePath} className="anChart__line" />

              {/* X labels */}
              {labels.map((lab, i) => {
                const innerW = W - padL - padR;
                const x = padL + (innerW * i) / (labels.length - 1);
                return (
                  <text key={lab} x={x} y={H - 14} textAnchor="middle" className="anChart__xLabel">
                    {lab}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};
