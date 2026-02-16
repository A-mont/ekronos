import { useState } from 'react';
import { Switch } from '@base-ui-components/react/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './settings-page.css';

type SettingsSwitchProps = {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  ariaLabel: string;
};

const SettingsSwitch = ({ checked, onChange, ariaLabel }: SettingsSwitchProps) => {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={ariaLabel}
      className={`sw ${checked ? 'is-on' : ''}`}
    >
      <Switch.Thumb className="sw__knob" />
    </Switch.Root>
  );
};

export const SettingsPage = () => {
  const [displayName, setDisplayName] = useState('Creator');
  const [email, setEmail] = useState('creator@ekronos.xyz');

  const [deployAlerts, setDeployAlerts] = useState(true);
  const [riskWarnings, setRiskWarnings] = useState(true);

  return (
    <section className="set">
      <div className="set__inner">
        <header className="set__head">
          <h1 className="set__title">Settings</h1>
          <p className="set__sub">Manage your account and platform preferences.</p>
        </header>

        <div className="setCard">
          <div className="setCard__top">
            <h2 className="setCard__title">Profile</h2>
            <p className="setCard__desc">Your creator profile information.</p>
          </div>

          <div className="setForm">
            <div className="setField">
              <Label htmlFor="displayName" className="setLabel">
                Display Name
              </Label>
              <Input
                id="displayName"
                name="displayName"
                autoComplete="name"
                className="setInput"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="setField">
              <Label htmlFor="email" className="setLabel">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="setInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button className="setBtn" type="button">
              Save Changes
            </Button>
          </div>
        </div>

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
              <SettingsSwitch
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
              <SettingsSwitch
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
