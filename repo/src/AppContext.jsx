import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "./lib/api";
import { DEFAULT_USER_ID } from "./config";

const AppContext = createContext();

// localStorage key
const SUBSCRIBED_KEY = "term_tracker_subscribed_ids";

function loadSubscribedIds() {
  try {
    const raw = localStorage.getItem(SUBSCRIBED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSubscribedIds(ids) {
  localStorage.setItem(SUBSCRIBED_KEY, JSON.stringify(ids));
}

export const AppProvider = ({ children }) => {
  const [view, setView] = useState("dashboard");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSector, setSelectedSector] = useState("전체");
  const [selectedService, setSelectedService] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  // catalog = DB에 저장된 모든 약관 (검색용 카탈로그)
  const [catalog, setCatalog] = useState([]);
  // services = 사용자가 직접 추가(구독)한 서비스만
  const [services, setServices] = useState([]);
  const [subscribedIds, setSubscribedIds] = useState(loadSubscribedIds);

  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // 카탈로그 fetch (DB의 모든 약관)
  const fetchCatalog = useCallback(async () => {
    try {
      const termsRes = await api.listTerms();
      const terms = termsRes.items || [];
      
      const catalogItems = terms.map(term => ({
        id: term.id,
        name: term.service_name,
        category: term.domain || "미분류",
        sector: "전체",
        expiry: term.subscribed_at || "미상",
        initialTerms: term.created_at ? new Date(term.created_at).toISOString().split('T')[0] : "",
        status: term.status,
      }));
      setCatalog(catalogItems);

      // 구독한 서비스만 필터링
      const subscribed = catalogItems.filter(item => subscribedIds.includes(item.id));
      setServices(subscribed);

      // 구독한 서비스의 도메인 기반으로 카테고리 생성
      const categoryMap = {};
      subscribed.forEach(svc => {
        const domain = svc.category;
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

      // 구독한 서비스가 없으면 기본 카테고리
      if (newCategories.length === 0) {
        newCategories.push({ id: "내 서비스", name: "내 서비스", count: 0, sectors: ["전체"] });
      }

      setCategories(newCategories);
      if (newCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(newCategories[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch catalog:", error);
    }
  }, [subscribedIds, selectedCategory]);

  // 알림 fetch
  const fetchNotifications = useCallback(async () => {
    try {
      const notiRes = await api.getNotifications({ userId: DEFAULT_USER_ID, status: "UNREAD" });
      setNotifications(notiRes.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
    fetchNotifications();
  }, [fetchCatalog, fetchNotifications]);

  // 카테고리 추가 (로컬)
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

  // 사용자가 카탈로그에서 기존 서비스를 구독(내 보관함에 추가)
  const subscribeService = (termId) => {
    if (subscribedIds.includes(termId)) return; // 이미 구독
    const newIds = [...subscribedIds, termId];
    setSubscribedIds(newIds);
    saveSubscribedIds(newIds);

    // 즉시 services에 반영
    const item = catalog.find(c => c.id === termId);
    if (item) {
      setServices(prev => [...prev, item]);
      // 카테고리도 업데이트
      setCategories(prev => {
        const existing = prev.find(c => c.id === item.category);
        if (existing) {
          return prev.map(c => c.id === item.category ? { ...c, count: c.count + 1 } : c);
        }
        return [...prev, { id: item.category, name: item.category, count: 1, sectors: ["전체"] }];
      });
    }
  };

  // 사용자가 구독 해제
  const unsubscribeService = (termId) => {
    const newIds = subscribedIds.filter(id => id !== termId);
    setSubscribedIds(newIds);
    saveSubscribedIds(newIds);
    setServices(prev => prev.filter(s => s.id !== termId));
  };

  // 새 서비스 업로드 (PDF) → 업로드 후 자동 구독
  const addService = async ({ serviceName, file, subscribedAt }) => {
    const response = await api.uploadTerm({ serviceName, file, subscribedAt });
    // 업로드 성공 시 자동 구독
    if (response?.id) {
      const newIds = [...subscribedIds, response.id];
      setSubscribedIds(newIds);
      saveSubscribedIds(newIds);
    }
    await fetchCatalog(); // 카탈로그 새로고침
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

  // Calendar fetch
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
        catalog, // DB 전체 카탈로그
        services, setServices, // 사용자가 구독한 서비스만
        addService,
        subscribeService,
        unsubscribeService,
        subscribedIds,
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
