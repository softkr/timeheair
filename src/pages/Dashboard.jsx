import React from 'react';
import { Calendar, TrendingUp, Users, Clock } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="card p-6 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-muted mb-1">{title}</p>
      <h3 className="text-2xl font-bold mb-1">{value}</h3>
      <p className="text-sm text-muted">{subtext}</p>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`} style={{ backgroundColor: `${color}20`, color: color }}>
      <Icon size={24} />
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="오늘의 예약" 
          value="12건" 
          subtext="취소 1건" 
          icon={Calendar} 
          color="#6366f1" 
        />
        <StatCard 
          title="일일 매출" 
          value="₩850,000" 
          subtext="전일 대비 +15%" 
          icon={TrendingUp} 
          color="#10b981" 
        />
        <StatCard 
          title="신규 회원" 
          value="3명" 
          subtext="이번 달 누적 45명" 
          icon={Users} 
          color="#ec4899" 
        />
        <StatCard 
          title="대기 중" 
          value="2명" 
          subtext="현재 매장 대기" 
          icon={Clock} 
          color="#f59e0b" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reservations */}
        <div className="card lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">오늘의 예약 현황</h3>
            <button className="text-sm text-indigo-600 font-medium hover:underline" style={{ color: 'var(--primary)' }}>전체 보기</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100" style={{ borderColor: 'var(--border)' }}>
                  <th className="p-3 text-sm font-medium text-muted">시간</th>
                  <th className="p-3 text-sm font-medium text-muted">고객명</th>
                  <th className="p-3 text-sm font-medium text-muted">시술 내용</th>
                  <th className="p-3 text-sm font-medium text-muted">담당 디자이너</th>
                  <th className="p-3 text-sm font-medium text-muted">상태</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { time: '10:00', name: '김민수', type: '커트 + 다운펌', designer: '수진 실장', status: '완료' },
                  { time: '11:30', name: '이영희', type: '전체 염색', designer: '민호 디자이너', status: '시술중' },
                  { time: '13:00', name: '박지성', type: '커트', designer: '수진 실장', status: '예약' },
                  { time: '14:30', name: '최유리', type: '셋팅펌', designer: '제니 원장', status: '예약' },
                  { time: '16:00', name: '정우성', type: '두피 케어', designer: '민호 디자이너', status: '예약' },
                ].map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-3 font-medium">{item.time}</td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3 text-muted">{item.type}</td>
                    <td className="p-3 text-muted">{item.designer}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === '완료' ? 'bg-green-100 text-green-700' :
                        item.status === '시술중' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`} style={{
                        backgroundColor: item.status === '완료' ? '#d1fae5' : item.status === '시술중' ? '#dbeafe' : '#f1f5f9',
                        color: item.status === '완료' ? '#047857' : item.status === '시술중' ? '#1d4ed8' : '#334155'
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications / Quick Actions */}
        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-4">빠른 실행</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors" style={{ borderColor: 'var(--border)' }}>
                <Calendar size={20} className="text-indigo-600" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-medium">예약 등록</span>
              </button>
              <button className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors" style={{ borderColor: 'var(--border)' }}>
                <Users size={20} className="text-pink-600" style={{ color: 'var(--secondary)' }} />
                <span className="text-sm font-medium">회원 등록</span>
              </button>
              <button className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors" style={{ borderColor: 'var(--border)' }}>
                <TrendingUp size={20} className="text-emerald-600" style={{ color: 'var(--success)' }} />
                <span className="text-sm font-medium">매출 입력</span>
              </button>
              <button className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors" style={{ borderColor: 'var(--border)' }}>
                <Clock size={20} className="text-amber-600" style={{ color: 'var(--warning)' }} />
                <span className="text-sm font-medium">일정 관리</span>
              </button>
            </div>
          </div>

          <div className="card p-6 flex-1">
            <h3 className="text-lg font-bold mb-4">알림 센터</h3>
            <div className="flex flex-col gap-4">
              {[
                { text: '내일 예약이 3건 있습니다.', time: '10분 전', type: 'info' },
                { text: '김철수님 생일 쿠폰 발송 필요', time: '1시간 전', type: 'warning' },
                { text: '염색약 재고가 부족합니다.', time: '3시간 전', type: 'error' },
              ].map((noti, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                    noti.type === 'error' ? 'bg-red-500' : 
                    noti.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} style={{ 
                    backgroundColor: noti.type === 'error' ? 'var(--error)' : noti.type === 'warning' ? 'var(--warning)' : 'var(--primary)' 
                  }} />
                  <div>
                    <p className="text-sm font-medium">{noti.text}</p>
                    <p className="text-xs text-muted">{noti.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
