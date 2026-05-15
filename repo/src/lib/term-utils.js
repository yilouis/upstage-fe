export function getVersionList(termDetail) {
  if (!termDetail?.versions) return [];
  return [...termDetail.versions].sort((a, b) => b.version - a.version);
}

export function findPlainTextFromSelection(clauses, selectedText) {
  if (!selectedText?.trim()) return null;
  const normalized = selectedText.trim();
  const matched = clauses.find((clause) =>
    clause.original_text?.includes(normalized),
  );
  if (!matched) return null;
  return matched.plain_text || null;
}

export function clauseMatchesSnippet(clause, snippet) {
  if (!snippet) return false;
  const source = `${clause.title || ""}\n${clause.original_text || ""}`;
  return source.includes(snippet);
}
