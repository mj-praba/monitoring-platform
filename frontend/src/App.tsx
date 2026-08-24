import { Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./api/client";
import { ConnectDevice } from "./pages/ConnectDevice";
import { Devices } from "./pages/Devices";
import { Docs } from "./pages/Docs";
import { Login } from "./pages/Login";
import { Monitor } from "./pages/Monitor";

function RequireAuth({ children }: { children: JSX.Element }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/docs" element={<Docs />} />
      <Route
        path="/devices"
        element={
          <RequireAuth>
            <Devices />
          </RequireAuth>
        }
      />
      <Route
        path="/devices/connect"
        element={
          <RequireAuth>
            <ConnectDevice />
          </RequireAuth>
        }
      />
      <Route
        path="/devices/:deviceId"
        element={
          <RequireAuth>
            <Monitor />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={getToken() ? "/devices" : "/login"} replace />} />
    </Routes>
  );
}
