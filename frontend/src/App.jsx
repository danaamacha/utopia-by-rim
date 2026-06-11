// frontend/src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RTL_LANGS } from "./i18n";
import { fonts } from "./theme";

import Header from "./components/Header";
import Footer from "./Footer";
import ScrollTopButton from "./components/ScrollTopButton";

/* ---------------- Main Pages ---------------- */
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import FAQ from "./pages/FAQ";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

/* ---------------- Auth & Account ---------------- */
import AuthProvider from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./auth/pages/Login";
import Register from "./auth/pages/Register";
import ForgotPassword from "./auth/pages/ForgotPassword";
import ResetPassword from "./auth/pages/ResetPassword";
import Profile from "./pages/account/Profile";
import Addresses from "./pages/account/Addresses";
import Orders from "./pages/account/Orders";
// import Wishlist from "./pages/account/Wishlist";

/* ---------------- Admin (Owner Only) ---------------- */
import ProtectedAdminRoute from "./pages/admin/ProtectedAdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";

// 👇 split products pages
import AdminProductList from "./pages/admin/AdminProductList";
import AdminProductCreate from "./pages/admin/AdminProductCreate";
import AdminProductEdit from "./pages/admin/AdminProductEdit";

import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminPages from "./pages/admin/AdminPages";
import AdminDiscounts from "./pages/admin/AdminDiscounts";
import AdminSettings from "./pages/admin/AdminSettings";

export default function App() {
  const { i18n } = useTranslation();
  const isRTL = RTL_LANGS.includes(i18n.language);
  const loc = useLocation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [i18n.language, isRTL, loc]);

  return (
    <AuthProvider>
      <div
        style={{
          fontFamily: fonts.base,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        <div style={{ flex: 1 }}>
          <Routes>
            {/* ----------- Public Routes ----------- */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/legal" element={<Legal />} />

            {/* ----------- Auth Routes ----------- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset" element={<ResetPassword />} />

            {/* ----------- Admin (Owner Only) ----------- */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              {/* /admin */}
              <Route index element={<AdminOverview />} />

              {/* /admin/products */}
              <Route path="products" element={<AdminProductList />} />
              {/* /admin/products/new */}
              <Route path="products/new" element={<AdminProductCreate />} />
              {/* /admin/products/:id/edit */}
              <Route path="products/:id/edit" element={<AdminProductEdit />} />

              {/* /admin/orders */}
              <Route path="orders" element={<AdminOrders />} />
              {/* /admin/customers */}
              <Route path="customers" element={<AdminCustomers />} />
              {/* /admin/pages */}
              <Route path="pages" element={<AdminPages />} />
              {/* /admin/discounts */}
              <Route path="discounts" element={<AdminDiscounts />} />
              {/* /admin/settings */}
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* ----------- Protected Account Routes ----------- */}
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/addresses"
              element={
                <ProtectedRoute>
                  <Addresses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            {/* Wishlist later
            <Route
              path="/account/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            /> */}

            {/* ----------- Fallback ----------- */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>

        <Footer />
        <ScrollTopButton />
      </div>
    </AuthProvider>
  );
}
