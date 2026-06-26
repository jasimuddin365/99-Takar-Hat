// Shared layout wrapper — Topbar + outlet + Footer + cart drawer.
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col bg-bazaar-bg">
      <Topbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}