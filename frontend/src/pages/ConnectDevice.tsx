import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, PairingStart } from "../api/client";

export function ConnectDevice() {
  const [pairing, setPairing] = useState<PairingStart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api
      .pairStart()
      .then(setPairing)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to start pairing"));
  }, []);

  useEffect(() => {
    if (!pairing) return;
    pollRef.current = setInterval(async () => {
      const device = await api.pairStatus(pairing.code);
      if (device) {
        if (pollRef.current) clearInterval(pollRef.current);
        navigate(`/devices/${device.id}`);
      }
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pairing, navigate]);

  const qrPayload = pairing ? JSON.stringify({ code: pairing.code }) : "";

  return (
    <div className="page">
      <header className="page-header">
        <h1>Connect Device</h1>
      </header>
      <div className="card connect-card">
        {error && <p className="error">{error}</p>}
        {!pairing && !error && <p className="muted">Generating pairing code...</p>}
        {pairing && (
          <>
            <p className="muted">Open the monitoring-platform app on your phone and scan this code.</p>
            <div className="qr-wrap">
              <QRCodeSVG value={qrPayload} size={220} />
            </div>
            <p className="pairing-code">{pairing.code}</p>
            <p className="muted small">Or enter this code manually in the app. Expires in 5 minutes.</p>
            <p className="muted small">Waiting for device to scan...</p>
          </>
        )}
      </div>
    </div>
  );
}
