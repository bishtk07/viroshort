import React, { useState } from 'react';

export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-white border border-gray-200"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Navigation Sidebar */}
      <div className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              Viroshort
            </h1>
            <p className="text-sm text-gray-600 mt-1">Create amazing videos</p>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1">
            <ul className="space-y-2">
              <NavItem href="/" icon="🏠" label="Home" />
              <NavItem href="/guides" icon="📚" label="Guides" />
              <NavItem href="/billing" icon="💳" label="Billing" />
            </ul>
          </nav>

          {/* Account Section */}
          <div className="border-t border-gray-200 pt-4">
            <a href="/profile" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  👤
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">User Profile</p>
                  <p className="text-xs text-gray-600">Manage settings</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  isActive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, isActive }) => (
  <li>
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </a>
  </li>
); 