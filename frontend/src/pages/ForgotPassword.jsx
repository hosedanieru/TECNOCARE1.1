import { useState } from "react";

// Ajusta esta base URL a la de tu API real
const API_BASE = import.meta.env.VITE_API_URL || "https://tu-backend.onrender.com/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("done");
    } catch (err) {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Revisa tu correo</h2>
        <p style={{ color: "#6B6E74", fontSize: 14.5, lineHeight: 1.6 }}>
          Si el correo está registrado en TecnoCare, te llegarán las instrucciones
          para restablecer tu contraseña en unos minutos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 380, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>
        Restablecer contraseña
      </h2>
      <p style={{ color: "#6B6E74", fontSize: 14.5, marginBottom: 20 }}>
        Ingresa el correo asociado a tu cuenta de técnico.
      </p>

      <label htmlFor="email" style={{ display: "block", fontSize: 12.5, marginBottom: 6 }}>
        Correo electrónico
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tecnico@correo.com"
        style={{
          width: "100%",
          padding: "12px 14px",
          border: "1px solid #DDDDDE",
          borderRadius: 3,
          marginBottom: 16,
          fontSize: 14.5,
        }}
      />

      {status === "error" && (
        <p style={{ color: "#B3261E", fontSize: 13, marginBottom: 12 }}>
          Algo falló al enviar la solicitud. Intenta de nuevo.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          width: "100%",
          padding: 13,
          background: "#0A0A0B",
          color: "#fff",
          border: "none",
          borderRadius: 3,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {status === "loading" ? "Enviando..." : "Enviar instrucciones"}
      </button>
    </form>
  );
}