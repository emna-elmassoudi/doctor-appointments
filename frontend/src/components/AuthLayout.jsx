import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AuthLayout() {
  return (
    <div>
      <Navbar />
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
