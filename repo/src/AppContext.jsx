import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "./lib/api";
import { DEFAULT_USER_ID } from "./config";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [view, setView] = useState("dashboard");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSector, setSelectedSector] = useState("전체");
  const [selectedService, setSelectedService] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Terms
      const termsRes = await api.listTerms();
      const terms = termsRes.items || [];
      
      // Transform backend domains into categories
      const categoryMap = {};
      terms.forEach(term => {
        const domain = term.domain || "미분류";
        if (!categoryMap[domain]) {
          categoryMap[domain] = {
            id: domain,
            name: domain,
            count: 0,
            sectors: ["전체"]
          };
        }
        categoryMap[domain].count += 1;
      });
      const newCategories = Object.values(categoryMap);
      setCategories(newCategories);

      // We map terms to the frontend service model
      const newServices = terms.map(term => ({
        id: term.id,
        name: term.service_name,
        category: term.domain || "미분류",
        sector: "전체", // Backend API does not have sector, fallback to 전체
        expiry: term.subscribed_at || "미상",
        initialTerms: term.created_at ? new Date(term.created_at).toISOString().split('T')[0] : "",
        status: term.status,
      }));
      setServices(newServices);

      if (newCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(newCategories[0].id);
      }

      // 2. Fetch Notifications
      const notiRes = await api.getNotifications({ userId: DEFAULT_USER_ID, status: "UNREAD" });
      setNotifications(notiRes.notifications || []);

    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add category is local for now, as API has no category management
  const addCategory = (categoryName) => {
    const newCategory = {
      id: categoryName,
      name: categoryName,
      count: 0,
      sectors: ["전체"],
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  // Add service delegates to API
  const addService = async ({ serviceName, file, subscribedAt }) => {
    const response = await api.uploadTerm({ serviceName, file, subscribedAt });
    await fetchData(); // refresh list
    return response;
  };

  const deleteNotification = async (id) => {
    try {
      await api.markNotificationRead({ notificationId: id, userId: DEFAULT_USER_ID });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  // Calendar fetch helper
  const fetchCalendar = async (month) => {
    try {
      const res = await api.listCalendarEvents({ userId: DEFAULT_USER_ID, month });
      setCalendarEvents(res.events || []);
    } catch (error) {
      console.error("Failed to fetch calendar", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        view, setView,
        selectedCategory, setSelectedCategory,
        selectedSector, setSelectedSector,
        selectedService, setSelectedService,
        draggedItem, setDraggedItem,
        categories, setCategories,
        services, setServices,
        addService,
        addCategory,
        sidebarOpen, setSidebarOpen,
        selectedVersionIndex, setSelectedVersionIndex,
        notifications, deleteNotification,
        calendarEvents, fetchCalendar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
