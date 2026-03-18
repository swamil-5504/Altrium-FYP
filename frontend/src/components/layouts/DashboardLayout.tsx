import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  role: string[];
}

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const navItems: NavItem[] = [
    { icon: '📋', label: 'Dashboard', href: `/${user?.role.toLowerCase()}`, role: ['ADMIN', 'STUDENT', 'EMPLOYER'] },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push(
      { icon: '👥', label: 'Users', href: '/admin/users', role: ['ADMIN'] },
      { icon: '📜', label: 'Credentials', href: '/admin/credentials', role: ['ADMIN'] }
    );
  } else if (user?.role === 'STUDENT') {
    navItems.push(
      { icon: '🎓', label: 'My Credentials', href: '/student/credentials', role: ['STUDENT'] }
    );
  } else if (user?.role === 'EMPLOYER') {
    navItems.push(
      { icon: '🔍', label: 'Directory', href: '/employer/directory', role: ['EMPLOYER'] }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Altrium Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-sm text-gray-500">
              {user?.full_name || user?.email} • {user?.role}
            </div>
            <Button variant="ghost" onClick={handleLogout} className="px-3">
              Logout
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarImage src="" alt={user?.full_name || 'User'} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm">
                {user?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-0 z-40 lg:z-auto w-64 bg-white shadow-lg lg:shadow-none border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:w-64`}>
          <div className="p-6">
            <nav className="space-y-2">
              {navItems
                .filter(item => item.role.includes(user?.role || ''))
                .map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="w-full justify-start text-left h-12 hover:bg-blue-50 border-0"
                    onClick={() => {
                      navigate(item.href);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Button>
                ))}
            </nav>
          </div>
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto lg:ml-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
