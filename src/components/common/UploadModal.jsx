import { useState } from "react";

export default function UploadModal({
  open,
  title,
  withServiceName = false,
  onClose,
  onSubmit,
  loading,
}) {
  const [serviceName, setServiceName] = useState("");
  const [subscribedAt, setSubscribedAt] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [file, setFile] = useState(null);

  if (!open) return null;

  const handleSubmit = () => {
    if (withServiceName && !serviceName.trim()) return;
    if (!file) return;
    onSubmit({
      serviceName: serviceName.trim(),
      subscribedAt,
      effectiveDate: effectiveDate || undefined,
      file,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{title}</h3>
        {withServiceName && (
          <input
            name="serviceName"
            id="serviceName"
            placeholder="서비스명"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
          />
        )}
        {withServiceName && (
          <input
            name="subscribedAt"
            id="subscribedAt"
            type="date"
            value={subscribedAt}
            onChange={(e) => setSubscribedAt(e.target.value)}
          />
        )}
        <input
          name="effectiveDate"
          id="effectiveDate"
          type="date"
          placeholder="시행일"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
        />
        <input
          name="termFile"
          id="termFile"
          type="file"
          accept=".pdf,.txt,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>
            취소
          </button>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "처리중..." : "업로드"}
          </button>
        </div>
      </div>
    </div>
  );
}
