import { useEffect, useMemo, useState } from "react";
import { DEFAULT_USER_ID, isValidUuid } from "./config";
import { api } from "./lib/api";
import { findPlainTextFromSelection, getVersionList } from "./lib/term-utils";
import TopBar from "./components/layout/TopBar";
import Sidebar from "./components/layout/Sidebar";
import DashboardView from "./components/dashboard/DashboardView";
import SearchView from "./components/search/SearchView";
import CalendarView from "./components/calendar/CalendarView";
import UploadModal from "./components/common/UploadModal";

function createMessage(role, text, extra = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    text,
    ...extra,
  };
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiHealth, setApiHealth] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [terms, setTerms] = useState([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState(null);
  const [termDetail, setTermDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const [chatMessage, setChatMessage] = useState("");
  const [highlightByContext, setHighlightByContext] = useState({});
  const [messagesByContext, setMessagesByContext] = useState({});

  const [uploadOpen, setUploadOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const currentVersions = useMemo(
    () => getVersionList(termDetail),
    [termDetail],
  );
  const currentVersion = currentVersions[selectedVersionIndex] || null;
  const contextKey =
    selectedTermId && currentVersion
      ? `${selectedTermId}:${currentVersion.version}`
      : null;
  const currentMessages = contextKey ? messagesByContext[contextKey] || [] : [];
  const highlightedSnippet = contextKey
    ? highlightByContext[contextKey] || ""
    : "";

  const loadTerms = async () => {
    setLoadingTerms(true);
    setGlobalError("");
    try {
      const response = await api.listTerms();
      setTerms(response.items || []);
      if (!selectedTermId && response.items?.length)
        setSelectedTermId(response.items[0].id);
    } catch (error) {
      setGlobalError(`서비스 목록 조회 실패: ${error.message}`);
    } finally {
      setLoadingTerms(false);
    }
  };

  const loadTermDetail = async (termId) => {
    if (!termId) return;
    setLoadingDetail(true);
    setGlobalError("");
    try {
      const detail = await api.getTerm(termId);
      setTermDetail(detail);
      setSelectedVersionIndex(0);
    } catch (error) {
      setGlobalError(`약관 상세 조회 실패: ${error.message}`);
      setTermDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadNotifications = async () => {
    if (!isValidUuid(userId)) return;
    try {
      const response = await api.getNotifications({ userId });
      setNotifications(response.notifications || []);
      setUnreadCount(response.unread_count || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    api
      .healthCheck()
      .then(() => setApiHealth(true))
      .catch(() => setApiHealth(false));
    loadTerms();
  }, []);

  useEffect(() => {
    if (!selectedTermId) return;
    loadTermDetail(selectedTermId);
  }, [selectedTermId]);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const pushMessages = (key, nextMessages) => {
    setMessagesByContext((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), ...nextMessages],
    }));
  };

  const handleSendMessage = async () => {
    if (
      !chatMessage.trim() ||
      !selectedTermId ||
      !currentVersion ||
      !contextKey
    )
      return;
    const userText = chatMessage.trim();
    setChatMessage("");
    pushMessages(contextKey, [createMessage("user", userText)]);

    const plain = findPlainTextFromSelection(
      currentVersion.clauses,
      userText.replace(/["\[\]]/g, ""),
    );
    if (userText.includes("평문 해석") && plain) {
      pushMessages(contextKey, [createMessage("assistant", plain)]);
      return;
    }

    try {
      const result = await api.searchTerm({
        termId: selectedTermId,
        query: userText,
        topK: 5,
      });
      const sources = result.results || [];
      if (sources.length === 0) {
        pushMessages(contextKey, [
          createMessage("assistant", "관련 근거를 찾지 못했습니다."),
        ]);
        return;
      }
      pushMessages(contextKey, [
        createMessage(
          "assistant",
          `질문에 대한 근거를 ${sources.length}건 찾았습니다.`,
          { sources },
        ),
      ]);
    } catch (error) {
      pushMessages(contextKey, [
        createMessage("assistant", `질문 처리 실패: ${error.message}`),
      ]);
    }
  };

  const handleTranslateFromSelection = (selectedText) => {
    setChatMessage(`[${selectedText}] 평문 해석해줘`);
  };

  const handleViewSource = (snippet) => {
    if (!contextKey) return;
    setHighlightByContext((prev) => ({ ...prev, [contextKey]: snippet }));
  };

  const handleUploadTerm = async ({ serviceName, subscribedAt, file }) => {
    setUploadLoading(true);
    setGlobalError("");
    try {
      await api.uploadTerm({ serviceName, subscribedAt, file });
      setUploadOpen(false);
      await loadTerms();
    } catch (error) {
      setGlobalError(`서비스 등록 실패: ${error.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleUpdateTerm = async ({ file }) => {
    if (!selectedTermId) return;
    setUploadLoading(true);
    setGlobalError("");
    try {
      await api.updateTerm({ termId: selectedTermId, file });
      setUpdateOpen(false);
      await loadTermDetail(selectedTermId);
      await loadTerms();
    } catch (error) {
      setGlobalError(`약관 업데이트 실패: ${error.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="app-root">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        view={view}
        onChangeView={setView}
        unreadCount={unreadCount}
        apiHealth={apiHealth}
        userId={userId}
        onChangeUserId={setUserId}
      />

      <div className="app-body">
        <Sidebar
          open={sidebarOpen}
          view={view}
          onChangeView={setView}
          terms={terms}
          selectedTermId={selectedTermId}
          onSelectTerm={setSelectedTermId}
        />

        <main className="app-main">
          {globalError ? (
            <div className="error-banner">{globalError}</div>
          ) : null}

          {view === "dashboard" && (
            <DashboardView
              terms={terms}
              loading={loadingTerms}
              onOpenSearch={(termId) => {
                setSelectedTermId(termId);
                setView("search");
              }}
              onOpenUpload={() => setUploadOpen(true)}
            />
          )}

          {view === "search" && (
            <SearchView
              terms={terms}
              selectedTermId={selectedTermId}
              onSelectTerm={setSelectedTermId}
              termDetail={termDetail}
              loadingDetail={loadingDetail}
              selectedVersionIndex={selectedVersionIndex}
              onChangeVersionIndex={setSelectedVersionIndex}
              messages={currentMessages}
              message={chatMessage}
              onChangeMessage={setChatMessage}
              onSendMessage={handleSendMessage}
              onSelectTextTranslate={handleTranslateFromSelection}
              onViewSource={handleViewSource}
              highlightedSnippet={highlightedSnippet}
              onOpenUpdateModal={() => setUpdateOpen(true)}
            />
          )}

          {view === "calendar" && (
            <CalendarView userId={userId} canQuery={isValidUuid(userId)} />
          )}
        </main>
      </div>

      <UploadModal
        open={uploadOpen}
        title="서비스/약관 등록"
        withServiceName
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUploadTerm}
        loading={uploadLoading}
      />

      <UploadModal
        open={updateOpen}
        title="약관 버전 업데이트"
        onClose={() => setUpdateOpen(false)}
        onSubmit={handleUpdateTerm}
        loading={uploadLoading}
      />

      {notifications.length > 0 ? (
        <section className="notification-drawer">
          <h4>알림</h4>
          {notifications.slice(0, 5).map((n) => (
            <article key={n.id}>
              <strong>{n.title}</strong>
              <p>{n.diff_summary || "-"}</p>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
