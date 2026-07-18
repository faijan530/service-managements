import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Menu, X, LogOut, LayoutDashboard, PlusCircle, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav class="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <Link to="/" class="flex items-center space-x-2">
              <div class="bg-brand-600 text-white p-2 rounded-lg">
                <Wrench class="h-5 w-5" />
              </div>
              <span class="font-bold text-xl tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
                JASIQ Labs SRMS
              </span>
            </Link>
          </div>

          <div class="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" class="flex items-center space-x-1 text-slate-600 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium transition">
                  <LayoutDashboard class="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <Link to="/create-request" class="flex items-center space-x-1 text-slate-600 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium transition">
                  <PlusCircle class="h-4 w-4" />
                  <span>New Request</span>
                </Link>

                {user.role === 'ADMIN' && (
                  <Link to="/admin" class="flex items-center space-x-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-md text-sm font-medium transition border border-red-200">
                    <ShieldAlert class="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <div class="h-6 w-px bg-slate-200 mx-2"></div>
                
                <div class="flex items-center space-x-3">
                  <span class="text-sm text-slate-500 font-medium">Hi, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    class="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  >
                    <LogOut class="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" class="text-slate-600 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium transition">
                  Login
                </Link>
                <Link to="/register" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
                  Register
                </Link>
              </>
            )}
          </div>

          <div class="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(false)}
              class="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X class="h-6 w-6" /> : <Menu class="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div class="md:hidden border-t border-slate-200 bg-white px-2 pt-2 pb-3 space-y-1">
          {user ? (
            <>
              <Link to="/dashboard" class="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100">
                Dashboard
              </Link>
              <Link to="/create-request" class="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100">
                New Request
              </Link>
              {user.role === 'ADMIN' && (
                <Link to="/admin" class="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">
                  Admin Panel
                </Link>
              )}
              <div class="border-t border-slate-200 my-2 pt-2 px-3">
                <p class="text-sm font-medium text-slate-500">Logged in as {user.name}</p>
                <button
                  onClick={handleLogout}
                  class="mt-2 w-full flex justify-center items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-base font-medium transition"
                >
                  <LogOut class="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" class="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100">
                Login
              </Link>
              <Link to="/register" class="block px-3 py-2 rounded-md text-base font-medium text-brand-600 hover:bg-slate-100">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
