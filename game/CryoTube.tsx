import VaultCompanion from "../app/components/VaultCompanion";

export default function CryoTube(props: any) {
  return (
    <div className="cryo-wrap">
      
      {/* GLASS TUBE */}
      <div className="cryo-glass">
        
        {/* VAULT GIRL INSIDE */}
        <div className="cryo-occupant">
          <VaultCompanion {...props} />
        </div>

        {/* LIQUID OVERLAY */}
        <div className="cryo-fluid" />

      </div>

      {/* BASE */}
      <div className="cryo-base">VAULT 63 LIFE POD</div>

      <style jsx>{`
        .cryo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cryo-glass {
          width: 280px;
          height: 420px;
          border-radius: 140px;
          border: 2px solid #00ff88;
          position: relative;
          overflow: hidden;
          box-shadow:
            0 0 20px rgba(0,255,136,0.3),
            inset 0 0 30px rgba(0,255,136,0.1);
          background: radial-gradient(
            ellipse at center,
            rgba(0,255,136,0.08),
            rgba(0,0,0,0.95)
          );
        }

        .cryo-occupant {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .cryo-fluid {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,255,136,0.2),
            rgba(0,255,136,0.05)
          );
          animation: fluidPulse 3s ease-in-out infinite;
          z-index: 3;
          pointer-events: none;
        }

        .cryo-base {
          margin-top: 10px;
          font-size: 12px;
          opacity: 0.7;
        }

        @keyframes fluidPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
