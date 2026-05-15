import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "./lib/api";
import { DEFAULT_USER_ID } from "./config";
import { getDomainLabel } from "./lib/domainLabels";
import {
  loadBilling,
  saveBilling,
  seedDefaultsForServices,
  updateBillingRecord,
} from "./lib/billing";

const AppContext = createContext();

// localStorage key
const SUBSCRIBED_KEY = "term_tracker_subscribed_ids";
const CUSTOM_CATEGORIES_KEY = "term_tracker_custom_categories";

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

function loadCustomCategories() {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomCategories(categories) {
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
}

function mergeCategories(generatedCategories, customCategories) {
  const merged = [...generatedCategories];

  customCategories.forEach((customCategory) => {
    const existing = merged.find((category) => category.id === customCategory.id);
    if (!existing) {
      merged.push({ ...customCategory, count: customCategory.count || 0 });
    }
  });

  if (merged.length === 0) {
    merged.push({ id: "내 서비스", name: "내 서비스", count: 0, sectors: ["전체"] });
  }

  return merged;
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
  const [customCategories, setCustomCategories] = useState(loadCustomCategories);

  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [billing, setBilling] = useState(loadBilling);

  // Seed default mock billing for OTT services (Netflix, Spotify) on first
  // appearance. Persists to localStorage so seeding only happens once per
  // service.
  useEffect(() => {
    if (services.length === 0) return;
    const { data, changed } = seedDefaultsForServices(services, billing);
    if (changed) {
      setBilling(data);
      saveBilling(data);
    }
  }, [services, billing]);

  const updateBilling = (serviceId, patch) => {
    setBilling((prev) => {
      const next = updateBillingRecord(prev, serviceId, patch);
      saveBilling(next);
      return next;
    });
  };

  // 카탈로그 fetch (DB의 모든 약관)
  const fetchCatalog = useCallback(async () => {
    try {
      const termsRes = await api.listTerms();
      const terms = termsRes.items || [];
      
      const catalogItems = terms.map(term => ({
        id: term.id,
        name: term.service_name,
        vendor_slug: term.vendor_slug || null,
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
            name: getDomainLabel(domain),
            count: 0,
            sectors: ["전체"]
          };
        }
        categoryMap[domain].count += 1;
      });
      const newCategories = mergeCategories(
        Object.values(categoryMap),
        customCategories,
      );

      setCategories(newCategories);
    } catch (error) {
      console.error("Failed to fetch catalog:", error);
    }
  }, [subscribedIds, selectedCategory, customCategories]);

  // 알림 fetch
  const fetchNotifications = useCallback(async () => {
    try {
      const notiRes = await api.getNotifications({
        userId: DEFAULT_USER_ID,
        status: "UNREAD",
      });
      const mapped = (notiRes.notifications || []).map((noti) => ({
        id: noti.id,
        serviceId: noti.term_id,
        title: noti.title,
        summary: noti.diff_summary || "약관 변경 사항이 있습니다.",
        date: noti.created_at
          ? new Date(noti.created_at).toISOString().split("T")[0]
          : "",
        status: noti.status,
        versionId: noti.version_id ?? null,
      }));
      setNotifications(mapped);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
    fetchNotifications();
  }, [fetchCatalog, fetchNotifications]);

  // 카테고리 삭제 (로컬, 사용자 추가한 것만)
  const removeCategory = (categoryId) => {
    setCustomCategories((prev) => {
      const next = prev.filter((c) => c.id !== categoryId);
      saveCustomCategories(next);
      return next;
    });
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setSelectedCategory((prev) => (prev === categoryId ? "" : prev));
  };

  // 카테고리 추가 (로컬)
  const addCategory = (categoryName) => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) return null;

    const existing = categories.find((category) => category.id === trimmedName);
    if (existing) return existing;

    const newCategory = {
      id: trimmedName,
      name: trimmedName,
      count: 0,
      sectors: ["전체"],
      isCustom: true,
    };
    setCustomCategories((prev) => {
      const next = [...prev, newCategory];
      saveCustomCategories(next);
      return next;
    });
    setCategories((prev) => mergeCategories(prev, [newCategory]));
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
        return [...prev, { id: item.category, name: getDomainLabel(item.category), count: 1, sectors: ["전체"] }];
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
  const addService = async ({ serviceName, file, subscribedAt, effectiveDate }) => {
    const response = await api.uploadTerm({ serviceName, file, subscribedAt, effectiveDate });
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
      await api.deleteNotification({
        notificationId: id,
        userId: DEFAULT_USER_ID,
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead({ userId: DEFAULT_USER_ID });
      setNotifications([]);
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
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
        removeCategory,
        sidebarOpen, setSidebarOpen,
        selectedVersionIndex, setSelectedVersionIndex,
        notifications, deleteNotification, markAllNotificationsRead,
        calendarEvents, fetchCalendar,
        billing, updateBilling,
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
