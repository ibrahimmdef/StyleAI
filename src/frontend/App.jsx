import { useEffect, useState } from "react";
import { Route, Routes, Outlet, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import Sidebar, { MobileNavigation } from "./components/Sidebar";
import Home from "./pages/Home";
import Wardrobe from "./pages/Wardrobe";
import AddItem from "./pages/AddItem";
import Outfits from "./pages/Outfits";
import OutfitDetails from "./pages/OutfitDetails";
import BuildOutfit from "./pages/BuildOutfit";
import Preferences from "./pages/Preferences";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import { API_URL } from "./api";

export default function App() {
  return (
    <Routes>
      {/* Login has no sidebar, so it sits outside the layout */}
      <Route path="login" element={<Login />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="wardrobe" element={<Wardrobe />} />
        <Route path="/wardrobe/new" element={<AddItem />} />
        <Route path="/wardrobe/:id/edit" element={<AddItem />} />
        <Route path="outfits" element={<Outfits />} />
        <Route path="/outfits/new" element={<BuildOutfit />} />
        <Route path="/outfits/:id" element={<OutfitDetails />} />
        <Route path="/outfits/:id/edit" element={<BuildOutfit />} />
        <Route path="preferences" element={<Preferences />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Route>
    </Routes>
  );
}

function AppLayout() {
  // The sidebar and the pages both need the name, so it's loaded once here.
  // It's also the login check: no profile means nobody is logged in.
  const [profile, setProfile] = useState(null);
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/profile`)
      .then((res) => {
        if (res.status === 401) {
          setLoggedOut(true);
          return null;
        }
        return res.json();
      })
      .then((data) => data && setProfile(data))
      .catch(() => setLoggedOut(true));
  }, []);

  if (loggedOut) return <Navigate to="/login" replace />;
  // Still checking: show nothing rather than a page that can't load yet
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-selected/70 via-canvas to-canvas 4xl:px-7 4xl:py-12">
      <div className="app-container flex min-h-[calc(100dvh-96px)] overflow-hidden rounded-2xl border border-surface/90 bg-surface/65 shadow-soft">
        <Sidebar profile={profile} />

        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 pt-5 pb-24 sm:px-6 sm:pt-6 lg:ml-[205px] lg:pb-6 xl:ml-[220px] xl:px-7"
        >
          {/* Pages get it with useOutletContext() */}
          <Outlet context={{ profile, setProfile }} />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center rounded-2xl border border-line bg-surface p-8 text-center">
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
