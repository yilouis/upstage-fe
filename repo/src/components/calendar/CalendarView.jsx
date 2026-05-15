import { useEffect, useState } from "react";
import { api } from "../../lib/api";

function currentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function CalendarView({ userId, canQuery }) {
  const [month, setMonth] = useState(currentMonthString());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canQuery) return;
    let alive = true;
    setLoading(true);
    setError("");
    api
      .listCalendarEvents({ userId, month })
      .then((res) => {
        if (!alive) return;
        setEvents(res.events || []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(String(err.message || err));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId, month, canQuery]);

  return (
    <section className="page">
      <div className="page-header">
        <h2>중요 일정 캘린더</h2>
        <input
          id="month"
          name="month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>
      {!canQuery ? (
        <div className="empty">
          유효한 user_id를 입력하면 캘린더를 조회할 수 있습니다.
        </div>
      ) : loading ? (
        <div className="empty">캘린더 조회 중...</div>
      ) : error ? (
        <div className="error-box">{error}</div>
      ) : events.length === 0 ? (
        <div className="empty">해당 월 이벤트가 없습니다.</div>
      ) : (
        <div className="card-grid">
          {events.map((event) => (
            <article className="service-card" key={event.id}>
              <h3>{event.label || event.event_type}</h3>
              <p>일자: {event.event_date}</p>
              <p>유형: {event.event_type}</p>
              <p>알림 상태: {event.is_notified ? "알림됨" : "미알림"}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
