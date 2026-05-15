import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../AppContext";
import { Sparkles } from "lucide-react";
import { api } from "../../lib/api";

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
  const chatEndRef = useRef(null);

  const [selectedText, setSelectedText] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchTermDetail = async () => {
      if (!selectedService?.id) {
        setTermDetails(null);
        return;
      }
      setIsTermLoading(true);
      try {
        const detail = await api.getTerm(selectedService.id);
        setTermDetails(detail);
      } catch (e) {
        console.error("Failed to load term details", e);
        setTermDetails(null);
      } finally {
        setIsTermLoading(false);
      }
    };
    
    fetchTermDetail();
    setChatMessages([]);
    setNewMessage("");
    setShowTooltip(false);
    setSelectedVersionIndex(0);
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
        date: new Date(v.created_at).toISOString().split('T')[0],
        title: v.is_latest ? "최신 가입 약관" : `버전 ${v.version}`,
        content: fullText,
      };
    });
  };

  const versions = getTermsVersions();
  const currentTermsVersion = versions[selectedVersionIndex] || null;

  const processMessage = async (textToSend) => {
    if (!textToSend.trim() || !selectedService?.id) return;

    const userMsg = { role: "user", content: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.searchTerm({ termId: selectedService.id, query: textToSend, topK: 1 });
      
      let answer = "해당 약관에서 관련된 내용을 찾을 수 없습니다.";
      if (res.results && res.results.length > 0) {
        // API returns chunks. We present the best matched chunk content.
        const chunk = res.results[0];
        answer = `다음 약관 조항과 관련이 있을 수 있습니다:\n\n${chunk.content}`;
      }

      setChatMessages((prev) => [...prev, { role: "ai", content: answer }]);
    } catch (e) {
      console.error(e);
      setChatMessages((prev) => [...prev, { role: "ai", content: "검색 중 오류가 발생했습니다." }]);
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

    const question = `"${selectedText}"에 대한 내용 찾아줘`;
    processMessage(question);

    setShowTooltip(false);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="flex h-full gap-4 fade-in p-6 -mt-4 relative">
      {showTooltip && (
        <div
          className="fixed z-[100] bg-gray-900 text-white px-3 py-2 rounded-xl text-sm shadow-xl flex items-center gap-1.5 cursor-pointer hover:bg-gray-800 transition-colors transform -translate-x-1/2 -translate-y-full"
          style={{ top: tooltipPos.y, left: tooltipPos.x }}
          onMouseDown={handleTranslateClick}
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="font-semibold tracking-wide">약관 검색</span>
          <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className="w-55 shrink-0 space-y-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-4 toss-card-shadow border border-gray-100">
          <div className="text-xs font-bold text-gray-400 mb-3 ml-1">
            📋 등록된 서비스
          </div>
          <ul className="space-y-1">
            {services.map((service) => (
              <li
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                }}
                className={`px-3 py-2 rounded-xl cursor-pointer text-sm transition ${
                  selectedService?.id === service.id
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {service.name}
              </li>
            ))}
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
      <div className="flex-1 flex gap-4">
        {/* Main Content */}
        {selectedService ? (
          isTermLoading ? (
             <div className="flex-1 bg-white rounded-[32px] border border-gray-100 toss-shadow flex items-center justify-center">
              <p className="text-gray-400 animate-pulse">약관을 불러오는 중입니다...</p>
            </div>
          ) : currentTermsVersion ? (
            <div className="flex-1 bg-white rounded-[32px] border border-gray-100 toss-shadow flex flex-col overflow-hidden">
              <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-blue-50 to-white">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedService.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {currentTermsVersion.title} • {currentTermsVersion.date}
                </p>
              </div>
              <div
                className="flex-1 overflow-y-auto p-8 relative"
                onMouseUp={handleMouseUp}
              >
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap selection:bg-blue-200">
                  {currentTermsVersion.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-[32px] border border-gray-100 toss-shadow flex items-center justify-center">
              <p className="text-gray-400">약관 내용이 없습니다.</p>
            </div>
          )
        ) : (
          <div className="flex-1 bg-white rounded-[32px] border border-gray-100 toss-shadow flex items-center justify-center">
            <p className="text-gray-400">서비스를 선택해주세요.</p>
          </div>
        )}

        {/* Right Chat Sidebar */}
        <div className="w-65 bg-white rounded-[32px] border border-gray-100 toss-shadow flex flex-col overflow-hidden">
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

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && !isLoading ? (
              <div className="text-center text-gray-400 py-10">
                <p className="text-sm">
                  약관을 드래그하거나
                  <br />
                  직접 검색어를 입력해 보세요.
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
                      className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white rounded-2xl rounded-br-none shadow-sm"
                          : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none border border-gray-200 whitespace-pre-wrap"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div className="font-bold text-[10px] text-gray-400 mb-1">
                          SEARCH RESULT
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
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  selectedService && !isTermLoading
                    ? "검색어를 입력하세요..."
                    : "서비스를 먼저 선택하세요"
                }
                disabled={!selectedService || isLoading || isTermLoading}
                className="flex-1 bg-gray-50 border border-gray-200 focus:border-blue-500 outline-none rounded-xl px-3 py-2.5 text-sm transition disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!selectedService || !newMessage.trim() || isLoading || isTermLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-xl transition shadow-sm font-bold text-sm"
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
