import React, { useEffect, useState } from "react";
import { useApp } from "../../AppContext";
import { CalendarDays } from "lucide-react";

export default function CalendarTab() {
  const { services, calendarEvents, fetchCalendar } = useApp();
  const [currentMonthStr, setCurrentMonthStr] = useState("2026-05");

  useEffect(() => {
    fetchCalendar(currentMonthStr);
  }, [currentMonthStr, fetchCalendar]);

  // 달력 데이터 생성 (간단하게 현재 선택된 달의 일수를 31로 고정하여 보여주되, 실제론 Date 로직 필요)
  // Demo purpose: 2026년 5월 고정 (실무에선 날짜 라이브러리 사용 권장)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const getEventsForDay = (day) => {
    const dayStr = day.toString().padStart(2, '0');
    const targetDate = `${currentMonthStr}-${dayStr}`;
    return calendarEvents.filter(e => e.event_date === targetDate);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">중요 일정</h1>
          <p className="text-gray-500 mt-2">
            약관 갱신 및 만료 예정일을 확인하세요.
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
        {/* 캘린더 그리드 (왼쪽 7칸) */}
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
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
                  )}
                  {hasEvent && (
                    <div className="absolute inset-0 border-2 border-blue-500/20 rounded-xl"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 다가오는 일정 리스트 (오른쪽 4칸) */}
        <div className="col-span-4 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 ml-1">
            다가오는 일정
          </h3>
          <div className="space-y-3">
            {calendarEvents.map((evt) => {
              const service = services.find(s => s.id === evt.term_id);
              return (
                <div
                  key={evt.id}
                  className="bg-white p-5 rounded-2xl border border-gray-100 toss-card-shadow flex items-start gap-4 hover:border-blue-200 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-blue-500 mb-0.5">
                      {evt.event_date}
                    </div>
                    <div className="text-sm font-bold text-gray-800">
                      {evt.label || (service ? service.name : "알 수 없는 서비스")}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {evt.event_type}
                    </div>
                  </div>
                </div>
              );
            })}

            {calendarEvents.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">
                  등록된 일정이 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
