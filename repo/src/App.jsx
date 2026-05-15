import { useEffect } from "react";
import { AppProvider, useApp } from "./AppContext";
import TopBar from "./components/layout/TopBar";
import Sidebar from "./components/layout/Sidebar";
import DashboardTab from "./components/dashboard/DashboardTab";
import SearchTab from "./components/search/SearchTab";
import CalendarTab from "./components/calendar/CalendarTab";

function MainContent() {
  const { view } = useApp();

  return (
    <div className="h-screen flex flex-col">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 relative overflow-auto">
          {view === "dashboard" && <DashboardTab />}
          {view === "search" && <SearchTab />}
          {view === "calendar" && <CalendarTab />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";

    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.style.margin = "0";
      rootElement.style.padding = "0";
      rootElement.style.width = "100%";
      rootElement.style.height = "100vh";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
