import React, { useState } from 'react';
import { Search, Plus, MoreHorizontal, Phone, Calendar } from 'lucide-react';

const Members = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const members = [
    { id: 1, name: '김민수', phone: '010-1234-5678', lastVisit: '2023-10-20', visits: 12, grade: 'VIP' },
    { id: 2, name: '이영희', phone: '010-9876-5432', lastVisit: '2023-11-05', visits: 5, grade: 'Gold' },
    { id: 3, name: '박지성', phone: '010-5555-4444', lastVisit: '2023-09-15', visits: 3, grade: 'Silver' },
    { id: 4, name: '최유리', phone: '010-1111-2222', lastVisit: '2023-11-20', visits: 8, grade: 'Gold' },
    { id: 5, name: '정우성', phone: '010-3333-7777', lastVisit: '2023-10-01', visits: 20, grade: 'VIP' },
    { id: 6, name: '강동원', phone: '010-4444-8888', lastVisit: '2023-11-10', visits: 1, grade: 'New' },
  ];

  const filteredMembers = members.filter(m => 
    m.name.includes(searchTerm) || m.phone.includes(searchTerm)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="이름 또는 전화번호 검색" 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ borderColor: 'var(--border)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary gap-2">
          <Plus size={20} />
          <span>신규 회원 등록</span>
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50" style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th className="p-4 text-sm font-medium text-muted">회원명</th>
              <th className="p-4 text-sm font-medium text-muted">연락처</th>
              <th className="p-4 text-sm font-medium text-muted">등급</th>
              <th className="p-4 text-sm font-medium text-muted">최근 방문일</th>
              <th className="p-4 text-sm font-medium text-muted">방문 횟수</th>
              <th className="p-4 text-sm font-medium text-muted text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50" style={{ borderColor: 'var(--border)' }}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {member.name[0]}
                    </div>
                    <span className="font-bold">{member.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-muted">
                    <Phone size={16} />
                    <span>{member.phone}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.grade === 'VIP' ? 'bg-purple-100 text-purple-700' :
                    member.grade === 'Gold' ? 'bg-amber-100 text-amber-700' :
                    member.grade === 'Silver' ? 'bg-slate-100 text-slate-700' :
                    'bg-green-100 text-green-700'
                  }`} style={{
                    backgroundColor: member.grade === 'VIP' ? '#f3e8ff' : member.grade === 'Gold' ? '#fef3c7' : member.grade === 'Silver' ? '#f1f5f9' : '#dcfce7',
                    color: member.grade === 'VIP' ? '#7e22ce' : member.grade === 'Gold' ? '#b45309' : member.grade === 'Silver' ? '#334155' : '#15803d'
                  }}>
                    {member.grade}
                  </span>
                </td>
                <td className="p-4 text-muted">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{member.lastVisit}</span>
                  </div>
                </td>
                <td className="p-4 text-muted">{member.visits}회</td>
                <td className="p-4 text-right">
                  <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Members;
