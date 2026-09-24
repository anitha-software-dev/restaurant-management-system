import React from "react";
import LoaderImg from '../assets/images/loader.png'

interface LoaderProps {
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({ text = "Loading..." }) => {
  return (
    <main className="scrollable center" style={{ background: '#f8fafc' }}>
      <style>
        {`
          @keyframes pulse-animation {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
          }
        `}
      </style>
      <div className="container" style={{ height: "100%", margin: "auto", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: "center" }}>
          <img
            src={LoaderImg}
            alt="Loading..."
            style={{
              width: "220px",
              height: "220px",
              margin: "0 auto",
              display: "block",
              animation: "pulse-animation 2s infinite ease-in-out"
            }}
          />
          <p
            style={{
              marginTop: 10,
              fontSize: "18px",
              fontWeight: "800",
              color: "#3f3f46",
              textAlign: "center",
            }}
          >
            {text}
          </p>
        </div>
      </div>
    </main>
  );
};
