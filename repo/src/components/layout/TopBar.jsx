import React, { useState } from "react";
import { useApp } from "../../AppContext";
import { Menu, Bell, User, X } from "lucide-react";

export default function TopBar() {
  const {
    setView,
    sidebarOpen,
    setSidebarOpen,
    notifications,
    deleteNotification,
    services,
    setSelectedService,
    setSelectedVersionIndex,
  } = useApp();

  const [userOpen, setUserOpen] = useState(false);
  const [NotiOpen, setNotiOpen] = useState(false);

  const handleNotiClick = (noti) => {
    const targetService = services.find((s) => s.id === noti.serviceId);
    if (targetService) {
      setSelectedService(targetService);
      setSelectedVersionIndex(noti.versionIndex);
      setView("search");
      setNotiOpen(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 relative z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setView("dashboard")}
        >
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            T
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-800">
            T-T
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 relative">
        <button
          onClick={() => setNotiOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
        >
          <Bell className="w-6 h-6 text-gray-600" />
          {notifications.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => setUserOpen(!userOpen)}
          className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
        >
          <User className="w-5 h-5 text-gray-600" />
        </button>

        {userOpen && (
          <div className="absolute top-12 right-0 w-64 bg-white rounded-2xl toss-shadow p-4 border border-gray-100 fade-in">
            <div className="font-semibold text-lg">김토스</div>
            <div className="text-sm text-gray-500 mb-4">
              toss@yonsei.ac.kr
            </div>
            <div className="border-t border-gray-100 pt-2">
              <button className="w-full text-left text-sm text-red-500 font-medium py-2 hover:bg-red-50 rounded-lg px-2">
                로그아웃
              </button>
            </div>
          </div>
        )}

        {NotiOpen && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 fade-in"
            onClick={() => setNotiOpen(false)}
          >
            <div
              className="bg-white w-full max-w-lg rounded-[24px] overflow-hidden toss-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">약관 변경 알림</h2>
                <div className="flex items-center gap-4">
                  {notifications.length > 0 && (
                    <button
                      onClick={() =>
                        notifications.forEach((n) => deleteNotification(n.id))
                      }
                      className="text-sm text-gray-400 hover:text-red-500 font-medium transition"
                    >
                      전체 삭제
                    </button>
                  )}
                  <button onClick={() => setNotiOpen(false)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    새로운 알림이 없습니다.
                  </div>
                ) : (
                  notifications.map((noti) => (
                    <div
                      key={noti.id}
                      className="group relative bg-blue-50 hover:bg-blue-100 transition p-4 rounded-2xl cursor-pointer"
                      onClick={() => handleNotiClick(noti)}
                    >
                      <div className="font-bold text-blue-700 mb-1 pr-8">
                        {noti.title}
                      </div>
                      <div className="text-sm text-blue-900 opacity-80">
                        {noti.summary}
                      </div>
                      <div className="text-[10px] text-blue-400 mt-2">
                        {noti.date}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(noti.id);
                        }}
                        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-200 text-blue-400 font-bold transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
