import React from "react";
import "./ux-philosophy.css";

type Step = {
  num: string;
  title: string;
  desc: string;
};

const steps: Step[] = [
  {
    num: "01",
    title: "Swap Into the Token",
    desc: "Users connect their wallet and swap into the project token via RivrDEX. Instant, permissionless access.",
  },
  {
    num: "02",
    title: "Use the Application",
    desc: "Token holders unlock the full application experience — staking, governance, utility features, and more.",
  },
  {
    num: "03",
    title: "Earn & Participate",
    desc: "Engage with the economy: stake for rewards, vote on proposals, earn incentives, and grow the ecosystem.",
  },
];

export const UxPhilosophy = () => {
  return (
    <section className="ux" id="how">
      <div className="ux__inner">
        <div className="ux__head">
          <div className="ux__kicker">UX PHILOSOPHY</div>
          <h2 className="ux__title">Swap → Use App</h2>
          <p className="ux__sub">
            Every project built on EkronOS follows a simple flow: swap into the token, then use the
            application. No complex onboarding.
          </p>
        </div>

        <div className="ux__flow">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <article className="uxCard">
                <div className="uxCard__num">{s.num}</div>
                <h3 className="uxCard__title">{s.title}</h3>
                <p className="uxCard__desc">{s.desc}</p>
              </article>

              {idx < steps.length - 1 ? (
                <div className="uxArrow" aria-hidden="true">
                  <span>→</span>
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
