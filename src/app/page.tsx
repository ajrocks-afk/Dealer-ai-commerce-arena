"use client";

import {
  ArrowDown,
  ArrowRight,
  Bot,
  CircleDollarSign,
  GitBranch,
  Handshake,
  Layers3,
  LockKeyhole,
  Network,
  Play,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

const SYSTEMS = [
  {
    id: "buyer",
    index: "01",
    title: "BUYER AGENT",
    description: "Understands intent and proposes a deal.",
    icon: Bot,
    accent: "#4D7CFE",
  },
  {
    id: "merchant",
    index: "02",
    title: "MERCHANT AGENT",
    description: "Protects merchant economics while negotiating.",
    icon: Handshake,
    accent: "#A66CFF",
  },
  {
    id: "policy",
    index: "03",
    title: "POLICY ENGINE",
    description: "Deterministic rules decide what is allowed.",
    icon: ShieldCheck,
    accent: "#F5A623",
  },
  {
    id: "state",
    index: "04",
    title: "STATE MACHINE",
    description: "Controls every executable transition.",
    icon: GitBranch,
    accent: "#54D8FF",
  },
  {
    id: "payment",
    index: "05",
    title: "PAYMENT",
    description: "Only approved deals can enter payment execution.",
    icon: CircleDollarSign,
    accent: "#45E6A5",
  },
  {
    id: "audit",
    index: "06",
    title: "AUDIT",
    description: "Every important decision leaves a trace.",
    icon: Layers3,
    accent: "#C6B6FF",
  },
];

export default function Home() {
  const router = useRouter();
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [activeSystem, setActiveSystem] = useState("policy");
  const [entered, setEntered] = useState(false);
  const arenaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      setPointer({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  const enterCreateDeal = () => {
    setEntered(true);
    window.setTimeout(() => router.push("/deals/create"), 650);
  };

  const scrollToSystems = () => {
    arenaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className={`dealer-about ${entered ? "dealer-about-entered" : ""}`}>
      <div className="dealer-about-noise" />
      <div className="dealer-about-glow dealer-about-glow-one" />
      <div className="dealer-about-glow dealer-about-glow-two" />
      <div
        className="dealer-about-cursor-glow"
        style={{
          transform: `translate3d(${pointer.x * 35}px, ${pointer.y * 35}px, 0)`,
        }}
      />

      <header className="dealer-about-nav">
        <div className="dealer-about-brand">
          <span className="dealer-about-brand-mark">
            <Network size={15} />
          </span>
          <span>
            <strong>DEALER</strong>
            <small>AI COMMERCE ARENA</small>
          </span>
        </div>

        <div className="dealer-about-nav-right">
          <span className="dealer-about-live">
            <i /> SYSTEM ONLINE
          </span>
          <span className="dealer-about-nav-index">01 / 04</span>
        </div>
      </header>

      <section className="dealer-about-hero">
        <div className="dealer-about-copy">
          <div className="dealer-about-kicker">
            <span />
            AUTONOMOUS COMMERCE / CONTROLLED EXECUTION
          </div>

          <h1>
            COMMERCE,
            <br />
            <em>NEGOTIATED.</em>
          </h1>

          <p>
            DEALER is an AI commerce arena where buyer and merchant agents
            negotiate — while deterministic systems decide what can actually
            happen.
          </p>

          <div className="dealer-about-actions">
            <button
              type="button"
              className="dealer-about-primary"
              onClick={enterCreateDeal}
            >
              <span className="dealer-about-primary-plus">+</span>
              CREATE DEAL
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="dealer-about-secondary"
              onClick={scrollToSystems}
            >
              EXPLORE SYSTEM
              <ArrowDown size={14} />
            </button>
          </div>
        </div>

        <div className="dealer-about-visual" aria-hidden="true">
          <div className="dealer-about-grid" />
          <div className="dealer-about-orbit orbit-a" />
          <div className="dealer-about-orbit orbit-b" />
          <div className="dealer-about-orbit orbit-c" />

          <div
            className="dealer-about-monolith"
            style={{
              transform: `translate3d(${pointer.x * -10}px, ${pointer.y * -8}px, 0) rotateX(${pointer.y * -3}deg) rotateY(${pointer.x * 4}deg)`,
            }}
          >
            <div className="dealer-about-monolith-edge" />
            <div className="dealer-about-monolith-inner">
              <div className="dealer-about-monolith-top">
                <span>DEAL</span>
                <span>CORE / 001</span>
              </div>
              <div className="dealer-about-monolith-symbol">
                <Network size={30} strokeWidth={1.2} />
              </div>
              <strong>DEALER</strong>
              <small>AI → POLICY → STATE → PAYMENT</small>
            </div>
          </div>

          <div className="dealer-about-particle particle-a" />
          <div className="dealer-about-particle particle-b" />
          <div className="dealer-about-particle particle-c" />
          <div className="dealer-about-particle particle-d" />
        </div>
      </section>

      <section ref={arenaRef} className="dealer-about-systems">
        <div className="dealer-about-section-heading">
          <div>
            <span className="dealer-about-section-index">02 / SYSTEM</span>
            <h2>
              AI can negotiate.
              <br />
              <em>AI cannot override.</em>
            </h2>
          </div>
          <p>
            Every intelligent proposal passes through deterministic policy,
            state and payment controls before it can become a real transaction.
          </p>
        </div>

        <div className="dealer-about-system-stage">
          <div className="dealer-about-system-core">
            <div className="dealer-about-system-core-ring ring-one" />
            <div className="dealer-about-system-core-ring ring-two" />
            <div className="dealer-about-system-core-glow" />
            <LockKeyhole size={17} />
            <strong>CONTROL</strong>
            <span>DETERMINISTIC</span>
          </div>

          {SYSTEMS.map((system, index) => {
            const Icon = system.icon;
            const angle = index * 60 - 90;
            const radius = 300;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <button
                type="button"
                key={system.id}
                className={`dealer-about-system-node ${activeSystem === system.id ? "active" : ""}`}
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  "--system-accent": system.accent,
                } as CSSProperties}
                onClick={() => setActiveSystem(system.id)}
              >
                <span className="dealer-about-system-node-index">
                  {system.index}
                </span>
                <span className="dealer-about-system-node-icon">
                  <Icon size={15} />
                </span>
                <span className="dealer-about-system-node-copy">
                  <strong>{system.title}</strong>
                  <small>{system.description}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="dealer-about-system-flow">
          <span>AI PROPOSES</span>
          <ArrowRight size={13} />
          <span>VALIDATE</span>
          <ArrowRight size={13} />
          <span>POLICY</span>
          <ArrowRight size={13} />
          <span>STATE</span>
          <ArrowRight size={13} />
          <span>PAYMENT</span>
        </div>
      </section>

      <section className="dealer-about-entry">
        <div className="dealer-about-entry-beam" />
        <div className="dealer-about-entry-copy">
          <span className="dealer-about-section-index">03 / ARENA</span>
          <h2>
            READY TO
            <br />
            <em>MAKE A DEAL?</em>
          </h2>
          <p>
            Start a real negotiation and watch the agents propose, counter,
            validate and converge under DEALER&apos;s control layer.
          </p>
          <button type="button" onClick={enterCreateDeal}>
            <Play size={14} fill="currentColor" />
            ENTER DEALER
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="dealer-about-entry-art" aria-hidden="true">
          <div className="dealer-about-entry-ring" />
          <div className="dealer-about-entry-ring ring-two" />
          <div className="dealer-about-entry-core">
            <Zap size={24} />
          </div>
        </div>
      </section>

      <footer className="dealer-about-footer">
        <span>DEALER / AI COMMERCE ARENA</span>
        <span>AI PROPOSES · DETERMINISTIC SYSTEMS CONTROL</span>
        <span>04 / 04</span>
      </footer>

      <style jsx global>{`
        :root { color-scheme: dark; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #02040a; }
        * { box-sizing: border-box; }

        .dealer-about {
          --bg: #02040a;
          --surface: rgba(7, 12, 24, .68);
          --line: rgba(126, 154, 255, .13);
          --muted: #77809a;
          --blue: #4d7cfe;
          --violet: #a66cff;
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          background:
            radial-gradient(circle at 75% 20%, rgba(64, 98, 255, .13), transparent 27%),
            radial-gradient(circle at 20% 72%, rgba(126, 71, 255, .10), transparent 30%),
            linear-gradient(180deg, #02040a 0%, #040711 48%, #02040a 100%);
          color: #f4f7ff;
          isolation: isolate;
        }

        .dealer-about-noise {
          position: fixed; inset: 0; z-index: 20; pointer-events: none; opacity: .035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");
        }
        .dealer-about-glow { position: absolute; width: 500px; height: 500px; border-radius: 50%; filter: blur(100px); pointer-events: none; opacity: .18; }
        .dealer-about-glow-one { top: 5%; right: -180px; background: #315dff; }
        .dealer-about-glow-two { top: 55%; left: -230px; background: #7b42ff; }
        .dealer-about-cursor-glow { position: fixed; left: 50%; top: 40%; width: 300px; height: 300px; margin: -150px; border-radius: 50%; background: radial-gradient(circle, rgba(77,124,254,.09), transparent 68%); filter: blur(20px); pointer-events: none; z-index: 0; transition: transform .25s ease-out; }

        .dealer-about-nav { position: absolute; z-index: 30; top: 0; left: 0; right: 0; height: 86px; padding: 0 clamp(20px, 4vw, 58px); display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,.055); background: linear-gradient(180deg, rgba(2,4,10,.72), transparent); backdrop-filter: blur(10px); }
        .dealer-about-brand { display: flex; align-items: center; gap: 12px; }
        .dealer-about-brand-mark { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid rgba(77,124,254,.4); background: rgba(77,124,254,.08); color: #7f9cff; box-shadow: 0 0 30px rgba(77,124,254,.12); }
        .dealer-about-brand strong { display: block; font-size: 12px; letter-spacing: .24em; }
        .dealer-about-brand small { display: block; margin-top: 4px; color: #65708b; font-size: 7px; letter-spacing: .2em; }
        .dealer-about-nav-right { display: flex; align-items: center; gap: 28px; color: #65708b; font: 700 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .15em; }
        .dealer-about-live { display: flex; gap: 8px; align-items: center; }
        .dealer-about-live i { width: 6px; height: 6px; border-radius: 50%; background: #45e6a5; box-shadow: 0 0 14px #45e6a5; animation: dealer-pulse 1.7s ease-in-out infinite; }

        .dealer-about-hero { position: relative; z-index: 2; min-height: 100svh; display: grid; grid-template-columns: minmax(0, 1fr) minmax(420px, 1fr); align-items: center; gap: 20px; padding: 120px clamp(24px, 7vw, 110px) 70px; }
        .dealer-about-copy { max-width: 650px; padding-bottom: 20px; }
        .dealer-about-kicker, .dealer-about-section-index { color: #7380a0; font: 800 8px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .19em; }
        .dealer-about-kicker { display: flex; align-items: center; gap: 10px; }
        .dealer-about-kicker span { width: 30px; height: 1px; background: linear-gradient(90deg, #4d7cfe, transparent); }
        .dealer-about-copy h1 { margin: 25px 0 22px; font-size: clamp(58px, 8.2vw, 122px); line-height: .83; letter-spacing: -.065em; font-weight: 260; }
        .dealer-about-copy h1 em, .dealer-about-section-heading h2 em, .dealer-about-entry h2 em { color: transparent; font-style: normal; -webkit-text-stroke: 1px rgba(166,108,255,.9); text-shadow: 0 0 45px rgba(120,82,255,.18); }
        .dealer-about-copy p { max-width: 550px; margin: 0; color: #8d96ad; font-size: 15px; line-height: 1.8; }
        .dealer-about-actions { display: flex; gap: 18px; align-items: center; margin-top: 34px; }
        .dealer-about-primary, .dealer-about-secondary, .dealer-about-entry-copy button { border: 0; cursor: pointer; color: white; font: 800 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .16em; }
        .dealer-about-primary { display: flex; align-items: center; gap: 12px; padding: 15px 18px 15px 12px; background: linear-gradient(100deg, rgba(77,124,254,.18), rgba(77,124,254,.05)); border: 1px solid rgba(103,133,255,.45); box-shadow: 0 0 40px rgba(77,124,254,.10), inset 0 0 25px rgba(77,124,254,.05); transition: .25s ease; }
        .dealer-about-primary:hover { transform: translateY(-2px); box-shadow: 0 0 55px rgba(77,124,254,.2); }
        .dealer-about-primary-plus { display: grid; place-items: center; width: 24px; height: 24px; background: #4d7cfe; color: white; font-size: 18px; font-weight: 300; }
        .dealer-about-secondary { display: flex; align-items: center; gap: 10px; background: transparent; color: #69748e; }
        .dealer-about-secondary:hover { color: white; }

        .dealer-about-visual { position: relative; min-height: 650px; display: grid; place-items: center; perspective: 1000px; }
        .dealer-about-grid { position: absolute; inset: 8% 2%; opacity: .42; background-image: linear-gradient(rgba(94,124,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(94,124,255,.06) 1px, transparent 1px); background-size: 42px 42px; mask-image: radial-gradient(circle at center, black 10%, transparent 72%); transform: perspective(700px) rotateX(58deg) translateY(120px); }
        .dealer-about-orbit { position: absolute; border: 1px solid rgba(91,123,255,.16); border-radius: 50%; transform: rotateX(65deg) rotateZ(-12deg); box-shadow: 0 0 45px rgba(77,124,254,.04); }
        .orbit-a { width: 510px; height: 510px; animation: dealer-orbit 24s linear infinite; }
        .orbit-b { width: 400px; height: 400px; border-color: rgba(166,108,255,.19); animation: dealer-orbit-reverse 18s linear infinite; }
        .orbit-c { width: 285px; height: 285px; border-style: dashed; opacity: .65; animation: dealer-orbit 12s linear infinite; }
        .dealer-about-monolith { position: relative; width: 250px; height: 330px; transform-style: preserve-3d; transition: transform .25s ease-out; }
        .dealer-about-monolith:before { content: ''; position: absolute; inset: 10px -24px -20px; background: radial-gradient(ellipse, rgba(64,96,255,.22), transparent 65%); filter: blur(30px); transform: translateZ(-60px); }
        .dealer-about-monolith-edge { position: absolute; inset: 0; border: 1px solid rgba(110,140,255,.35); background: linear-gradient(135deg, rgba(26,39,78,.34), rgba(7,11,23,.9)); clip-path: polygon(12% 0, 100% 12%, 88% 100%, 0 87%); box-shadow: inset 0 0 70px rgba(80,110,255,.09), 0 0 80px rgba(52,83,255,.10); }
        .dealer-about-monolith-inner { position: absolute; inset: 18px; clip-path: polygon(12% 0, 100% 12%, 88% 100%, 0 87%); border: 1px solid rgba(255,255,255,.06); background: radial-gradient(circle at 50% 40%, rgba(77,124,254,.10), transparent 48%), rgba(3,7,17,.88); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .dealer-about-monolith-top { position: absolute; top: 27px; left: 27px; right: 27px; display: flex; justify-content: space-between; color: #56617c; font: 700 6px/1 ui-monospace, monospace; letter-spacing: .13em; }
        .dealer-about-monolith-symbol { width: 76px; height: 76px; display: grid; place-items: center; margin-bottom: 22px; border: 1px solid rgba(77,124,254,.25); border-radius: 50%; color: #7190ff; box-shadow: 0 0 50px rgba(77,124,254,.12); animation: dealer-breathe 4s ease-in-out infinite; }
        .dealer-about-monolith-inner strong { font-size: 27px; font-weight: 350; letter-spacing: .17em; }
        .dealer-about-monolith-inner small { margin-top: 9px; color: #56617b; font: 700 6px/1.4 ui-monospace, monospace; letter-spacing: .16em; }
        .dealer-about-particle { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #6c8bff; box-shadow: 0 0 18px #6c8bff; animation: dealer-float 5s ease-in-out infinite; }
        .particle-a { top: 19%; right: 10%; } .particle-b { bottom: 17%; left: 11%; animation-delay: -1.2s; } .particle-c { top: 37%; left: 5%; animation-delay: -2.5s; } .particle-d { bottom: 27%; right: 5%; animation-delay: -3.6s; }

        .dealer-about-systems { position: relative; z-index: 2; min-height: 1100px; padding: 120px clamp(24px, 7vw, 110px); border-top: 1px solid rgba(255,255,255,.05); }
        .dealer-about-section-heading { display: grid; grid-template-columns: 1fr 360px; gap: 60px; align-items: end; }
        .dealer-about-section-heading h2 { margin: 22px 0 0; font-size: clamp(42px, 5vw, 72px); line-height: .93; letter-spacing: -.045em; font-weight: 280; }
        .dealer-about-section-heading > p { margin: 0 0 5px; color: #79839b; font-size: 13px; line-height: 1.8; }
        .dealer-about-system-stage { position: relative; width: min(100%, 900px); height: 700px; margin: 40px auto 0; }
        .dealer-about-system-stage:before { content: ''; position: absolute; inset: 7%; border: 1px solid rgba(99,125,255,.09); border-radius: 50%; animation: dealer-orbit 35s linear infinite; }
        .dealer-about-system-stage:after { content: ''; position: absolute; inset: 20%; border: 1px dashed rgba(166,108,255,.10); border-radius: 50%; animation: dealer-orbit-reverse 25s linear infinite; }
        .dealer-about-system-core { position: absolute; left: 50%; top: 50%; width: 190px; height: 190px; transform: translate(-50%,-50%); border: 1px solid rgba(77,124,254,.32); border-radius: 50%; background: radial-gradient(circle, rgba(27,43,90,.5), rgba(4,8,18,.94) 65%); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 5; box-shadow: 0 0 100px rgba(77,124,254,.12), inset 0 0 50px rgba(77,124,254,.06); }
        .dealer-about-system-core svg { color: #75a0ff; margin-bottom: 10px; }
        .dealer-about-system-core strong { font-size: 13px; letter-spacing: .25em; font-weight: 600; } .dealer-about-system-core span { margin-top: 7px; color: #52607d; font: 700 6px/1 ui-monospace, monospace; letter-spacing: .2em; }
        .dealer-about-system-core-ring { position: absolute; border-radius: 50%; pointer-events: none; } .ring-one { inset: -15px; border: 1px solid rgba(77,124,254,.13); animation: dealer-orbit 16s linear infinite; } .ring-two { inset: -30px; border: 1px solid rgba(166,108,255,.08); animation: dealer-orbit-reverse 22s linear infinite; }
        .dealer-about-system-core-glow { position: absolute; inset: 15%; border-radius: 50%; background: radial-gradient(circle, rgba(77,124,254,.18), transparent 70%); filter: blur(18px); animation: dealer-breathe 4s ease-in-out infinite; }
        .dealer-about-system-node { position: absolute; transform: translate(-50%,-50%); width: 230px; min-height: 80px; display: grid; grid-template-columns: 24px 34px 1fr; align-items: center; gap: 10px; padding: 12px; color: #737e98; text-align: left; border: 1px solid rgba(255,255,255,.07); background: rgba(5,9,19,.72); backdrop-filter: blur(16px); cursor: pointer; transition: .3s ease; z-index: 8; }
        .dealer-about-system-node:hover, .dealer-about-system-node.active { transform: translate(-50%,-50%) scale(1.04); color: white; border-color: color-mix(in srgb, var(--system-accent) 50%, transparent); box-shadow: 0 0 45px color-mix(in srgb, var(--system-accent) 10%, transparent); }
        .dealer-about-system-node-index { align-self: start; color: #4c5872; font: 700 7px/1 ui-monospace, monospace; } .dealer-about-system-node-icon { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--system-accent) 28%, transparent); color: var(--system-accent); } .dealer-about-system-node-copy strong { display: block; font-size: 8px; letter-spacing: .12em; } .dealer-about-system-node-copy small { display: block; margin-top: 5px; color: #59647d; font-size: 9px; line-height: 1.35; }
        .dealer-about-system-flow { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px; color: #65718b; font: 700 7px/1 ui-monospace, monospace; letter-spacing: .15em; }

        .dealer-about-entry { position: relative; z-index: 2; min-height: 780px; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 50px; padding: 100px clamp(24px, 7vw, 110px); border-top: 1px solid rgba(255,255,255,.05); overflow: hidden; }
        .dealer-about-entry-beam { position: absolute; left: 0; top: 50%; width: 70%; height: 1px; background: linear-gradient(90deg, transparent, rgba(77,124,254,.55), transparent); filter: blur(1px); animation: dealer-beam 5s ease-in-out infinite; }
        .dealer-about-entry-copy { max-width: 570px; }
        .dealer-about-entry h2 { margin: 22px 0; font-size: clamp(55px, 7vw, 100px); line-height: .84; letter-spacing: -.06em; font-weight: 250; }
        .dealer-about-entry-copy p { max-width: 480px; color: #7d879f; font-size: 14px; line-height: 1.8; }
        .dealer-about-entry-copy button { margin-top: 28px; display: flex; align-items: center; gap: 12px; padding: 16px 19px; background: #eef3ff; color: #080b13; box-shadow: 0 0 45px rgba(117,145,255,.13); transition: .25s ease; }
        .dealer-about-entry-copy button:hover { transform: translateY(-3px); box-shadow: 0 0 70px rgba(117,145,255,.25); }
        .dealer-about-entry-art { position: relative; min-height: 520px; display: grid; place-items: center; }
        .dealer-about-entry-ring { position: absolute; width: 430px; height: 430px; border: 1px solid rgba(77,124,254,.17); border-radius: 50%; transform: rotateX(65deg); animation: dealer-orbit 20s linear infinite; } .dealer-about-entry-ring.ring-two { width: 300px; height: 300px; border-color: rgba(166,108,255,.17); animation: dealer-orbit-reverse 14s linear infinite; }
        .dealer-about-entry-core { width: 130px; height: 130px; display: grid; place-items: center; border: 1px solid rgba(105,135,255,.5); border-radius: 50%; background: radial-gradient(circle, rgba(58,86,165,.42), #050913 70%); color: #88a1ff; box-shadow: 0 0 100px rgba(77,124,254,.18); animation: dealer-breathe 4s ease-in-out infinite; }
        .dealer-about-footer { position: relative; z-index: 2; display: flex; justify-content: space-between; padding: 28px clamp(20px, 4vw, 58px); border-top: 1px solid rgba(255,255,255,.05); color: #424d65; font: 700 7px/1 ui-monospace, monospace; letter-spacing: .15em; }
        .dealer-about-entered:after { content: ''; position: fixed; inset: 0; z-index: 100; pointer-events: none; background: #eef3ff; transform: scaleX(1); transform-origin: left; animation: dealer-page-leave .7s cubic-bezier(.76,0,.24,1) forwards; }

        @keyframes dealer-pulse { 50% { opacity: .25; transform: scale(.65); } }
        @keyframes dealer-orbit { to { transform: rotateX(65deg) rotateZ(348deg); } }
        @keyframes dealer-orbit-reverse { to { transform: rotateX(65deg) rotateZ(-372deg); } }
        @keyframes dealer-breathe { 50% { transform: scale(1.035); opacity: 1; } }
        @keyframes dealer-float { 50% { transform: translateY(-18px); opacity: .35; } }
        @keyframes dealer-beam { 50% { transform: translateX(35vw); opacity: .25; } }
        @keyframes dealer-page-leave { 0% { transform: scaleX(0); } 45% { transform: scaleX(1); } 100% { transform: scaleX(1); } }

        @media (max-width: 1050px) {
          .dealer-about-hero { grid-template-columns: 1fr; padding-top: 130px; }
          .dealer-about-copy { max-width: 760px; }
          .dealer-about-visual { min-height: 520px; margin-top: -20px; }
          .dealer-about-system-stage { transform: scale(.82); transform-origin: top center; width: 122%; margin-left: -11%; height: 600px; }
        }
        @media (max-width: 720px) {
          .dealer-about-nav { height: 70px; } .dealer-about-nav-right { gap: 0; } .dealer-about-live, .dealer-about-nav-index { display: none; }
          .dealer-about-hero { padding: 105px 18px 45px; } .dealer-about-copy h1 { font-size: clamp(50px, 17vw, 82px); } .dealer-about-copy p { font-size: 13px; }
          .dealer-about-actions { align-items: flex-start; flex-direction: column; } .dealer-about-visual { min-height: 420px; } .dealer-about-monolith { width: 185px; height: 250px; } .orbit-a { width: 340px; height: 340px; } .orbit-b { width: 270px; height: 270px; } .orbit-c { width: 205px; height: 205px; }
          .dealer-about-systems { padding: 90px 18px; min-height: auto; } .dealer-about-section-heading { grid-template-columns: 1fr; gap: 22px; } .dealer-about-system-stage { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 10px; height: auto; margin-top: 50px; transform: none; width: 100%; } .dealer-about-system-stage:before, .dealer-about-system-stage:after, .dealer-about-system-core { display: none; }
          .dealer-about-system-node { position: relative !important; left: auto !important; top: auto !important; transform: none !important; width: 100%; } .dealer-about-system-node:hover, .dealer-about-system-node.active { transform: scale(1.015) !important; }
          .dealer-about-system-flow { margin-top: 30px; font-size: 6px; }
          .dealer-about-entry { grid-template-columns: 1fr; min-height: auto; padding: 90px 18px 110px; } .dealer-about-entry-art { min-height: 350px; } .dealer-about-entry-ring { width: 310px; height: 310px; } .dealer-about-entry-ring.ring-two { width: 220px; height: 220px; }
          .dealer-about-footer { flex-direction: column; gap: 10px; line-height: 1.4; }
        }
        @media (prefers-reduced-motion: reduce) { *, *:before, *:after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
      `}</style>
    </main>
  );
}