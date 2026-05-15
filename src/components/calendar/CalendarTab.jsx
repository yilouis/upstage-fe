import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../AppContext";
import { CalendarDays, Pencil } from "lucide-react";
import { deriveMockEvents, EVENT_KIND_STYLES } from "../../lib/billing";
import BillingEditModal from "./BillingEditModal";

export default function CalendarTab() {
  const {
    services,
    calendarEvents,
    fetchCalendar,
    billing,
    updateBilling,
  } = useApp();
  const [currentMonthStr, setCurrentMonthStr] = useState("2026-05");
  const [editingServiceId, setEditingServiceId] = useState(null);

  useEffect(() => {
    fetchCalendar(currentMonthStr);
  }, [currentMonthStr, fetchCalendar]);

  const mockEvents = useMemo(
    () => deriveMockEvents(services, billing),
    [services, billing],
  );

  // Backend events first (real), then mock — both contribute dots/cards.
  const allEvents = useMemo(
    () => [...calendarEvents, ...mockEvents],
    [calendarEvents, mockEvents],
  );

  // 달력 데이터 생성 (간단하게 현재 선택된 달의 일수를 31로 고정하여 보여주되, 실제론 Date 로직 필요)
  // Demo purpose: 2026년 5월 고정 (실무에선 날짜 라이브러리 사용 권장)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const getEventsForDay = (day) => {
    const dayStr = day.toString().padStart(2, "0");
    const targetDate = `${currentMonthStr}-${dayStr}`;
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
    <div className="p-8 max-w-5xl mx-auto fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">중요 일정</h1>
          <p className="text-gray-500 mt-2">
            구독 시작일과 정기 결제일을 한눈에 확인하세요.
          </p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200">
          <button className="px-4 py-2 text-sm font-semibold bg-gray-800 text-white rounded-lg shadow-sm">
            May 2026
          </button>
          <button
            className="px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-gray-50 rounded-lg transition"
            onClick={() => alert("해당 월은 아직 지원하지 않습니다.")}
          >
            Jun
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* 캘린더 그리드 (왼쪽 8칸) */}
        <div className="col-span-8 bg-white rounded-[32px] p-8 border border-gray-100 toss-shadow">
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
            {/* 2026년 5월 1일은 금요일 시작이므로 앞에 빈 칸 5개 추가 */}
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const hasEvent = dayEvents.length > 0;

              return (
                <div
                  key={day}
                  className="aspect-square flex flex-col items-center justify-start p-1 relative cursor-pointer hover:bg-gray-50 rounded-xl transition"
                >
                  <span
                    className={`text-sm font-medium ${
                      hasEvent ? "text-blue-600 font-bold" : "text-gray-700"
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

          {/* 범례 */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-4 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-400" /> 구독 시작
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-300" /> 지난 결제
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> 다음 결제
            </div>
          </div>
        </div>

        {/* 다가오는 일정 리스트 (오른쪽 4칸) */}
        <div className="col-span-4 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 ml-1">
            다가오는 일정
          </h3>
          <div className="space-y-3">
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
