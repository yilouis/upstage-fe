import React, { useState } from "react";
import { useApp } from "../../AppContext";
import AddServiceModal from "./AddServiceModal";
import { FileText, Plus } from "lucide-react";
import { getServiceLogo } from "../../logos";
import { getDomainLabel } from "../../lib/domainLabels";

export default function DashboardTab() {
  const {
    selectedCategory,
    selectedSector,
    setSelectedSector,
    categories,
    services,
    draggedItem,
    setDraggedItem,
    setView,
    setSelectedService,
  } = useApp();

  const [addModalOpen, setAddModalOpen] = useState(false);

  const currentServices = services.filter(
    (s) =>
      s.category === selectedCategory &&
      (selectedSector === "전체" || s.sector === selectedSector),
  );

  return (
    <>
      <div className="p-8 max-w-5xl mx-auto fade-in">
        <div className="flex justify-between items-end mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {categories.find((c) => c.id === selectedCategory)?.name || "내 서비스"} 보관함
          </h1>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold transition toss-shadow"
          >
            <Plus className="w-5 h-5" /> 서비스 추가
          </button>
        </div>

        {/* Sectors Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {categories
            .find((c) => c.id === selectedCategory)
            ?.sectors.map((sector) => (
              <div
                key={sector}
                onClick={() => setSelectedSector(sector)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  // sector drag-drop은 현재 로컬만 지원
                }}
                className={`px-4 py-2 text-sm rounded-full font-semibold cursor-pointer border transition whitespace-nowrap ${
                  selectedSector === sector
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {sector}
              </div>
            ))}
        </div>

        {/* Service Cards */}
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-6">📋</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              아직 추가한 서비스가 없습니다
            </h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              서비스를 추가하면 약관을 분석하고<br />
              중요한 변경사항을 알려드립니다.
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition toss-shadow"
            >
              <Plus className="w-5 h-5" /> 첫 서비스 추가하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 min-h-[200px]">
            {currentServices.map((s) => {
              const logo = getServiceLogo(s);
              return (
              <div
                key={s.id}
                draggable="true"
                onDragStart={(e) => {
                  setDraggedItem(s);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => setDraggedItem(null)}
                onClick={() => {
                  setSelectedService(s);
                  setView("search");
                }}
                className="bg-white relative p-6 rounded-[24px] toss-card-shadow cursor-pointer hover:-translate-y-1 transition duration-300 border border-gray-100 group"
              >
                <div className="absolute top-4 right-4 text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  {getDomainLabel(s.category)}
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-50 overflow-hidden flex items-center justify-center mb-4 group-hover:bg-blue-50 transition cursor-grab active:cursor-grabbing">
                  {logo ? (
                    <img
                      src={logo}
                      alt={`${s.name} 로고`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {s.name}
                </h3>
                <p className="text-sm text-gray-500">
                  구독일: {s.expiry}
                </p>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {addModalOpen && (
        <AddServiceModal onClose={() => setAddModalOpen(false)} />
      )}
    </>
  );
}
