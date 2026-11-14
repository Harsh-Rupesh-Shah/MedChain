import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Activity, Stethoscope, LogOut, User, Shield, Pill, PhoneCall } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMySpace = () => {
    if (user?.role === 'doctor') {
      navigate('/doctor/dashboard');
    } else if (user?.role === 'patient') {
      navigate('/patient/dashboard');
    } else if (user?.role === 'admin') {
      navigate('/admin');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-[#0B192C] text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#0B192C] tracking-tight">MedChain</span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                CLINICAL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-7 text-xs font-semibold">
            <Link
              to="/"
              className={`transition-colors py-1 ${isActive('/') ? 'text-[#0D9488] border-b-2 border-[#0D9488]' : 'text-slate-600 hover:text-[#0B192C]'}`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`transition-colors py-1 ${isActive('/about') ? 'text-[#0D9488] border-b-2 border-[#0D9488]' : 'text-slate-600 hover:text-[#0B192C]'}`}
            >
              Clinical Governance
            </Link>
            <Link
              to="/symptoms"
              className={`transition-colors py-1 flex items-center gap-1.5 ${isActive('/symptoms') ? 'text-[#0D9488] border-b-2 border-[#0D9488]' : 'text-slate-600 hover:text-[#0B192C]'}`}
            >
              <Stethoscope className="h-3.5 w-3.5 text-[#0D9488]" />
              Diagnostic Triage
            </Link>
            <Link
              to="/shop"
              className={`transition-colors py-1 flex items-center gap-1.5 ${isActive('/shop') ? 'text-[#0D9488] border-b-2 border-[#0D9488]' : 'text-slate-600 hover:text-[#0B192C]'}`}
            >
              <Pill className="h-3.5 w-3.5 text-[#0D9488]" />
              Pharmacy
            </Link>
            <Link
              to="/contact"
              className={`transition-colors py-1 ${isActive('/contact') ? 'text-[#0D9488] border-b-2 border-[#0D9488]' : 'text-slate-600 hover:text-[#0B192C]'}`}
            >
              Clinics & Support
            </Link>
          </div>

          {/* Auth Controls */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleMySpace}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-[#0D9488]" />
                  <span>Dashboard ({user.role})</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-slate-700 hover:text-[#0B192C] font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/patient/register"
                  className="px-4 py-2 rounded-lg bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-semibold transition-colors shadow-xs"
                >
                  Patient Portal
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 text-slate-700 hover:text-[#0B192C]"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Navigation"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-5 space-y-3 text-xs font-semibold">
          <Link
            to="/"
            className="block py-2 text-slate-700 hover:text-[#0D9488]"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/about"
            className="block py-2 text-slate-700 hover:text-[#0D9488]"
            onClick={() => setIsOpen(false)}
          >
            Clinical Governance
          </Link>
          <Link
            to="/symptoms"
            className="block py-2 text-slate-700 hover:text-[#0D9488]"
            onClick={() => setIsOpen(false)}
          >
            Diagnostic Triage
          </Link>
          <Link
            to="/shop"
            className="block py-2 text-slate-700 hover:text-[#0D9488]"
            onClick={() => setIsOpen(false)}
          >
            Pharmacy & Medical Supplies
          </Link>
          <Link
            to="/contact"
            className="block py-2 text-slate-700 hover:text-[#0D9488]"
            onClick={() => setIsOpen(false)}
          >
            Clinics & Directory
          </Link>

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleMySpace();
                    setIsOpen(false);
                  }}
                  className="w-full text-left py-2 text-[#0D9488] font-bold"
                >
                  Open Dashboard ({user.role})
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left py-2 text-red-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 rounded-lg border border-slate-200 text-slate-800"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/patient/register"
                  className="w-full text-center py-2.5 rounded-lg bg-[#0B192C] text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Patient Registration
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
