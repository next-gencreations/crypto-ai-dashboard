if (booting) {
  return (
    <div className="vault-boot">
      <style>{`
        .vault-boot {
          position: fixed;
          inset: 0;
          background: #050604;
          overflow: hidden;
          font-family: "Courier New", monospace;
          color: #67ff9a;
        }

        .vault-camera {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: cameraZoom 4.5s ease-in forwards;
          transform-origin: center;
        }

        .bunker-wall {
          width: min(92vw, 820px);
          height: min(58vw, 470px);
          max-height: 72vh;
          position: relative;
          background:
            repeating-linear-gradient(
              90deg,
              #6f6247 0px,
              #9d8b61 22px,
              #4a3f2d 42px,
              #2b251b 60px
            );
          border: 8px solid #1b1811;
          box-shadow:
            0 0 70px rgba(0,0,0,0.95),
            inset 0 0 80px rgba(0,0,0,0.65);
          border-radius: 8px;
        }

        .door-bay {
          position: absolute;
          right: 7%;
          top: 10%;
          width: 48%;
          height: 78%;
          background: #070807;
          border: 10px solid #252116;
          border-radius: 46% / 30%;
          overflow: hidden;
          box-shadow:
            inset 0 0 35px rgba(0,0,0,1),
            0 0 24px rgba(0,0,0,0.8);
        }

        .green-inside {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at center, rgba(0,255,136,1), rgba(0,70,28,0.7) 34%, #000 68%);
          opacity: 0;
          animation: innerGlow 4.5s ease forwards;
        }

        .vault-door {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 68%;
          height: 82%;
          transform: translate(-50%, -50%);
          border-radius: 50% / 32%;
          background:
            radial-gradient(circle at 50% 50%, #34342d 0%, #151515 58%, #050505 100%);
          border: 7px solid #3d3828;
          box-shadow:
            inset 0 0 28px rgba(0,0,0,0.95),
            0 0 18px rgba(0,0,0,0.9);
          animation: doorOpen 4.5s cubic-bezier(.55,.02,.22,1) forwards;
          z-index: 4;
        }

        .vault-door::before {
          content: "";
          position: absolute;
          inset: 18%;
          border-radius: 50%;
          border: 6px solid rgba(110,100,72,0.9);
          box-shadow:
            inset 0 0 18px rgba(0,0,0,0.9),
            0 0 10px rgba(255,170,30,0.25);
        }

        .vault-door::after {
          content: "4";
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,180,35,0.85);
          font-size: clamp(48px, 9vw, 110px);
          font-weight: 900;
          text-shadow: 0 0 18px #000;
        }

        .yellow-ring {
          position: absolute;
          inset: 7px;
          border-radius: 46% / 30%;
          border: 6px solid rgba(255,176,35,0.55);
          z-index: 3;
          pointer-events: none;
        }

        .floor-steps {
          position: absolute;
          right: 18%;
          bottom: -12%;
          width: 24%;
          height: 18%;
          background:
            repeating-linear-gradient(
              180deg,
              #292014 0px,
              #292014 8px,
              #090706 9px,
              #090706 16px
            );
          transform: perspective(160px) rotateX(52deg);
          box-shadow: 0 15px 25px rgba(0,0,0,0.7);
        }

        .boot-text {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 7%;
          text-align: center;
          letter-spacing: 4px;
          font-size: 15px;
          text-shadow: 0 0 12px rgba(0,255,136,0.85);
          animation: textFade 4.5s ease forwards;
          z-index: 10;
        }

        .blackout {
          position: absolute;
          inset: 0;
          background: #000;
          opacity: 0;
          animation: fadeToDash 4.5s ease forwards;
          pointer-events: none;
          z-index: 20;
        }

        @keyframes cameraZoom {
          0% { transform: scale(1); }
          45% { transform: scale(1.18); }
          75% { transform: scale(2.4); }
          100% { transform: scale(5.8); }
        }

        @keyframes doorOpen {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            opacity: 1;
          }
          35% {
            transform: translate(-50%, -50%) rotate(-3deg);
            opacity: 1;
          }
          100% {
            transform: translate(105%, -50%) rotate(-12deg);
            opacity: 0.05;
          }
        }

        @keyframes innerGlow {
          0% { opacity: 0; }
          35% { opacity: 0.12; }
          70% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        @keyframes textFade {
          0%, 60% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes fadeToDash {
          0%, 86% { opacity: 0; }
          100% { opacity: 1; }
        }

        @media (max-width: 720px) {
          .bunker-wall {
            width: 96vw;
            height: 62vw;
          }

          .door-bay {
            right: 5%;
            width: 52%;
            height: 78%;
          }
        }
      `}</style>

      <div className="vault-camera">
        <div className="bunker-wall">
          <div className="door-bay">
            <div className="green-inside" />
            <div className="yellow-ring" />
            <div className="vault-door" />
          </div>

          <div className="floor-steps" />
        </div>
      </div>

      <div className="boot-text">
        VAULT ACCESS SEQUENCE<br />
        DOOR OPENING — ENTERING PIP-TRADE 3000
      </div>

      <div className="blackout" />
    </div>
  );
}
