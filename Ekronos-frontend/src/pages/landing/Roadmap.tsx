import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import './roadmap.css';

type Phase = {
  phase: string;
  title: string;
  desc: string;
  badge?: string;
  featured?: boolean;
};

const phases: Phase[] = [
  {
    phase: 'PHASE 1',
    title: 'Vara Network',
    desc: 'Core platform launch on Vara with AI-powered project creation.',
    badge: 'Live',
    featured: true,
  },
  {
    phase: 'PHASE 2',
    title: 'Ethereum Expansion',
    desc: 'Cross-chain deployment to Ethereum with bridge infrastructure.',
    badge: 'Beta',
  },
  {
    phase: 'PHASE 3',
    title: 'Vara.eth',
    desc: 'Full interoperability with Vara.eth for seamless multi-chain economies.',
    badge: 'Planned',
  },
];

export const Roadmap = () => {
  return (
    <section className="rm" id="roadmap" data-reveal-section="rm">
      <div className="rm__inner">
        <div className="rm__head reveal-will-change" data-reveal-item>
          <div className="rm__kicker">ROADMAP</div>
          <h2 className="rm__title">Building the future of economic infrastructure</h2>
        </div>

        <div className="rm__grid">
          {phases.map((p) => (
            <Card className={`rmCard reveal-will-change ${p.featured ? 'rmCard--featured' : ''}`} key={p.phase} data-reveal-item>
              <div className="rmCard__phase">{p.phase}</div>
              <h3 className="rmCard__title">{p.title}</h3>
              <p className="rmCard__desc">{p.desc}</p>

              {p.badge ? <Badge variant="outline" className="rmBadge">{p.badge}</Badge> : null}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
