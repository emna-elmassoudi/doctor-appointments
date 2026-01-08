import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  const { pathname } = useLocation();
  const noPad = pathname === "/" || pathname === "/home";

  return (
    <div>
      <Navbar />
      <main style={{ padding: noPad ? 0 : 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
