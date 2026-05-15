export default function ConversationPanel({
  messages,
  message,
  onChangeMessage,
  onSend,
  disabled,
  onViewTerm,
}) {
  return (
    <aside className="conversation-panel">
      <h3>약관 Q&A</h3>
      <div className="conversation-list">
        {messages.length === 0 ? (
          <div className="empty">현재 약관 기준으로 질문해보세요.</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.role === "user" ? "bubble user" : "bubble assistant"
              }
            >
              <p>{msg.text}</p>
              {msg.role === "assistant" && msg.sources?.length > 0 && (
                <div className="sources">
                  {msg.sources.map((source, index) => (
                    <small key={`${msg.id}-${index}`}>
                      근거 {index + 1}. {source.content.slice(0, 90)}
                    </small>
                  ))}
                  <button
                    onClick={() => onViewTerm(msg.sources[0]?.content || "")}
                  >
                    약관 보기
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="chat-input-wrap">
        <input
          id="questionInput"
          name="questionInput"
          value={message}
          onChange={(e) => onChangeMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          disabled={disabled}
          placeholder={
            disabled ? "서비스를 선택하세요" : "현재 약관에 대해 질문하세요"
          }
        />
        <button onClick={onSend} disabled={disabled}>
          전송
        </button>
      </div>
    </aside>
  );
}
