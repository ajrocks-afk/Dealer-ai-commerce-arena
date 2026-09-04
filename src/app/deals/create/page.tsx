"use client";

import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createDeal } from "@/lib/dealer-api";

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function CreateDealPage() {
  const router = useRouter();

  const [productId, setProductId] =
    useState("premium-laptop");

  const [merchantId, setMerchantId] =
    useState("merchant-01");

  const [buyerId, setBuyerId] =
    useState("buyer-01");

  const [initialPrice, setInitialPrice] =
    useState("120000");

  const [maxRounds, setMaxRounds] =
    useState("5");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const price = Number(initialPrice);
    const rounds = Number(maxRounds);

    if (
      !productId.trim() ||
      !merchantId.trim() ||
      !buyerId.trim()
    ) {
      setError(
        "Product, merchant and buyer are required."
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError(
        "Initial price must be greater than zero."
      );
      return;
    }

    if (
      !Number.isInteger(rounds) ||
      rounds <= 0
    ) {
      setError(
        "Maximum rounds must be a positive whole number."
      );
      return;
    }

    setSubmitting(true);

    try {
      const result = await createDeal({
        productId: productId.trim(),
        merchantId: merchantId.trim(),
        buyerId: buyerId.trim(),
        initialPrice: price,
        currency: "INR",
        maxRounds: rounds,
      });

      if (
        !result.success ||
        !result.session
      ) {
        throw new Error(
          result.error ??
            "Unable to create deal."
        );
      }

      router.push(
        `/deals/${encodeURIComponent(
          result.session.id
        )}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create deal."
      );

      setSubmitting(false);
    }
  }

  return (
    <main className="dealer-create">
      <div className="dealer-create-noise" />

      <div className="dealer-create-glow dealer-create-glow-a" />

      <div className="dealer-create-glow dealer-create-glow-b" />

      <header className="dealer-create-nav">
        <Link
          href="/"
          className="dealer-create-back"
        >
          <ArrowLeft size={14} />

          <span>
            BACK TO DEALER
          </span>
        </Link>

        <span>
          02 / 04
        </span>
      </header>

      <section className="dealer-create-layout">
        <div className="dealer-create-copy">
          <span className="dealer-create-kicker">
            NEW NEGOTIATION / 001
          </span>

          <h1>
            BUILD THE
            <br />
            <em>DEAL.</em>
          </h1>

          <p>
            Define the starting conditions.
            DEALER will create the session,
            then the agents can negotiate
            under deterministic controls.
          </p>

          <div className="dealer-create-signals">
            <div>
              <ShieldCheck size={14} />

              <span>
                POLICY CONTROL
              </span>
            </div>

            <div>
              <CircleDollarSign size={14} />

              <span>
                INR TRANSACTION
              </span>
            </div>

            <div>
              <Layers3 size={14} />

              <span>
                AUDITED SESSION
              </span>
            </div>
          </div>
        </div>

        <form
          className="dealer-create-form"
          onSubmit={handleSubmit}
        >
          <div className="dealer-create-form-head">
            <span>
              SESSION PARAMETERS
            </span>

            <Sparkles size={15} />
          </div>

          <label>
            <span>
              PRODUCT ID
            </span>

            <input
              value={productId}
              onChange={(event) =>
                setProductId(
                  event.target.value
                )
              }
            />
          </label>

          <div className="dealer-create-two">
            <label>
              <span>
                BUYER ID
              </span>

              <input
                value={buyerId}
                onChange={(event) =>
                  setBuyerId(
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              <span>
                MERCHANT ID
              </span>

              <input
                value={merchantId}
                onChange={(event) =>
                  setMerchantId(
                    event.target.value
                  )
                }
              />
            </label>
          </div>

          <div className="dealer-create-two">
            <label>
              <span>
                INITIAL PRICE
              </span>

              <div className="dealer-create-money">
                <b>₹</b>

                <input
                  inputMode="numeric"
                  value={initialPrice}
                  onChange={(event) =>
                    setInitialPrice(
                      event.target.value.replace(
                        /[^0-9]/g,
                        ""
                      )
                    )
                  }
                />
              </div>
            </label>

            <label>
              <span>
                MAX ROUNDS
              </span>

              <input
                inputMode="numeric"
                value={maxRounds}
                onChange={(event) =>
                  setMaxRounds(
                    event.target.value.replace(
                      /[^0-9]/g,
                      ""
                    )
                  )
                }
              />
            </label>
          </div>

          <div className="dealer-create-preview">
            <span>
              OPENING VALUE
            </span>

            <strong>
              {formatCurrency(
                Number(initialPrice) || 0
              )}
            </strong>

            <small>
              AI proposes · deterministic
              systems control
            </small>
          </div>

          {error && (
            <p className="dealer-create-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
          >
            <span>
              {submitting
                ? "INITIALIZING DEAL"
                : "CREATE DEAL"}
            </span>

            <ArrowRight size={16} />
          </button>
        </form>
      </section>

      <style jsx global>{`
        .dealer-create {
          min-height: 100svh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 75% 35%,
              rgba(77, 124, 254, 0.11),
              transparent 30%
            ),
            radial-gradient(
              circle at 20% 80%,
              rgba(166, 108, 255, 0.08),
              transparent 30%
            ),
            #02040a;
          color: #f4f7ff;
          isolation: isolate;
        }

        .dealer-create-noise {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.035;
          z-index: 20;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .dealer-create-glow {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.16;
          pointer-events: none;
        }

        .dealer-create-glow-a {
          right: -180px;
          top: 10%;
          background: #315dff;
        }

        .dealer-create-glow-b {
          left: -220px;
          bottom: 0;
          background: #7b42ff;
        }

        .dealer-create-nav {
          position: relative;
          z-index: 5;
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(20px, 6vw, 90px);
          border-bottom: 1px solid
            rgba(255, 255, 255, 0.05);
          color: #56617a;
          font:
            700 8px
            ui-monospace,
            monospace;
          letter-spacing: 0.15em;
        }

        .dealer-create-back {
          display: flex;
          gap: 9px;
          align-items: center;
          color: #7c87a1;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .dealer-create-back:hover {
          color: white;
        }

        .dealer-create-layout {
          position: relative;
          z-index: 2;
          width: min(
            1180px,
            calc(100% - 36px)
          );
          min-height: calc(100svh - 84px);
          margin: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(40px, 8vw, 120px);
          align-items: center;
          padding: 70px 0;
        }

        .dealer-create-kicker {
          color: #6e7a96;
          font:
            800 8px
            ui-monospace,
            monospace;
          letter-spacing: 0.18em;
        }

        .dealer-create-copy h1 {
          margin: 22px 0;
          font-size: clamp(
            60px,
            7vw,
            105px
          );
          line-height: 0.84;
          letter-spacing: -0.065em;
          font-weight: 260;
        }

        .dealer-create-copy h1 em {
          font-style: normal;
          color: transparent;
          -webkit-text-stroke: 1px #7895ff;
          text-shadow:
            0 0 45px
            rgba(77, 124, 254, 0.18);
        }

        .dealer-create-copy > p {
          max-width: 500px;
          color: #818ba2;
          font-size: 14px;
          line-height: 1.85;
        }

        .dealer-create-signals {
          display: grid;
          gap: 11px;
          margin-top: 35px;
          color: #626e87;
          font:
            700 7px
            ui-monospace,
            monospace;
          letter-spacing: 0.13em;
        }

        .dealer-create-signals div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dealer-create-signals svg {
          color: #6484ff;
        }

        .dealer-create-form {
          padding: 25px;
          border: 1px solid
            rgba(112, 137, 255, 0.16);
          background:
            linear-gradient(
              145deg,
              rgba(12, 19, 38, 0.76),
              rgba(4, 8, 17, 0.78)
            );
          box-shadow:
            0 35px 100px
              rgba(0, 0, 0, 0.4),
            inset 0 0 50px
              rgba(77, 124, 254, 0.025);
          backdrop-filter: blur(20px);
        }

        .dealer-create-form-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          margin-bottom: 22px;
          border-bottom: 1px solid
            rgba(255, 255, 255, 0.06);
          color: #6e7a94;
          font:
            800 7px
            ui-monospace,
            monospace;
          letter-spacing: 0.16em;
        }

        .dealer-create-form-head svg {
          color: #6e8bff;
        }

        .dealer-create-form label {
          display: block;
          margin-top: 17px;
        }

        .dealer-create-form label > span {
          display: block;
          margin-bottom: 8px;
          color: #68748f;
          font:
            700 7px
            ui-monospace,
            monospace;
          letter-spacing: 0.15em;
        }

        .dealer-create-form input {
          width: 100%;
          height: 46px;
          border: 1px solid
            rgba(255, 255, 255, 0.07);
          outline: none;
          background: rgba(1, 4, 10, 0.65);
          padding: 0 13px;
          color: #eaf0ff;
          font:
            500 12px
            ui-monospace,
            monospace;
          transition: 0.2s ease;
        }

        .dealer-create-form input:focus {
          border-color:
            rgba(96, 129, 255, 0.65);
          box-shadow:
            0 0 25px
            rgba(77, 124, 254, 0.08);
        }

        .dealer-create-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .dealer-create-money {
          display: flex;
          border: 1px solid
            rgba(255, 255, 255, 0.07);
          background: rgba(1, 4, 10, 0.65);
        }

        .dealer-create-money b {
          width: 44px;
          display: grid;
          place-items: center;
          color: #7190ff;
          border-right: 1px solid
            rgba(255, 255, 255, 0.06);
          font:
            500 13px
            ui-monospace,
            monospace;
        }

        .dealer-create-money input {
          border: 0;
        }

        .dealer-create-preview {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid
            rgba(77, 124, 254, 0.12);
          background: rgba(
            77,
            124,
            254,
            0.035
          );
        }

        .dealer-create-preview span,
        .dealer-create-preview small {
          display: block;
          color: #596681;
          font:
            700 6px
            ui-monospace,
            monospace;
          letter-spacing: 0.14em;
        }

        .dealer-create-preview strong {
          display: block;
          margin: 7px 0;
          color: #eaf0ff;
          font:
            400 25px
            ui-monospace,
            monospace;
        }

        .dealer-create-preview small {
          line-height: 1.5;
          letter-spacing: 0.08em;
        }

        .dealer-create-error {
          margin: 16px 0 0;
          color: #ff7e8c;
          font-size: 11px;
          line-height: 1.5;
        }

        .dealer-create-form button {
          width: 100%;
          height: 54px;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          border: 1px solid
            rgba(140, 159, 255, 0.55);
          background: #edf2ff;
          color: #060a13;
          cursor: pointer;
          font:
            900 8px
            ui-monospace,
            monospace;
          letter-spacing: 0.16em;
          transition: 0.25s ease;
        }

        .dealer-create-form button:hover:not(
            :disabled
          ) {
          transform: translateY(-2px);
          box-shadow:
            0 0 55px
            rgba(77, 124, 254, 0.18);
        }

        .dealer-create-form button:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        @media (max-width: 850px) {
          .dealer-create-layout {
            grid-template-columns: 1fr;
            gap: 55px;
            padding: 60px 0 90px;
          }

          .dealer-create-copy h1 {
            font-size: clamp(
              55px,
              15vw,
              90px
            );
          }

          .dealer-create-two {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}