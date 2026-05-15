import React, { useState, useRef } from "react";
import { useApp } from "../../AppContext";
import { X, CheckCircle2, Upload } from "lucide-react";

const DUMMY_SUGGESTIONS = [
  "넷플릭스 프리미엄",
  "실비 보험 (DB)",
  "여행자 보험 (메리츠)",
  "스포티파이 프리미엄",
  "카카오 뮤직",
  "한화생명 보험",
  "삼성화재 자동차 보험",
  "토스",
  "카카오뱅크",
  "신한카드",
];

export default function AddServiceModal({ onClose }) {
  const { addService } = useApp();
  
  const [serviceName, setServiceName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleServiceInput = (value) => {
    setServiceName(value);
    if (value.trim().length > 0) {
      const filtered = DUMMY_SUGGESTIONS.filter((service) =>
        service.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectService = (service) => {
    setServiceName(service);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleAddService = async () => {
    if (!serviceName.trim() || !fileObj) {
      alert("서비스 이름과 약관 PDF 파일을 모두 등록해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      await addService({
        serviceName,
        file: fileObj,
        subscribedAt: new Date().toISOString().split('T')[0] // 오늘 날짜 기본값
      });
      onClose();
    } catch (error) {
      console.error("❌ API Error:", error);
      alert("서비스 추가에 실패했습니다: " + error.message);
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
        <h2 className="text-2xl font-bold mb-6">
          어떤 약관을 등록할까요?
        </h2>

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
                onChange={(e) => handleServiceInput(e.target.value)}
                className="w-full bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-xl px-4 py-3 transition"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                  {suggestions.map((service) => (
                    <div
                      key={service}
                      onClick={() => handleSelectService(service)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                    >
                      {service}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-gray-400 font-medium">
            OR
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              약관 URL 입력
            </label>
            <input
              type="text"
              placeholder="https://"
              disabled
              className="w-full bg-gray-100 border border-transparent outline-none rounded-xl px-4 py-3 transition cursor-not-allowed text-gray-400"
              title="현재 URL 기반 수집은 미지원입니다."
            />
          </div>

          <div className="pt-4">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFileObj(e.target.files[0]);
                  setUploadedFile(e.target.files[0].name);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl py-8 font-medium transition flex flex-col items-center justify-center gap-2 ${
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
                  서면 약관 PDF 업로드
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleAddService}
            disabled={isLoading || !fileObj || !serviceName}
            className="w-full bg-blue-500 text-white rounded-xl py-3.5 font-bold text-lg mt-4 hover:bg-blue-600 transition disabled:bg-blue-300"
          >
            {isLoading ? "처리 중..." : "가입 및 분석 시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
