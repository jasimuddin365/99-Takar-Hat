// Top-level routes. Customer (Module 9), vendor (Module 10), and admin
// (Module 11) pages are all wired in.
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAuth, RequireRole } from './components/RequireAuth';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import StallsPage from './pages/StallsPage.jsx';
import StallDetailPage from './pages/StallDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import VendorPage from './pages/VendorPage.jsx';
import VendorStallPage from './pages/VendorStallPage.jsx';
import VendorProductsPage from './pages/VendorProductsPage.jsx';
import VendorProductNewPage from './pages/VendorProductNewPage.jsx';
import VendorProductEditPage from './pages/VendorProductEditPage.jsx';
import VendorOrdersPage from './pages/VendorOrdersPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminVendorsPage from './pages/AdminVendorsPage.jsx';
import AdminProductsPage from './pages/AdminProductsPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import AdminCategoriesPage from './pages/AdminCategoriesPage.jsx';
import Spinner from './components/Spinner';

function Root() {
  // Guest-friendly root: show the home page (hero + categories + top products)
  // for everyone. Authed admins/vendors still jump straight to their dashboards.
  const { status, role, isAuthed } = useAuth();
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bazaar-bg">
        <Spinner label="Loading…" />
      </div>
    );
  }
  if (isAuthed && role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (isAuthed && role === 'VENDOR') return <Navigate to="/vendor" replace />;
  return <HomePage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* All other routes share the layout (Topbar + Footer + CartDrawer). */}
      <Route element={<Layout />}>
        {/* Public — open to guests. Authed admins/vendors are redirected by Root. */}
        <Route path="/" element={<Root />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/stalls" element={<StallsPage />} />
        <Route path="/stall/:slug" element={<StallDetailPage />} />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/wishlist"
          element={
            <RequireAuth>
              <WishlistPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* Vendor */}
        <Route
          path="/vendor"
          element={
            <RequireRole roles={['VENDOR', 'ADMIN']}>
              <VendorPage />
            </RequireRole>
          }
        />
        <Route
          path="/vendor/stall"
          element={
            <RequireRole roles={['VENDOR', 'ADMIN']}>
              <VendorStallPage />
            </RequireRole>
          }
        />
        <Route
          path="/vendor/products"
          element={
            <RequireRole roles={['VENDOR', 'ADMIN']}>
              <VendorProductsPage />
            </RequireRole>
          }
        />
        <Route
          path="/vendor/products/new"
          element={
            <RequireRole roles={['VENDOR', 'ADMIN']}>
              <VendorProductNewPage />
            </RequireRole>
          }
        />
        <Route
          path="/vendor/products/:id"
          element={
            <RequireRole roles={['VENDOR', 'ADMIN']}>
              <VendorProductEditPage />
            </RequireRole>
          }
        />
        <Route
          path="/vendor/orders"
          element={
            <RequireRole roles={['VENDOR', 'ADMIN']}>
              <VendorOrdersPage />
            </RequireRole>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminAnalyticsPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminUsersPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/vendors"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminVendorsPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminProductsPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminOrdersPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminCategoriesPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}