import { clauseMatchesSnippet, getVersionList } from "../../lib/term-utils";
import ConversationPanel from "./ConversationPanel";

export default function SearchView({
  terms,
  selectedTermId,
  onSelectTerm,
  termDetail,
  loadingDetail,
  selectedVersionIndex,
  onChangeVersionIndex,
  messages,
  message,
  onChangeMessage,
  onSendMessage,
  onSelectTextTranslate,
  onViewSource,
  highlightedSnippet,
  onOpenUpdateModal,
}) {
  const versions = getVersionList(termDetail);
  const currentVersion = versions[selectedVersionIndex] || null;

  return (
    <section className="search-layout">
      <aside className="search-left">
        <div className="panel">
          <h4>등록된 서비스</h4>
          {terms.map((term) => (
            <button
              key={term.id}
              className={selectedTermId === term.id ? "row active" : "row"}
              onClick={() => onSelectTerm(term.id)}
            >
              {term.service_name}
            </button>
          ))}
        </div>

        {termDetail && (
          <div className="panel">
            <h4>약관 버전</h4>
            {versions.map((version, index) => (
              <button
                key={version.id}
                className={
                  selectedVersionIndex === index ? "row active" : "row"
                }
                onClick={() => onChangeVersionIndex(index)}
              >
                v{version.version} (
                {new Date(version.created_at).toLocaleDateString()})
              </button>
            ))}
          </div>
        )}
      </aside>

      <main className="search-main">
        {!selectedTermId ? (
          <div className="empty">서비스를 선택하세요.</div>
        ) : loadingDetail ? (
          <div className="empty">약관 상세 조회 중...</div>
        ) : !currentVersion ? (
          <div className="empty">약관 버전을 찾을 수 없습니다.</div>
        ) : (
          <>
            <div className="search-main-header">
              <div>
                <h2>{termDetail.service_name}</h2>
                <p>
                  v{currentVersion.version} ·{" "}
                  {new Date(currentVersion.created_at).toLocaleString()}
                </p>
              </div>
              <button onClick={onOpenUpdateModal}>약관 업데이트 업로드</button>
            </div>

            <div className="clause-list">
              {currentVersion.clauses.map((clause) => (
                <article
                  key={clause.id}
                  className={
                    clauseMatchesSnippet(clause, highlightedSnippet)
                      ? "clause highlighted"
                      : "clause"
                  }
                >
                  <h4>{clause.title || clause.clause_type}</h4>
                  <p
                    onMouseUp={(e) => {
                      const text = window.getSelection()?.toString()?.trim();
                      if (text && text.length >= 4) onSelectTextTranslate(text);
                      if (e.currentTarget) e.currentTarget.focus?.();
                    }}
                  >
                    {clause.original_text}
                  </p>
                  {clause.plain_text ? (
                    <small>평문: {clause.plain_text}</small>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      <ConversationPanel
        messages={messages}
        message={message}
        onChangeMessage={onChangeMessage}
        onSend={onSendMessage}
        disabled={!selectedTermId}
        onViewTerm={onViewSource}
      />
    </section>
  );
}
