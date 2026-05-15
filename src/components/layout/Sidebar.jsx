import React, { useState } from "react";
import { useApp } from "../../AppContext";
import { Plus, Search, Calendar, X } from "lucide-react";

export default function Sidebar() {
  const {
    view,
    setView,
    selectedCategory,
    setSelectedCategory,
    setSelectedSector,
    categories,
    addCategory,
    removeCategory,
    sidebarOpen,
  } = useApp();

  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory = addCategory(newCategoryName);
      if (newCategory) {
        setSelectedCategory(newCategory.id);
        setSelectedSector("전체");
        setView("dashboard");
      }
      setNewCategoryName("");
      setAddCategoryModalOpen(false);
    }
  };

  return (
    <>
      <aside
        className={`${
          sidebarOpen ? "w-64 px-4 border-r" : "w-0 px-0 border-r-0"
        } bg-white border-gray-100 flex flex-col justify-between py-6 transition-all duration-300 overflow-hidden whitespace-nowrap shrink-0`}
      >
        <div>
          <div className="text-xs font-semibold text-gray-400 mb-4 px-2">
            나의 서비스
          </div>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  setSelectedSector("전체");
                  setView("dashboard");
                }}
                className={`group flex justify-between items-center px-4 py-3 rounded-2xl cursor-pointer transition ${
                  selectedCategory === c.id && view === "dashboard"
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="truncate">{c.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {c.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`"${c.name}" 카테고리를 삭제하시겠어요? (서비스는 유지됩니다)`)) {
                          removeCategory(c.id);
                        }
                      }}
                      aria-label={`${c.name} 카테고리 삭제`}
                      className="opacity-0 group-hover:opacity-100 transition w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                    {c.count}
                  </span>
                </div>
              </li>
            ))}
            <li
              onClick={() => setAddCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl cursor-pointer hover:bg-gray-50 text-gray-500 transition border border-dashed border-gray-200 mt-2"
            >
              <Plus className="w-4 h-4" /> 카테고리 추가
            </li>
          </ul>
        </div>

        <div className="space-y-2 border-t border-gray-100 pt-4 mt-4">
          <div
            onClick={() => setView("search")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition ${
              view === "search"
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <Search className="w-5 h-5" />
            <span>서비스 검색</span>
          </div>
          <div
            onClick={() => setView("calendar")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition ${
              view === "calendar"
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>나의 중요 일정</span>
          </div>
        </div>
      </aside>

      {/* Add Category Modal */}
      {addCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 fade-in">
          <div className="bg-white w-full max-w-md rounded-[24px] p-8 toss-shadow">
            <h2 className="text-2xl font-bold mb-4">새 카테고리 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 구독 서비스, 쇼핑"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-xl px-4 py-3 transition"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory();
                  }}
                />
              </div>
              <button
                onClick={handleAddCategory}
                className="w-full bg-blue-500 text-white rounded-xl py-3 font-bold hover:bg-blue-600 transition"
              >
                카테고리 추가
              </button>
              <button
                onClick={() => {
                  setAddCategoryModalOpen(false);
                  setNewCategoryName("");
                }}
                className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-200 transition"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
