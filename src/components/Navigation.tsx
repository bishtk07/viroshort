import React, { useState } from 'react';

export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  Viroshort
                </h1>
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <NavItem href="/" icon="🏠" label="Home" />
              <NavItem href="/guides" icon="📚" label="Guides" />
              <NavItem href="/billing" icon="💳" label="Billing" />
              
              {/* User Profile */}
              <a href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
                  👤
                </div>
                <span className="text-sm font-medium text-gray-700">Profile</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              <MobileNavItem href="/" icon="🏠" label="Home" />
              <MobileNavItem href="/guides" icon="📚" label="Guides" />
              <MobileNavItem href="/billing" icon="💳" label="Billing" />
              <MobileNavItem href="/profile" icon="👤" label="Profile" />
            </div>
          </div>
        )}
      </nav>
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
  <a
    href={href}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </a>
);

const MobileNavItem: React.FC<NavItemProps> = ({ href, icon, label, isActive }) => (
  <a
    href={href}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="font-medium">{label}</span>
  </a>
); 