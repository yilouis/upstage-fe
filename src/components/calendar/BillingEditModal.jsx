import React, { useState } from "react";
import { X } from "lucide-react";

export default function BillingEditModal({ service, billing, onSave, onClose }) {
  const [subscribedAt, setSubscribedAt] = useState(billing?.subscribedAt || "");
  const [billingDay, setBillingDay] = useState(billing?.billingDay || 1);

  const handleSave = () => {
    onSave({
      subscribedAt: subscribedAt || undefined,
      billingDay: Number(billingDay) || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-[60] fade-in px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-[28px] p-8 toss-shadow relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6"
          aria-label="닫기"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>
        <h2 className="text-2xl font-bold mb-1">결제 일정 편집</h2>
        <p className="text-sm text-gray-500 mb-6">{service?.name}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              구독 시작일
            </label>
            <input
              type="date"
              value={subscribedAt}
              onChange={(e) => setSubscribedAt(e.target.value)}
              className="w-full bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-xl px-4 py-3 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              매월 정기 결제일
            </label>
            <select
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
              className="w-full bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-xl px-4 py-3 transition"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  매월 {d}일
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-2">
              해당 월에 그 일자가 없으면 말일로 자동 조정됩니다.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-200 transition"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 text-white rounded-xl py-3 font-bold hover:bg-blue-600 transition"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
