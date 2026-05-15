import { getDomainLabel } from "../../lib/domainLabels";

export default function DashboardView({
  terms,
  loading,
  onOpenSearch,
  onOpenUpload,
}) {
  return (
    <section className="page">
      <div className="page-header">
        <h2>서비스 보관함</h2>
        <button onClick={onOpenUpload}>서비스 추가</button>
      </div>

      {loading ? (
        <div className="empty">불러오는 중...</div>
      ) : terms.length === 0 ? (
        <div className="empty">등록된 서비스가 없습니다.</div>
      ) : (
        <div className="card-grid">
          {terms.map((term) => (
            <button
              key={term.id}
              className="service-card"
              onClick={() => onOpenSearch(term.id)}
            >
              <h3>{term.service_name}</h3>
              <p>도메인: {getDomainLabel(term.domain)}</p>
              <p>상태: {term.status}</p>
              <p>최신 버전: v{term.latest_version}</p>
              <p>가입일: {term.subscribed_at || "-"}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
