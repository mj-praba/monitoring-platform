import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, Device, clearToken } from "../api/client";

export function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function refresh() {
    setDevices(await api.listDevices());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Devices</h1>
        <div>
          <Link to="/docs">
            <button className="link">Docs</button>
          </Link>
          <Link to="/devices/connect">
            <button>+ Connect Device</button>
          </Link>
          <button
            className="link"
            onClick={() => {
              clearToken();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {loading && <p className="muted">Loading...</p>}
      {!loading && devices.length === 0 && (
        <p className="muted">No devices yet. Click "Connect Device" to pair your phone.</p>
      )}

      <div className="device-grid">
        {devices.map((d) => (
          <Link key={d.id} to={`/devices/${d.id}`} className="card device-card">
            <div className="device-card-top">
              <strong>{d.name}</strong>
              <span className={`badge ${d.status === "online" ? "badge-online" : "badge-offline"}`}>
                {d.status}
              </span>
            </div>
            <span className="muted">{d.platform}</span>
            <span className="muted small">
              {d.last_seen_at ? `Last seen ${new Date(d.last_seen_at).toLocaleTimeString()}` : "Never seen"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
