"use client";

import {
  CircleDollarSign,
  GitBranch,
  Handshake,
  LockKeyhole,
  MessageSquare,
  Network,
  ShieldCheck,
  ShoppingCart,
  Workflow,
  Zap,
} from "lucide-react";

import { useState } from "react";

type OrbitFeature = {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  angle: number;
  delay: string;
};

const orbitFeatures: OrbitFeature[] = [
  {
    id: "merchant",
    label: "MERCHANT",
    description:
      "Merchant agents protect economics while negotiating.",
    color: "#F5A623",
    icon: <Handshake size={14} />,
    angle: 0,
    delay: "0s",
  },
  {
    id: "payment",
    label: "PAYMENT",
    description:
      "Approved deals move into controlled payment execution.",
    color: "#22C55E",
    icon: <CircleDollarSign size={14} />,
    angle: 60,
    delay: "-5.66s",
  },
  {
    id: "negotiate",
    label: "NEGOTIATE",
    description:
      "Buyer and merchant agents exchange proposals.",
    color: "#F5A623",
    icon: <MessageSquare size={14} />,
    angle: 120,
    delay: "-11.33s",
  },
  {
    id: "control",
    label: "CONTROL",
    description:
      "Deterministic policy controls what agents are allowed to do.",
    color: "#8B5CF6",
    icon: <ShieldCheck size={14} />,
    angle: 180,
    delay: "-17s",
  },
  {
    id: "state",
    label: "STATE",
    description:
      "The state machine controls every executable transition.",
    color: "#8B5CF6",
    icon: <Workflow size={14} />,
    angle: 240,
    delay: "-22.66s",
  },
  {
    id: "buyer",
    label: "BUYER",
    description:
      "Buyer agents optimize the deal around buyer intent.",
    color: "#3B82F6",
    icon: <ShoppingCart size={14} />,
    angle: 300,
    delay: "-28.33s",
  },
];

export function DealerOrbit({
  onEnter,
  isEntering = false,
}: {
  onEnter: () => void;
  isEntering?: boolean;
}) {
  const [selectedFeature, setSelectedFeature] =
    useState<string | null>(null);

  const selected = orbitFeatures.find(
    (feature) => feature.id === selectedFeature
  );

  return (
    <section className="dealer-orbit-page">
      {/* Ambient background */}
      <div className="dealer-orbit-ambient" />

      {/* Top brand */}
      <div className="dealer-orbit-header">
        <div className="dealer-orbit-brand">
          <div className="dealer-orbit-brand-mark">
            <Zap size={15} />
          </div>

          <div>
            <p className="dealer-orbit-brand-name">
              DEALER
            </p>

            <p className="dealer-orbit-brand-subtitle">
              AI COMMERCE ARENA
            </p>
          </div>
        </div>

        <div className="dealer-orbit-status">
          <span className="dealer-orbit-status-dot" />
          <span>COMMERCE ENGINE</span>
        </div>
      </div>

      {/* Main visual */}
      <div className="dealer-orbit-stage">
        <div className="dealer-orbit-canvas">
          {/* Outer orbit */}
          <div className="dealer-orbit-ring dealer-orbit-ring-outer" />

          {/* Middle orbit */}
          <div className="dealer-orbit-ring dealer-orbit-ring-middle" />

          {/* Inner orbit */}
          <div className="dealer-orbit-ring dealer-orbit-ring-inner" />

          {/* Crosshair */}
          <div className="dealer-orbit-crosshair-horizontal" />
          <div className="dealer-orbit-crosshair-vertical" />

          {/* Rotating Ferris-wheel track */}
          <div className="dealer-orbit-track">
            {orbitFeatures.map((feature) => (
              <OrbitNode
                key={feature.id}
                feature={feature}
                selected={
                  selectedFeature === feature.id
                }
                onClick={() =>
                  setSelectedFeature(feature.id)
                }
              />
            ))}
          </div>

          {/* Central DEALER */}
          <div className="dealer-orbit-core">
            <div className="dealer-orbit-core-glow" />

            <div className="dealer-orbit-core-ring dealer-orbit-core-ring-one" />
            <div className="dealer-orbit-core-ring dealer-orbit-core-ring-two" />

            <div className="dealer-orbit-core-content">
              <div className="dealer-orbit-core-icon">
                <Network size={16} />
              </div>

              <h1>DEALER</h1>

              <p>AI COMMERCE ARENA</p>

              <button
                type="button"
                onClick={onEnter}
                disabled={isEntering}
                className="dealer-orbit-enter"
              >
                <span>
                  {isEntering
                    ? "ENTERING"
                    : "ENTER ARENA"}
                </span>

                <span className="dealer-orbit-arrow">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected feature information */}
      <div
        className={`dealer-orbit-info ${
          selected
            ? "dealer-orbit-info-visible"
            : ""
        }`}
      >
        {selected && (
          <div className="dealer-orbit-info-card">
            <div
              className="dealer-orbit-info-icon"
              style={{
                color: selected.color,
                borderColor: `${selected.color}45`,
                backgroundColor: `${selected.color}0D`,
              }}
            >
              {selected.icon}
            </div>

            <div>
              <p
                className="dealer-orbit-info-label"
                style={{
                  color: selected.color,
                }}
              >
                {selected.label}
              </p>

              <p className="dealer-orbit-info-description">
                {selected.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom system statement */}
      <div className="dealer-orbit-bottom-left">
        <LockKeyhole size={12} />
        <span>
          AI PROPOSES · DETERMINISTIC SYSTEMS CONTROL
        </span>
      </div>

      <div className="dealer-orbit-bottom-right">
        <span>06 SYSTEMS</span>
        <span className="dealer-orbit-bottom-line" />
        <span>ONE ARENA</span>
      </div>
    </section>
  );
}

function OrbitNode({
  feature,
  selected,
  onClick,
}: {
  feature: OrbitFeature;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="dealer-orbit-node"
      style={
        {
          "--orbit-angle": `${feature.angle}deg`,
          "--orbit-delay": feature.delay,
        } as React.CSSProperties
      }
    >
      {/* This is the cabin */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`Explore ${feature.label}`}
        className={`dealer-orbit-cabin ${
          selected
            ? "dealer-orbit-cabin-selected"
            : ""
        }`}
        style={
          {
            "--feature-color": feature.color,
          } as React.CSSProperties
        }
      >
        <span className="dealer-orbit-cabin-icon">
          {feature.icon}
        </span>

        <span className="dealer-orbit-cabin-label">
          {feature.label}
        </span>
      </button>
    </div>
  );
}