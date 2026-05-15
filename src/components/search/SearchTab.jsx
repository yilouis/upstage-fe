import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../../AppContext";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../lib/api";
import { DEFAULT_USER_ID } from "../../config";
import { getServiceLogo } from "../../logos";

const QUESTION_SUGGESTIONS = [
  "환불 받을 수 있는 조건이 뭐야?",
  "자동 갱신 전에 뭘 확인해야 해?",
  "해지하면 위약금이 있어?",
  "분쟁 가능성이 높은 조항만 요약해줘",
];

export default function SearchTab() {
  const {
    services,
    selectedService,
    setSelectedService,
    selectedVersionIndex,
    setSelectedVersionIndex,
  } = useApp();

  const [termDetails, setTermDetails] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTermLoading, setIsTermLoading] = useState(false);
  const [disputeClauses, setDisputeClauses] = useState([]);
  const [isDisputeLoading, setIsDisputeLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [chatSessionId, setChatSessionId] = useState(null);

  const [selectedText, setSelectedText] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    const fetchTermDetail = async () => {
      if (!selectedService?.id) {
        setTermDetails(null);
        setDisputeClauses([]);
        setIsDisputeLoading(false);
        return;
      }
      setIsTermLoading(true);
      setIsDisputeLoading(true);
      setDisputeClauses([]);
      try {
        const detail = await api.getTerm(selectedService.id);
        setTermDetails(detail);
      } catch (e) {
        console.error("Failed to load term details", e);
        setTermDetails(null);
      } finally {
        setIsTermLoading(false);
      }

      try {
        const disputes = await api.listTermDisputes({
          termId: selectedService.id,
          topK: 20,
        });
        setDisputeClauses(disputes?.clauses || []);
      } catch (e) {
        console.warn("Failed to load dispute analysis", e);
        setDisputeClauses([]);
      } finally {
        setIsDisputeLoading(false);
      }
    };
    
    fetchTermDetail();
    setChatMessages([]);
    setNewMessage("");
    setShowTooltip(false);
    setSelectedVersionIndex(0);
    setChatSessionId(null);
  }, [selectedService?.id, setSelectedVersionIndex]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoading]);

  const getTermsVersions = () => {
    if (!termDetails?.versions) return [];
    return [...termDetails.versions].sort((a, b) => b.version - a.version).map(v => {
      const fullText = v.clauses?.map(c => `${c.title || ""}\n${c.original_text || ""}`).join("\n\n") || "내용이 없습니다.";
      return {
        id: v.id,
        version: v.version,
        date: new Date(v.created_at).toISOString().split('T')[0],
        title: v.is_latest ? "최신 약관" : `버전 ${v.version}`,
        content: fullText,
        clauses: v.clauses || [],
        summary: v.summary,
        diffSummary: v.diff_summary,
      };
    });
  };

  const versions = getTermsVersions();
  const currentTermsVersion = versions[selectedVersionIndex] || null;
  const riskyDisputeClauses = disputeClauses.filter(
    (clause) =>
      clause?.clause_risk_level ||
      clause?.risk_reasoning ||
      clause?.user_action ||
      (clause?.matches && clause.matches.length > 0),
  );

  const getRiskBadgeClass = (riskLevel) => {
    const normalized = (riskLevel || "").toLowerCase();
    if (normalized.includes("high") || normalized.includes("높")) {
      return "bg-red-50 text-red-600 border-red-100";
    }
    if (normalized.includes("medium") || normalized.includes("중")) {
      return "bg-orange-50 text-orange-600 border-orange-100";
    }
    if (normalized.includes("low") || normalized.includes("낮")) {
      return "bg-blue-50 text-blue-600 border-blue-100";
    }
    return "bg-gray-50 text-gray-600 border-gray-100";
  };

  // 로컬 검색: 약관 조항(clauses)에서 관련 내용 찾기
  const localSearch = useCallback((query) => {
    if (!currentTermsVersion?.clauses || currentTermsVersion.clauses.length === 0) {
      return null;
    }

    // 영어 clause_type → 한국어 키워드 매핑
    const typeKeywordMap = {
      'payment': ['결제', '구독료', '요금', '청구', 'payment'],
      'cancellation': ['해지', '취소', '해약', '탈퇴', 'cancel', 'cancellation'],
      'privacy': ['개인정보', '프라이버시', '정보처리', 'privacy'],
      'refund': ['환불', '반환', 'refund'],
      'liability': ['책임', '면책', '배상', 'liability'],
      'termination': ['종료', '만료', '해지', 'termination'],
    };

    const normalizedQuery = query.toLowerCase().replace(/["""]/g, '').trim();
    const clauses = currentTermsVersion.clauses;

    // 쿼리 키워드 확장: 영어→한국어 매핑 적용
    let expandedKeywords = [normalizedQuery];
    for (const [type, keywords] of Object.entries(typeKeywordMap)) {
      if (keywords.some(kw => normalizedQuery.includes(kw)) || normalizedQuery.includes(type)) {
        expandedKeywords = [...expandedKeywords, ...keywords];
      }
    }
    expandedKeywords = [...new Set(expandedKeywords)];
    
    // 1단계: 확장된 키워드로 전체 필드 검색 (title, original_text, plain_text, clause_type)
    const matched = clauses.filter(clause => {
      const searchable = `${clause.clause_type || ''} ${clause.title || ''} ${clause.original_text || ''} ${clause.plain_text || ''}`.toLowerCase();
      return expandedKeywords.some(kw => searchable.includes(kw));
    });

    const formatClause = (clause) => {
      let answer = '';
      if (clause.title) answer += `📌 ${clause.title}\n\n`;
      answer += `📄 원문:\n${clause.original_text || '(원문 없음)'}\n\n`;
      if (clause.plain_text) {
        answer += `💡 쉬운 해석:\n${clause.plain_text}`;
      }
      return answer;
    };

    if (matched.length > 0) {
      return matched.map(formatClause).join('\n\n---\n\n');
    }

    // 2단계: 부분 키워드 매칭 (각 단어를 개별 검색, 1글자도 허용)
    const keywords = normalizedQuery.split(/\s+/).filter(k => k.length >= 1);
    if (keywords.length > 0) {
      const partialMatched = clauses.filter(clause => {
        const searchable = `${clause.clause_type || ''} ${clause.title || ''} ${clause.original_text || ''} ${clause.plain_text || ''}`.toLowerCase();
        return keywords.some(kw => searchable.includes(kw));
      });

      if (partialMatched.length > 0) {
        return partialMatched.slice(0, 3).map(formatClause).join('\n\n---\n\n');
      }
    }

    return null;
  }, [currentTermsVersion]);

  // 드래그 선택 시 해당 텍스트의 plain_text를 직접 찾기
  const findPlainTextForSelection = useCallback((text) => {
    if (!currentTermsVersion?.clauses || !text.trim()) return null;
    
    const normalized = text.trim();
    for (const clause of currentTermsVersion.clauses) {
      if (clause.original_text && clause.original_text.includes(normalized)) {
        return clause.plain_text || null;
      }
    }
    return null;
  }, [currentTermsVersion]);

  const processMessage = async (textToSend) => {
    if (!textToSend.trim() || !selectedService?.id) return;

    const userMsg = { role: "user", content: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 1차: Chat API (세션 기반 답변)
      let answer = null;
      try {
        const chatRes = await api.chat({
          userId: DEFAULT_USER_ID,
          termId: selectedService.id,
          sessionId: chatSessionId,
          message: textToSend,
        });
        if (chatRes?.session_id) {
          setChatSessionId(chatRes.session_id);
        }
        if (chatRes?.answer) {
          answer = chatRes.answer;
        }
      } catch (chatErr) {
        console.warn("Chat API failed, falling back to search:", chatErr.message);
      }

      // 2차: 서버 검색 API 시도
      if (!answer) {
        try {
          const res = await api.searchTerm({
            termId: selectedService.id,
            query: textToSend,
            topK: 3,
          });
          if (res.results && res.results.length > 0) {
            answer = res.results
              .map((chunk, i) => `📄 관련 조항 ${i + 1}:\n${chunk.content}`)
              .join("\n\n---\n\n");
          }
        } catch (serverErr) {
          console.warn(
            "Server search failed, falling back to local search:",
            serverErr.message,
          );
        }
      }

      // 3차: 서버 실패 시 로컬 검색 fallback
      if (!answer) {
        answer = localSearch(textToSend);
      }

      if (!answer) {
        answer = "해당 약관에서 관련된 내용을 찾을 수 없습니다. 다른 키워드로 검색해 보세요.";
      }

      setChatMessages((prev) => [...prev, { role: "ai", content: answer }]);
    } catch (e) {
      console.error(e);
      setChatMessages((prev) => [...prev, { role: "ai", content: "검색 중 오류가 발생했습니다. 다시 시도해 주세요." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    processMessage(newMessage);
    setNewMessage("");
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText(text);
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setShowTooltip(true);
    } else {
      setShowTooltip(false);
    }
  };

  const handleTranslateClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 먼저 로컬에서 plain_text를 직접 찾기
    const plainText = findPlainTextForSelection(selectedText);
    if (plainText) {
      const userMsg = { role: "user", content: `"${selectedText}" 이 부분이 무슨 뜻이야?` };
      const aiMsg = { role: "ai", content: `💡 쉬운 해석:\n${plainText}` };
      setChatMessages(prev => [...prev, userMsg, aiMsg]);
    } else {
      // plain_text가 없으면 일반 검색으로 fallback
      const question = `"${selectedText}"에 대한 내용 찾아줘`;
      processMessage(question);
    }

    setShowTooltip(false);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="flex h-full min-h-0 gap-4 fade-in p-6 -mt-4 relative overflow-hidden">
      {showTooltip && (
        <div
          className="fixed z-[100] bg-gray-900 text-white px-3 py-2 rounded-xl text-sm shadow-xl flex items-center gap-1.5 cursor-pointer hover:bg-gray-800 transition-colors transform -translate-x-1/2 -translate-y-full"
          style={{ top: tooltipPos.y, left: tooltipPos.x }}
          onMouseDown={handleTranslateClick}
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="font-semibold tracking-wide">쉬운 해석</span>
          <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className="w-56 shrink-0 space-y-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-4 toss-card-shadow border border-gray-100">
          <div className="text-xs font-bold text-gray-400 mb-3 ml-1">
            📋 등록된 서비스
          </div>
          <ul className="space-y-1">
            {services.map((service) => {
              const logo = getServiceLogo(service);
              return (
              <li
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                }}
                className={`px-3 py-2 rounded-xl cursor-pointer text-sm transition flex items-center gap-2 ${
                  selectedService?.id === service.id
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    className="w-5 h-5 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-md bg-gray-100 shrink-0" />
                )}
                <span className="truncate">{service.name}</span>
              </li>
              );
            })}
            {services.length === 0 && (
              <li className="text-sm text-gray-400 px-2">등록된 서비스가 없습니다.</li>
            )}
          </ul>
        </div>

        {selectedService && !isTermLoading && versions.length > 0 && (
          <div className="bg-white rounded-2xl p-4 toss-card-shadow border border-gray-100">
            <div className="text-xs font-bold text-gray-400 mb-3 ml-1">
              📅 약관 버전 ({versions.length})
            </div>
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {versions.map((version, index) => (
                <li
                  key={version.id || index}
                  onClick={() => setSelectedVersionIndex(index)}
                  className={`px-3 py-2 rounded-xl cursor-pointer text-sm transition ${
                    selectedVersionIndex === index
                      ? "bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-xs text-gray-500">{version.date}</div>
                  <div className="font-medium">{version.title}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main + Right Layout */}
      <div className="flex-1 min-w-0 flex gap-4 overflow-hidden">
        {/* Main Content */}
        {selectedService ? (
          isTermLoading ? (
             <div className="flex-1 min-w-0 bg-white rounded-[32px] border border-gray-100 toss-shadow flex items-center justify-center">
              <p className="text-gray-400 animate-pulse">약관을 불러오는 중입니다...</p>
            </div>
          ) : currentTermsVersion ? (
            <div className="flex-1 min-w-0 bg-white rounded-[32px] border border-gray-100 toss-shadow flex flex-col overflow-hidden">
              <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-blue-50 to-white">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedService.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {currentTermsVersion.title} • {currentTermsVersion.date}
                </p>
                {currentTermsVersion.summary && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-yellow-700 mb-1">📋 약관 요약</p>
                    <p className="text-sm text-yellow-800">{currentTermsVersion.summary}</p>
                  </div>
                )}
                {currentTermsVersion.diffSummary && (
                  <div className="mt-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-orange-700 mb-1">🔄 이전 버전 대비 변경사항</p>
                    <p className="text-sm text-orange-800">{currentTermsVersion.diffSummary}</p>
                  </div>
                )}
              </div>
              <div
                className="flex-1 overflow-y-auto p-8 relative"
                onMouseUp={handleMouseUp}
              >
                {/* 조항별 렌더링 */}
                {currentTermsVersion.clauses.length > 0 ? (
                  <div className="space-y-6">
                    {currentTermsVersion.clauses.map((clause, idx) => (
                      <div key={clause.id || idx} className="group">
                        {clause.title && (
                          <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md font-semibold">
                              {clause.clause_type}
                            </span>
                            {clause.title}
                          </h3>
                        )}
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap selection:bg-blue-200 pl-2 border-l-2 border-gray-200 group-hover:border-blue-400 transition">
                          {clause.original_text}
                        </div>
                        {clause.plain_text && (
                          <div className="mt-2 bg-gray-50 rounded-xl p-3 text-sm text-gray-600 border border-gray-100">
                            <span className="text-xs font-bold text-gray-400 block mb-1">💡 쉬운 해석</span>
                            {clause.plain_text}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap selection:bg-blue-200">
                    {currentTermsVersion.content}
                  </div>
                )}

                <div className="mt-10 border-t border-gray-100 pt-8">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs font-bold text-red-500 mb-1">
                        분쟁 가능성 분석
                      </p>
                      <h3 className="text-xl font-bold text-gray-900">
                        분쟁이 발생할 확률이 높은 조항
                      </h3>
                    </div>
                    {isDisputeLoading && (
                      <span className="text-xs text-gray-400 animate-pulse">
                        분석 중...
                      </span>
                    )}
                  </div>

                  {!isDisputeLoading && riskyDisputeClauses.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-500">
                      현재 표시할 분쟁 위험 조항이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {riskyDisputeClauses.map((clause) => (
                        <article
                          key={clause.clause_id}
                          className="bg-white border border-gray-200 rounded-2xl p-5"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900">
                                {clause.clause_title || "제목 없는 조항"}
                              </h4>
                              {clause.clause_pain_point_id && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {clause.clause_pain_point_id}
                                </p>
                              )}
                            </div>
                            {clause.clause_risk_level && (
                              <span
                                className={`shrink-0 text-xs font-bold border rounded-full px-2.5 py-1 ${getRiskBadgeClass(
                                  clause.clause_risk_level,
                                )}`}
                              >
                                {clause.clause_risk_level}
                              </span>
                            )}
                          </div>

                          {clause.risk_reasoning && (
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {clause.risk_reasoning}
                            </p>
                          )}
                          {clause.user_action && (
                            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                              <span className="font-bold block mb-1">
                                권장 확인 사항
                              </span>
                              {clause.user_action}
                            </div>
                          )}

                          {clause.matches?.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-xs font-bold text-gray-400">
                                유사 분쟁 사례
                              </p>
                              {clause.matches.map((match) => (
                                <div
                                  key={match.case_id}
                                  className="rounded-xl bg-gray-50 border border-gray-100 p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                      {match.title}
                                    </p>
                                    <span className="text-[11px] text-gray-400 shrink-0">
                                      {(match.score * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                    {match.summary}
                                  </p>
                                  {match.outcome && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      결과: {match.outcome}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0 bg-white rounded-[32px] border border-gray-100 toss-shadow flex items-center justify-center">
              <p className="text-gray-400">약관 내용이 없습니다.</p>
            </div>
          )
        ) : (
          <div className="flex-1 min-w-0 bg-white rounded-[32px] border border-gray-100 toss-shadow flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl mb-4">📄</p>
              <p className="text-gray-500 text-lg font-medium">서비스를 선택해주세요</p>
              <p className="text-gray-400 text-sm mt-1">왼쪽 목록에서 약관을 확인할 서비스를 선택하세요</p>
            </div>
          </div>
        )}

        {/* Right Chat Sidebar */}
        <div className="w-80 shrink-0 bg-white rounded-[32px] border border-gray-100 toss-shadow flex flex-col overflow-hidden">
          <div className="border-b border-gray-100 p-4 bg-gray-50 shrink-0">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
              💬 약관 검색
            </h3>
            {selectedService && (
              <div className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md truncate">
                Context: {selectedService.name} ({currentTermsVersion?.title || "선택된 버전 없음"})
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && !isLoading ? (
              <div className="text-center text-gray-400 py-10">
                <p className="text-3xl mb-3">🔍</p>
                <p className="text-sm">
                  약관 내용을 <strong>드래그</strong>하면
                  <br />
                  쉬운 해석을 볼 수 있어요.
                  <br />
                  <br />
                  또는 궁금한 점을
                  <br />
                  직접 검색해 보세요.
                </p>
              </div>
            ) : (
              <>
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] min-w-0 px-4 py-3 text-sm leading-relaxed break-words ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white rounded-2xl rounded-br-none shadow-sm"
                          : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none border border-gray-200 whitespace-pre-wrap"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div className="font-bold text-[10px] text-gray-400 mb-1">
                          AI 답변
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-4 bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none border border-gray-200">
                      <div className="flex gap-1.5">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          <div className="border-t border-gray-100 p-4 bg-white shrink-0">
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setShowSuggestions((v) => !v)}
                className="w-full flex items-center justify-between mb-2 group"
                aria-expanded={showSuggestions}
                aria-label={showSuggestions ? "추천 질문 접기" : "추천 질문 펼치기"}
              >
                <p className="text-[11px] font-bold text-gray-400 group-hover:text-gray-600 transition">
                  이런 질문을 할 수 있어요
                </p>
                {showSuggestions ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
                )}
              </button>
              {showSuggestions && (
                <div className="grid grid-cols-2 gap-2">
                  {QUESTION_SUGGESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setNewMessage(question)}
                      disabled={!selectedService || isLoading || isTermLoading}
                      className="min-h-[42px] rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-left text-[11px] leading-snug text-gray-600 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  selectedService && !isTermLoading
                    ? "예: 해지 방법, 환불 규정 ..."
                    : "서비스를 먼저 선택하세요"
                }
                disabled={!selectedService || isLoading || isTermLoading}
                className="flex-1 bg-gray-50 border border-gray-200 focus:border-blue-500 outline-none rounded-xl px-3 py-2.5 text-sm transition disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!selectedService || !newMessage.trim() || isLoading || isTermLoading}
                className="shrink-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-xl transition shadow-sm font-bold text-sm"
              >
                검색
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
