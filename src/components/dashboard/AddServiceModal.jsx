import React, { useState, useRef, useMemo, useEffect } from "react";
import { useApp } from "../../AppContext";
import { X, CheckCircle2, Upload, Link, Search } from "lucide-react";

export default function AddServiceModal({ onClose }) {
  const {
    addService,
    catalog,
    subscribedIds,
    subscribeService,
    setSelectedService,
    setView,
  } = useApp();

  // 카탈로그(DB 전체)에서 서비스 이름 → 서비스 객체 매핑
  const catalogMap = useMemo(() => {
    const map = new Map();
    catalog.forEach((s) => {
      if (!map.has(s.name)) {
        map.set(s.name, s);
      }
    });
    return map;
  }, [catalog]);

  const catalogNames = useMemo(() => [...catalogMap.keys()], [catalogMap]);

  const [serviceName, setServiceName] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedCatalogItem = catalogMap.get(serviceName);
  const isInCatalog = !!selectedCatalogItem;
  const isAlreadySubscribed =
    selectedCatalogItem && subscribedIds.includes(selectedCatalogItem.id);
  const hasUrl = serviceUrl.trim().length > 0;
  const hasFile = fileObj !== null;
  const canRegisterNew =
    serviceName.trim().length > 0 && !isInCatalog && (hasUrl || hasFile);

  const handleServiceInput = (value) => {
    setServiceName(value);
    if (value.trim().length > 0) {
      const filtered = catalogNames.filter((name) =>
        name.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (!showSuggestions) return;
    const query = serviceName.trim();
    if (query.length === 0) {
      setSuggestions(catalogNames);
      return;
    }
    const filtered = catalogNames.filter((name) =>
      name.toLowerCase().includes(query.toLowerCase()),
    );
    setSuggestions(filtered);
  }, [catalogNames, serviceName, showSuggestions]);

  const handleSelectService = (name) => {
    setServiceName(name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // 카탈로그에 있는 서비스 → 약관 분석 화면으로 이동 + 내 보관함에 추가
  const handleViewAndSubscribe = () => {
    if (!selectedCatalogItem) return;
    subscribeService(selectedCatalogItem.id);
    setSelectedService(selectedCatalogItem);
    setView("search");
    onClose();
  };

  // 카탈로그에 이미 있고 이미 구독 중 → 약관 분석만 이동
  const handleViewOnly = () => {
    if (!selectedCatalogItem) return;
    setSelectedService(selectedCatalogItem);
    setView("search");
    onClose();
  };

  // 새로운 서비스 등록 (PDF 업로드)
  const handleRegisterNewService = async () => {
    if (!canRegisterNew) return;

    setIsLoading(true);

    try {
      let fileToSend = fileObj;
      if (!fileToSend && hasUrl) {
        const urlContent = `Service: ${serviceName}\nURL: ${serviceUrl}\n`;
        fileToSend = new File([urlContent], "url_placeholder.pdf", {
          type: "application/pdf",
        });
      }

      const response = await addService({
        serviceName,
        file: fileToSend,
        subscribedAt: new Date().toISOString().split("T")[0],
        effectiveDate: effectiveDate || undefined,
      });

      if (response?.id) {
        setSelectedService({
          id: response.id,
          name: response.service_name,
          category: response.domain || "미분류",
          sector: "전체",
          expiry: new Date().toISOString().split("T")[0],
          status: response.status,
        });
        setView("search");
      }
      onClose();
    } catch (error) {
      console.error("❌ API Error:", error);
      alert("서비스 등록에 실패했습니다: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 fade-in px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-[28px] p-8 toss-shadow relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6">
          <X className="w-6 h-6 text-gray-400" />
        </button>
        <h2 className="text-2xl font-bold mb-6">어떤 약관을 확인할까요?</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              서비스 검색
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="예: 넷플릭스, 토스, DB손해보험"
                value={serviceName}
                onFocus={() => {
                  if (!serviceName) {
                    setSuggestions(catalogNames);
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                onChange={(e) => handleServiceInput(e.target.value)}
                className="w-full bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-xl px-4 py-3 transition"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                  {suggestions.map((name) => (
                    <div
                      key={name}
                      onClick={() => handleSelectService(name)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex items-center justify-between"
                    >
                      <span>{name}</span>
                      {subscribedIds.includes(catalogMap.get(name)?.id) && (
                        <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-semibold">
                          구독 중
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 카탈로그에 있는 서비스 → 약관 분석 보기 */}
          {isInCatalog && (
            <div className="fade-in">
              <div className="bg-blue-50 rounded-xl p-4 mb-3 border border-blue-100">
                <p className="text-sm text-blue-700">
                  <strong>{serviceName}</strong>의 약관이 준비되어 있습니다.
                  {isAlreadySubscribed
                    ? " 이미 내 보관함에 추가된 서비스입니다."
                    : " 약관 내용을 확인하고 궁금한 점을 검색해 보세요."}
                </p>
              </div>
              <button
                onClick={
                  isAlreadySubscribed ? handleViewOnly : handleViewAndSubscribe
                }
                className="w-full bg-blue-500 text-white rounded-xl py-3.5 font-bold text-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                {isAlreadySubscribed
                  ? "약관 분석 보기"
                  : "내 보관함에 추가 & 약관 분석 보기"}
              </button>
            </div>
          )}

          {/* 새 서비스 등록 영역 */}
          {!isInCatalog && serviceName.trim().length > 0 && (
            <div className="fade-in space-y-4">
              <div className="text-center text-sm text-gray-400 font-medium">
                목록에 없는 서비스입니다. 직접 등록할 수 있습니다.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  약관 URL 입력
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="https://"
                    value={serviceUrl}
                    onChange={(e) => setServiceUrl(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-blue-500 outline-none rounded-xl pl-10 pr-4 py-3 transition"
                  />
                </div>
              </div>

              <div className="text-center text-sm text-gray-400 font-medium">
                OR
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서면 계약서 업로드
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setFileObj(e.target.files[0]);
                      setUploadedFile(e.target.files[0].name);
                      setServiceUrl("");
                    }
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl py-6 font-medium transition flex flex-col items-center justify-center gap-2 ${
                    uploadedFile
                      ? "border-green-300 bg-green-50 cursor-default"
                      : "border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-blue-400"
                  }`}
                >
                  {uploadedFile ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <span className="text-green-700 truncate max-w-[200px]">
                        업로드 완료: {uploadedFile}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400" />
                      PDF 파일 업로드
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  약관 시행일 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input
                  type="date"
                  name="effective_date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-blue-500 outline-none rounded-xl px-4 py-3 transition"
                />
              </div>

              <button
                onClick={handleRegisterNewService}
                disabled={!canRegisterNew || isLoading}
                className="w-full bg-blue-500 text-white rounded-xl py-3.5 font-bold text-lg mt-2 hover:bg-blue-600 transition disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isLoading ? "분석 중..." : "등록 및 약관 분석 시작"}
              </button>
            </div>
          )}

          {/* 빈 상태 */}
          {!isInCatalog && serviceName.trim().length === 0 && (
            <div className="text-center text-sm text-gray-400 py-4">
              서비스를 검색하거나 새로운 서비스를 등록해 보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
