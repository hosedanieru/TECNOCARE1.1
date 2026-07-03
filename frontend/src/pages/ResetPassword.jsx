import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// Ajusta esta base URL a la de tu API real
const API_BASE = import.meta.env.VITE_API_URL || "https://tu-backend.onrender.com/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState("");

  if (!uid || !token) {
    return (
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Enlace inválido</h2>
        <p style={{ color: "#6B6E74", fontSize: 14.5 }}>
          Este enlace no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/password-reset/confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.detail || "No se pudo actualizar la contraseña.");
        setStatus("error");
        return;
      }
      setStatus("done");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setErrorMsg("Ocurrió un error de conexión.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Contraseña actualizada</h2>
        <p style={{ color: "#6B6E74", fontSize: 14.5 }}>
          Ya puedes iniciar sesión con tu nueva contraseña. Te redirigimos en un momento...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 380, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>
        Nueva contraseña
      </h2>
      <p style={{ color: "#6B6E74", fontSize: 14.5, marginBottom: 20 }}>
        Elige una nueva contraseña para tu cuenta.
      </p>

      <label htmlFor="password" style={{ display: "block", fontSize: 12.5, marginBottom: 6 }}>
        Nueva contraseña
      </label>
      <input
        id="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mínimo 8 caracteres"
        style={{
          width: "100%",
          padding: "12px 14px",
          border: "1px solid #DDDDDE",
          borderRadius: 3,
          marginBottom: 16,
          fontSize: 14.5,
        }}
      />

      <label htmlFor="confirm" style={{ display: "block", fontSize: 12.5, marginBottom: 6 }}>
        Confirmar contraseña
      </label>
      <input
        id="confirm"
        type="password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Repite la contraseña"
        style={{
          width: "100%",
          padding: "12px 14px",
          border: "1px solid #DDDDDE",
          borderRadius: 3,
          marginBottom: 16,
          fontSize: 14.5,
        }}
      />

      {errorMsg && (
        <p style={{ color: "#B3261E", fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>
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
        {status === "loading" ? "Guardando..." : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}