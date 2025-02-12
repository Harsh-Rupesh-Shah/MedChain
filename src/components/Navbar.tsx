import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Activity, Stethoscope, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleMySpace = () => {
    if (user?.role === 'doctor') {
      navigate('/doctor/dashboard');
    } else if (user?.role === 'patient') {
      navigate('/patient/dashboard');
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-indigo-500" />
            <span className="text-xl font-bold text-slate-800">MedChain</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/about" className="nav-link">About Us</Link>
            <Link to="/symptoms" className="nav-link flex items-center">
              <Stethoscope className="h-4 w-4 mr-1" />
              Symptoms Check
            </Link>
            <Link to="/shop" className="nav-link">Shop</Link>
            <Link to="/contact" className="nav-link">Contact Us</Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleMySpace}
                  className="flex items-center space-x-2 nav-link"
                >
                  <User className="h-4 w-4" />
                  <span>My Space</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-red-500 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">Get Started</Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6 text-slate-700" /> : <Menu className="h-6 w-6 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 space-y-4">
          <Link to="/" className="block nav-link" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/about" className="block nav-link" onClick={() => setIsOpen(false)}>About Us</Link>
          <Link to="/symptoms" className="block nav-link flex items-center" onClick={() => setIsOpen(false)}>
            <Stethoscope className="h-4 w-4 mr-1" />
            Symptoms Check
          </Link>
          <Link to="/shop" className="block nav-link" onClick={() => setIsOpen(false)}>Shop</Link>
          <Link to="/contact" className="block nav-link" onClick={() => setIsOpen(false)}>Contact Us</Link>
          
          {user ? (
            <>
              <button
                onClick={() => {
                  handleMySpace();
                  setIsOpen(false);
                }}
                className="block w-full text-left nav-link"
              >
                <User className="h-4 w-4 inline mr-2" />
                My Space
              </button>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="block w-full text-left text-red-500 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 inline mr-2" />
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary block text-center" onClick={() => setIsOpen(false)}>
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;