import React from "react";
import "./ekron-landing.css";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Capabilities } from "./Capabilities";
import { UxPhilosophy } from "./UxPhilosophy";
import { Roadmap } from "./Roadmap";
import { Footer } from "./footer";

type Stat = { value: string; label: string };
type Feature = { title: string; desc: string };
type Step = { num: string; title: string; desc: string };
type Phase = { phase: string; title: string; desc: string; badge?: string };

const stats: Stat[] = [
    { value: "127", label: "Economies Launched" },
    { value: "$4.2M", label: "Total Value Locked" },
    { value: "8,400+", label: "Active Users" },
    { value: "512", label: "Contracts Deployed" },
];

const features: Feature[] = [
    {
        title: "Tokenomics Engine",
        desc: "AI-designed token allocation, emission curves, and utility models tailored to your project type.",
    },
    {
        title: "Smart Contracts on Vara",
        desc: "Automatically generated and auditable smart contracts deployed to the Vara network.",
    },
    {
        title: "RivrDEX Integration",
        desc: "Instant pool creation, liquidity seeding, and trading pairs on RivrDEX.",
    },
    {
        title: "Economy Simulation",
        desc: "Run simulations before launch to stress-test your tokenomics and discover vulnerabilities.",
    },
    {
        title: "Guardrails & Safety Score",
        desc: "Built-in risk analysis covering inflation, liquidity, whale concentration, and utility gaps.",
    },
    {
        title: "Multi-Chain Roadmap",
        desc: "Starting on Vara, expanding to Ethereum and Vara.eth for maximum interoperability.",
    },
];

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

const phases: Phase[] = [
    {
        phase: "Phase 1",
        title: "Vara Network",
        desc: "Core platform launch on Vara with AI-powered project creation.",
        badge: "In Progress",
    },
    {
        phase: "Phase 2",
        title: "Ethereum Expansion",
        desc: "Cross-chain deployment to Ethereum with bridge infrastructure.",
    },
    {
        phase: "Phase 3",
        title: "Vara.eth",
        desc: "Full interoperability with Vara.eth for seamless multi-chain economies.",
    },
];

export default function Landing() {
    return (
        <div className="ekron">

            {/* Top nav */}
            <Header />


            {/* Hero */}
            <Hero />

            {/* Capabilities */}
            <Capabilities/>

            {/* UX Philosophy */}
           <UxPhilosophy/>

            {/* Roadmap */}
            <Roadmap/>

            {/* Footer */}
           <Footer/>

        </div>
    );
}
