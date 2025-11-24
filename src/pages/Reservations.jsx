import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const Reservations = () => {
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 10); // 10:00 to 20:00
  const designers = ['수진 실장', '민호 디자이너', '제니 원장'];

  const appointments = [
    { id: 1, designer: '수진 실장', time: 10, duration: 2, name: '김민수', type: '커트+다운펌', color: 'bg-indigo-100 border-indigo-200 text-indigo-700' },
    { id: 2, designer: '민호 디자이너', time: 11, duration: 3, name: '이영희', type: '전체 염색', color: 'bg-pink-100 border-pink-200 text-pink-700' },
    { id: 3, designer: '제니 원장', time: 14, duration: 2, name: '최유리', type: '셋팅펌', color: 'bg-emerald-100 border-emerald-200 text-emerald-700' },
    { id: 4, designer: '수진 실장', time: 13, duration: 1, name: '박지성', type: '커트', color: 'bg-amber-100 border-amber-200 text-amber-700' },
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">2023년 11월 24일 (금)</h2>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1" style={{ borderColor: 'var(--border)' }}>
            <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={20} /></button>
            <button className="px-3 py-1 text-sm font-medium hover:bg-slate-100 rounded">오늘</button>
            <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={20} /></button>
          </div>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus size={20} />
          <span>예약 등록</span>
        </button>
      </div>

      <div className="flex-1 card overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex border-b border-slate-200" style={{ borderColor: 'var(--border)' }}>
          <div className="w-20 p-4 border-r border-slate-200 bg-slate-50" style={{ borderColor: 'var(--border)', backgroundColor: '#f8fafc' }}></div>
          {designers.map(d => (
            <div key={d} className="flex-1 p-4 text-center font-bold border-r border-slate-200 last:border-0" style={{ borderColor: 'var(--border)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto relative">
          {timeSlots.map(time => (
            <div key={time} className="flex h-32 border-b border-slate-100" style={{ borderColor: 'var(--border)' }}>
              <div className="w-20 p-2 text-xs text-muted text-right border-r border-slate-200 bg-slate-50" style={{ borderColor: 'var(--border)', backgroundColor: '#f8fafc' }}>
                {time}:00
              </div>
              {designers.map(d => (
                <div key={d} className="flex-1 border-r border-slate-100 last:border-0 relative" style={{ borderColor: 'var(--border)' }}>
                  {/* Grid lines */}
                  <div className="absolute top-1/2 w-full border-t border-slate-50 border-dashed"></div>
                </div>
              ))}
            </div>
          ))}

          {/* Appointments Overlay */}
          {appointments.map(apt => {
            const designerIndex = designers.indexOf(apt.designer);
            if (designerIndex === -1) return null;

            const top = (apt.time - 10) * 128; // 128px is h-32
            const height = apt.duration * 128;
            const left = `calc(5rem + ${designerIndex} * ((100% - 5rem) / ${designers.length}))`;
            const width = `calc((100% - 5rem) / ${designers.length})`;

            return (
              <div 
                key={apt.id}
                className={`absolute p-1 z-10`}
                style={{ top, height, left, width }}
              >
                <div className={`w-full h-full rounded-lg border p-3 shadow-sm ${apt.color} flex flex-col gap-1 overflow-hidden`}>
                  <div className="font-bold text-sm">{apt.name}</div>
                  <div className="text-xs opacity-80">{apt.type}</div>
                  <div className="text-xs opacity-80 mt-auto">{apt.time}:00 - {apt.time + apt.duration}:00</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Reservations;
