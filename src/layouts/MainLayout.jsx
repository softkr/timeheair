import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen, 
  Scissors,
  Settings,
  LogOut
} from 'lucide-react';
import '../index.css';

const SidebarItem = ({ to, icon: Icon, label }) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => 
        `flex items-center gap-3 p-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-indigo-50 text-indigo-600' 
            : 'text-slate-600 hover:bg-slate-50'
        }`
      }
      style={({ isActive }) => ({
        backgroundColor: isActive ? 'var(--primary)' : 'transparent',
        color: isActive ? 'white' : 'var(--text-muted)',
      })}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

const MainLayout = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return '대시보드';
      case '/members': return '회원 관리';
      case '/reservations': return '예약 관리';
      case '/ledger': return '장부 관리';
      case '/staff': return '직원 관리';
      default: return 'Time Hair';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50" style={{ backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="p-6 border-b border-slate-100" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-indigo-600" style={{ color: 'var(--primary)' }}>
            <Scissors size={28} />
            <span className="text-xl font-bold">Time Hair</span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="대시보드" />
          <SidebarItem to="/members" icon={Users} label="회원 관리" />
          <SidebarItem to="/reservations" icon={Calendar} label="예약 관리" />
          <SidebarItem to="/ledger" icon={BookOpen} label="장부 관리" />
          <SidebarItem to="/staff" icon={Users} label="직원 관리" />
        </nav>

        <div className="p-4 border-t border-slate-100" style={{ borderColor: 'var(--border)' }}>
          <button className="flex items-center gap-3 p-3 w-full text-slate-600 hover:bg-slate-50 rounded-lg text-left" style={{ color: 'var(--text-muted)' }}>
            <LogOut size={20} />
            <span className="font-medium">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h1 className="text-xl font-bold text-slate-800" style={{ color: 'var(--text-main)' }}>{getPageTitle()}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold" style={{ backgroundColor: '#e0e7ff', color: 'var(--primary)' }}>
                A
              </div>
              <span className="font-medium text-sm">관리자</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
