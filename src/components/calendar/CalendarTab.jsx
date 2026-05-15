import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../AppContext";
import { CalendarDays, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { deriveMockEvents, EVENT_KIND_STYLES } from "../../lib/billing";
import BillingEditModal from "./BillingEditModal";

const pad = (n) => String(n).padStart(2, "0");
const monthKey = (year, month) => `${year}-${pad(month + 1)}`;

export default function CalendarTab() {
  const {
    services,
    calendarEvents,
    fetchCalendar,
    billing,
    updateBilling,
  } = useApp();
  const todayRef = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => ({
    year: todayRef.getFullYear(),
    month: todayRef.getMonth(),
  }));
  const [editingServiceId, setEditingServiceId] = useState(null);

  const currentMonthStr = monthKey(cursor.year, cursor.month);

  useEffect(() => {
    fetchCalendar(currentMonthStr);
  }, [currentMonthStr, fetchCalendar]);

  const mockEvents = useMemo(
    () => deriveMockEvents(services, billing),
    [services, billing],
  );

  const allEvents = useMemo(
    () => [...calendarEvents, ...mockEvents],
    [calendarEvents, mockEvents],
  );

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const goPrevMonth = () => {
    setCursor((c) => {
      const d = new Date(c.year, c.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };
  const goNextMonth = () => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };
  const goToday = () => {
    const t = new Date();
    setCursor({ year: t.getFullYear(), month: t.getMonth() });
  };

  const isCurrentMonth =
    cursor.year === todayRef.getFullYear() &&
    cursor.month === todayRef.getMonth();
  const todayDay = todayRef.getDate();

  const getEventsForDay = (day) => {
    const targetDate = `${currentMonthStr}-${pad(day)}`;
    return allEvents.filter((e) => e.event_date === targetDate);
  };

  const upcoming = useMemo(
    () =>
      [...allEvents]
        .filter((e) => e.event_date)
        .sort((a, b) => a.event_date.localeCompare(b.event_date)),
    [allEvents],
  );

  const editingService = editingServiceId
    ? services.find((s) => s.id === editingServiceId)
    : null;

  return (
    <div className="h-full min-h-0 p-8 max-w-5xl mx-auto fade-in flex flex-col">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">중요 일정</h1>
          <p className="text-gray-500 mt-2">
            구독 시작일과 정기 결제일을 한눈에 확인하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            오늘
          </button>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
            <button
              onClick={goPrevMonth}
              aria-label="이전 달"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-gray-800 min-w-[110px] text-center tabular-nums">
              {cursor.year}년 {cursor.month + 1}월
            </span>
            <button
              onClick={goNextMonth}
              aria-label="다음 달"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        {/* 캘린더 그리드 (왼쪽 8칸) */}
        <div className="col-span-8 bg-white rounded-[32px] border border-gray-100 toss-shadow flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-8 pb-4">
          <div className="grid grid-cols-7 mb-4">
            {weekDays.map((d) => (
              <div
                key={d}
                className={`text-center text-xs font-bold ${
                  d === "일" ? "text-red-400" : "text-gray-400"
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-4">
            {Array(firstWeekday)
              .fill(null)
              .map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const hasEvent = dayEvents.length > 0;
              const isToday = isCurrentMonth && day === todayDay;

              return (
                <div
                  key={day}
                  className="aspect-square flex flex-col items-center justify-start p-1 relative cursor-pointer hover:bg-gray-50 rounded-xl transition"
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday
                        ? "w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full font-bold"
                        : hasEvent
                          ? "text-blue-600 font-bold"
                          : "text-gray-700"
                    }`}
                  >
                    {day}
                  </span>
                  {hasEvent && (
                    <div className="flex gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const style = EVENT_KIND_STYLES[evt.kind] || {
                          dot: "bg-blue-500",
                        };
                        return (
                          <div
                            key={evt.id}
                            className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                          />
                        );
                      })}
                    </div>
                  )}
                  {hasEvent && (
                    <div className="absolute inset-0 border-2 border-blue-500/20 rounded-xl"></div>
                  )}
                </div>
              );
            })}
          </div>

          </div>

          {/* 범례 (카드 하단 고정) */}
          <div className="shrink-0 border-t border-gray-100 px-8 py-3 bg-gray-50 flex items-center justify-center gap-5 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span>구독 시작</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-300" />
              <span>지난 결제</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>다음 결제</span>
            </div>
          </div>
        </div>

        {/* 다가오는 일정 리스트 (오른쪽 4칸) */}
        <div className="col-span-4 flex flex-col min-h-0">
          <h3 className="text-lg font-bold text-gray-900 ml-1 mb-4 shrink-0">
            다가오는 일정
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0">
            {upcoming.map((evt) => {
              const service = services.find((s) => s.id === evt.term_id);
              const style = EVENT_KIND_STYLES[evt.kind] || {
                badge: "bg-blue-50 text-blue-600 border-blue-100",
              };
              const editable = evt.source === "mock" && service;
              return (
                <div
                  key={evt.id}
                  className={`group bg-white p-5 rounded-2xl border border-gray-100 toss-card-shadow flex items-start gap-4 transition ${
                    editable
                      ? "hover:border-blue-200 cursor-pointer"
                      : ""
                  }`}
                  onClick={() => {
                    if (editable) setEditingServiceId(service.id);
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-blue-500">
                        {evt.event_date}
                      </span>
                      <span
                        className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${style.badge}`}
                      >
                        {evt.event_type}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-gray-800 truncate">
                      {service?.name || evt.label || "알 수 없는 서비스"}
                    </div>
                  </div>
                  {editable && (
                    <Pencil className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition shrink-0 mt-1" />
                  )}
                </div>
              );
            })}

            {upcoming.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">
                  등록된 일정이 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingService && (
        <BillingEditModal
          service={editingService}
          billing={billing[editingService.id]}
          onSave={(patch) => updateBilling(editingService.id, patch)}
          onClose={() => setEditingServiceId(null)}
        />
      )}
    </div>
  );
}
