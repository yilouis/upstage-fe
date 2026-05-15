export default function Sidebar({
  open,
  view,
  onChangeView,
  terms,
  selectedTermId,
  onSelectTerm,
}) {
  return (
    <aside className={open ? "sidebar open" : "sidebar"}>
      <h3 className="sidebar-title">등록된 서비스</h3>
      <ul className="service-list">
        {terms.map((term) => (
          <li key={term.id}>
            <button
              className={
                selectedTermId === term.id
                  ? "service-item active"
                  : "service-item"
              }
              onClick={() => {
                onSelectTerm(term.id);
                onChangeView("search");
              }}
            >
              <span>{term.service_name}</span>
              <small>v{term.latest_version}</small>
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <button
          className={view === "dashboard" ? "tab active full" : "tab full"}
          onClick={() => onChangeView("dashboard")}
        >
          메인
        </button>
      </div>
    </aside>
  );
}
