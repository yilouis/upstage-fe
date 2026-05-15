export default function TopBar({
  sidebarOpen,
  onToggleSidebar,
  view,
  onChangeView,
  unreadCount,
  apiHealth,
  userId,
  onChangeUserId,
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn"
          onClick={onToggleSidebar}
          aria-label="sidebar"
        >
          {sidebarOpen ? "☰" : "☷"}
        </button>
        <button className="brand" onClick={() => onChangeView("dashboard")}>
          <span className="brand-logo">T</span>
          <span>T-T</span>
        </button>
      </div>

      <div className="topbar-right">
        <div className="status-chip">
          {apiHealth ? "API 연결됨" : "API 점검 필요"}
        </div>
        <button
          className={view === "search" ? "tab active" : "tab"}
          onClick={() => onChangeView("search")}
        >
          서비스 검색
        </button>
        <button
          className={view === "calendar" ? "tab active" : "tab"}
          onClick={() => onChangeView("calendar")}
        >
          캘린더
        </button>
        <div className="notif">알림 {unreadCount}</div>
        <input
          className="user-id-input"
          value={userId}
          onChange={(e) => onChangeUserId(e.target.value)}
          placeholder="user_id(UUID)"
          name="userId"
          id="userId"
        />
      </div>
    </header>
  );
}
