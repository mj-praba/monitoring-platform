import { Link } from "react-router-dom";

const WINDOWS_DOWNLOAD_URL =
  "https://github.com/mj-praba/monitoring-platform/releases/latest/download/System%20Monitor-Setup-win.exe";
const LINUX_DOWNLOAD_URL =
  "https://github.com/mj-praba/monitoring-platform/releases/latest/download/System%20Monitor-Setup-linux.AppImage";

export function Docs() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Docs</h1>
        <Link to="/devices">
          <button>Back to Devices</button>
        </Link>
      </header>

      <section className="card">
        <h2>Install on Windows</h2>
        <ol>
          <li>
            Download the installer: <a href={WINDOWS_DOWNLOAD_URL}>System Monitor-Setup-win.exe</a>
          </li>
          <li>Run the downloaded .exe and follow the setup wizard.</li>
          <li>
            The installer isn't code-signed yet, so Windows SmartScreen may show an "unknown
            publisher" warning. Click <strong>More info → Run anyway</strong> to continue.
          </li>
        </ol>
      </section>

      <section className="card">
        <h2>Install on Linux</h2>
        <ol>
          <li>
            Download the AppImage: <a href={LINUX_DOWNLOAD_URL}>System Monitor-Setup-linux.AppImage</a>
          </li>
          <li>
            Make it executable:
            <br />
            <code>chmod +x "System Monitor-Setup-linux.AppImage"</code>
          </li>
          <li>
            Run it:
            <br />
            <code>./"System Monitor-Setup-linux.AppImage"</code>
          </li>
        </ol>
      </section>

      <section className="card">
        <h2>Connect the app</h2>
        <p className="muted">
          System Monitor currently runs standalone and reports metrics for the local machine only
          &mdash; it doesn't yet connect to your dashboard account. Once device pairing is
          available, the steps to link an installed app to a device on this dashboard will be
          documented here.
        </p>
      </section>
    </div>
  );
}
