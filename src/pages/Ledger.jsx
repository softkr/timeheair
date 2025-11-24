import React from 'react';
import { Download, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const Ledger = () => {
  const dailySales = [
    { day: '1', amount: 450000 },
    { day: '2', amount: 520000 },
    { day: '3', amount: 380000 },
    { day: '4', amount: 600000 },
    { day: '5', amount: 850000 },
    { day: '6', amount: 920000 },
    { day: '7', amount: 300000 },
  ];

  const maxSale = Math.max(...dailySales.map(d => d.amount));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">2023년 11월 매출 현황</h2>
        <div className="flex gap-2">
          <button className="btn btn-outline gap-2">
            <Filter size={18} />
            <span>필터</span>
          </button>
          <button className="btn btn-outline gap-2">
            <Download size={18} />
            <span>엑셀 다운로드</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-muted">이번 달 총 매출</p>
            <h3 className="text-2xl font-bold">₩12,450,000</h3>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-muted">순이익</p>
            <h3 className="text-2xl font-bold">₩8,200,000</h3>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-100 text-red-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm text-muted">총 지출</p>
            <h3 className="text-2xl font-bold">₩4,250,000</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card lg:col-span-2 p-6">
          <h3 className="text-lg font-bold mb-6">주간 매출 추이</h3>
          <div className="h-64 flex items-end justify-between gap-4">
            {dailySales.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-indigo-500 rounded-t-lg transition-all duration-500 hover:bg-indigo-600 relative"
                  style={{ height: `${(data.amount / maxSale) * 100}%`, backgroundColor: 'var(--primary)' }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₩{data.amount.toLocaleString()}
                  </div>
                </div>
                <span className="text-sm text-muted">{data.day}일</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">최근 거래 내역</h3>
          <div className="flex flex-col gap-4">
            {[
              { title: '김민수 - 커트', type: 'income', amount: 25000, time: '10:30' },
              { title: '염색약 발주', type: 'expense', amount: 150000, time: '09:15' },
              { title: '이영희 - 염색', type: 'income', amount: 120000, time: '어제' },
              { title: '수도세 납부', type: 'expense', amount: 45000, time: '어제' },
              { title: '박지성 - 펌', type: 'income', amount: 80000, time: '어제' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.type === 'income' ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'
                  }`} style={{
                    backgroundColor: item.type === 'income' ? '#e0e7ff' : '#fee2e2',
                    color: item.type === 'income' ? 'var(--primary)' : 'var(--error)'
                  }}>
                    {item.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted">{item.time}</p>
                  </div>
                </div>
                <span className={`font-bold ${item.type === 'income' ? 'text-indigo-600' : 'text-red-600'}`} style={{
                  color: item.type === 'income' ? 'var(--primary)' : 'var(--error)'
                }}>
                  {item.type === 'income' ? '+' : '-'}₩{item.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ledger;
