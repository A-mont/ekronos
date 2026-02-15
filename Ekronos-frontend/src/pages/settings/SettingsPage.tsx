import React, { useState } from "react";
import "./settings-page.css";
import { FiBell } from "react-icons/fi";

const Switch = ({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) => {
  return (
    <button
      type="button"
      className={`sw ${checked ? "is-on" : ""}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={ariaLabel}
    >
      <span className="sw__knob" />
    </button>
  );
};

export const SettingsPage = () => {
  const [displayName, setDisplayName] = useState("Creator");
  const [email, setEmail] = useState("creator@ekronos.xyz");

  const [deployAlerts, setDeployAlerts] = useState(true);
  const [riskWarnings, setRiskWarnings] = useState(true);

  return (
    <section className="set">
      <div className="set__inner">
        {/* Page header */}
        <header className="set__head">
          <h1 className="set__title">Settings</h1>
          <p className="set__sub">Manage your account and platform preferences.</p>
        </header>

        {/* Profile card */}
        <div className="setCard">
          <div className="setCard__top">
            <h2 className="setCard__title">Profile</h2>
            <p className="setCard__desc">Your creator profile information.</p>
          </div>

          <div className="setForm">
            <div className="setField">
              <label className="setLabel">Display Name</label>
              <input
                className="setInput"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="setField">
              <label className="setLabel">Email</label>
              <input
                className="setInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button className="setBtn" type="button">
              Save Changes
            </button>
          </div>
        </div>

        {/* Notifications card */}
        <div className="setCard setCard--spaced">
          <div className="setCard__top">
            <h2 className="setCard__title">Notifications</h2>
            <p className="setCard__desc">Configure how you receive updates.</p>
          </div>

          <div className="setList">
            <div className="setRow">
              <div className="setRow__left">
                <div className="setRow__title">Deploy Alerts</div>
                <div className="setRow__sub">Get notified when a deployment completes.</div>
              </div>
              <Switch
                checked={deployAlerts}
                onChange={setDeployAlerts}
                ariaLabel="Toggle deploy alerts"
              />
            </div>

            <div className="setDivider" />

            <div className="setRow">
              <div className="setRow__left">
                <div className="setRow__title">Risk Warnings</div>
                <div className="setRow__sub">Receive alerts for high-risk tokenomics changes.</div>
              </div>
              <Switch
                checked={riskWarnings}
                onChange={setRiskWarnings}
                ariaLabel="Toggle risk warnings"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
