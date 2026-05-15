import React, { useState } from "react";
import { useApp } from "../../AppContext";
import AddServiceModal from "./AddServiceModal";
import { FileText, Plus } from "lucide-react";

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
    updateService,
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
            {categories.find((c) => c.id === selectedCategory)?.name} 보관함
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
                  if (draggedItem && sector !== "전체") {
                    updateService(draggedItem.id, { sector });
                  }
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
        <div className="grid grid-cols-3 gap-6 min-h-[200px]">
          {currentServices.map((s) => (
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
                {s.sector}
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition cursor-grab active:cursor-grabbing">
                <FileText className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {s.name}
              </h3>
              <p className="text-sm text-gray-500">
                다음 일정: {s.expiry}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Service Modal */}
      {addModalOpen && (
        <AddServiceModal onClose={() => setAddModalOpen(false)} />
      )}
    </>
  );
}
