import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { MdQrCode2, MdPhoneIphone } from "react-icons/md";
import { StackNavigator } from './navigation/StackNavigator';

import { RootState } from './store';

import { hooks } from "./hooks";

const { useWindowSize } = hooks;

function App() {
  const color = useSelector((state: RootState) => state.bgSlice.color);
  const { width } = useWindowSize();
  const isMobile = width < 600; // Force mobile-only, blocking tablets (iPads) and desktop

  if (!isMobile) {
    return (
      <div
        className="app"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a", // Dark navy/slate matching screenshot
          height: "100vh",
          color: "#fff",
          textAlign: "center",
          padding: "20px",
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            padding: "40px",
            borderRadius: "50%",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "140px",
            height: "140px",
            boxShadow: "0 0 40px rgba(0, 0, 0, 0.2)"
          }}
        >
          <MdQrCode2 size={70} color="#ea580c" />
        </div>

        <h2 style={{
          fontSize: "2.2rem",
          fontWeight: 800,
          marginBottom: "16px",
          letterSpacing: "-1px"
        }}>
          Mobile Experience Only
        </h2>

        <p style={{
          color: "#94a3b8",
          maxWidth: "450px",
          lineHeight: "1.6",
          marginBottom: "40px",
          fontSize: "1.1rem",
          fontWeight: 500
        }}>
          This application is designed for mobile devices.<br />
          Please scan the QR code using your mobile phone<br />
          to access the menu and order.
        </p>

        <div style={{
          border: "1px solid rgba(148, 163, 184, 0.2)",
          padding: "12px 28px",
          borderRadius: "100px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#94a3b8",
          fontSize: "0.95rem",
          fontWeight: 600,
          background: "rgba(255, 255, 255, 0.02)"
        }}>
          <MdPhoneIphone size={20} />
          <span>Open on iOS or Android</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className='app'
      style={{ backgroundColor: color }}
    >
      <StackNavigator />
    </div>
  );
}

export default App;
