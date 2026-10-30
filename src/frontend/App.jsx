import { useState } from "react";
import { Route, Routes, Outlet, Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import Sidebar, { MobileNavigation } from "./components/Sidebar";
import Home from "./pages/Home";
import Wardrobe from "./pages/Wardrobe";
import AddItem from "./pages/AddItem";

export default function App() {
  const [clothes, setClothes] = useState([]);

  const addItem = (item) =>
    setClothes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...item,
        image: item.image ? URL.createObjectURL(item.image) : "",
      },
    ]);
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="wardrobe" element={<Wardrobe />} />
        <Route path="/wardrobe/new" element={<AddItem onAdd={addItem} />} />
        <Route
          path="outfits"
          element={<PlaceholderPage title="My Outfits" />}
        />

        <Route
          path="preferences"
          element={<PlaceholderPage title="Style & Preferences" />}
        />
        <Route
          path="profile"
          element={<PlaceholderPage title="Profile & Settings" />}
        />
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Route>
    </Routes>
  );
}

// Bütün səhifələrin ortaq çərçivəsi.
function AppLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,#e6f2ff_0%,#f2f8ff_55%,#eaf4ff_100%)]  4xl:px-7 4xl:py-12">
      <div className="app-container flex min-h-[calc(100dvh-96px)] overflow-hidden rounded-2xl border border-white/90 bg-white/65 shadow-soft">
        <Sidebar />

        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 pt-5 pb-24 sm:px-6 sm:pt-6 lg:ml-[205px] lg:pb-6 xl:ml-[220px] xl:px-7"
        >
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}

// Digər səhifələri yazanda bu route-ları öz komponentlərinlə əvəz et.
function PlaceholderPage({ title }) {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center rounded-2xl border border-line bg-white p-8 text-center">
      <Construction className="mb-5 text-brand" size={36} strokeWidth={1.4} />
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
        This page is ready for your implementation. The shared navigation and
        layout are already connected.
      </p>
      <Link
        to="/"
        className="mt-7 inline-flex items-center gap-2 rounded-lg bg-selected px-5 py-3 text-sm font-medium text-brand"
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>
    </section>
  );
}
