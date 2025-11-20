import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { CarIcon, ChatIcon, ProfileIcon, MenuIcon, XIcon, UserCircleIcon, LogOutIcon } from './icons'; // Assuming LogOutIcon and UserCircleIcon are available, or using existing ones.
import { User, View } from '../types';

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
    user: User;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, user }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Updated Nav Item Classes for modern pill-style navigation
    const navItemClasses = "flex items-center space-x-2 px-4 py-2.5 rounded-full transition-all duration-300 text-sm font-bold tracking-wide";
    const activeClasses = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30";
    const inactiveClasses = "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700";
    
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMenuOpen]);

    const handleNavClick = (view: View) => {
        setView(view);
        setIsMenuOpen(false);
    }
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsMenuOpen(false);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <>
            <header className="bg-white dark:bg-gray-900 shadow-xl sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800/80 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
                <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                    {/* Logo: Enhanced visual identity */}
                    <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => handleNavClick('chat')}>
                        <CarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 transform rotate-3" />
                        <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">
                            Park<span className="text-indigo-600 dark:text-indigo-400">Pulse</span>
                        </h1>
                    </div>
                    
                    {/* Desktop Navigation: Modern Pill Layout */}
                    <div className="hidden md:flex flex-grow justify-center">
                         <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-inner-custom">
                            <button
                                onClick={() => handleNavClick('chat')}
                                className={`${navItemClasses} ${currentView === 'chat' ? activeClasses : inactiveClasses}`}
                                aria-current={currentView === 'chat'}
                            >
                                <ChatIcon className="w-5 h-5" />
                                <span>AI Assistant</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('profile')}
                                className={`${navItemClasses} ${currentView === 'profile' ? activeClasses : inactiveClasses}`}
                                 aria-current={currentView === 'profile'}
                            >
                                <ProfileIcon className="w-5 h-5" />
                                <span>My Dashboard</span>
                            </button>
                        </div>
                    </div>

                    {/* Desktop User Info & Logout */}
                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex items-center space-x-3">
                            {/* Avatar/Profile visual placeholder */}
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-blue-400 dark:border-blue-600">
                                <ProfileIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-md text-gray-900 dark:text-gray-100">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{user.email}</p>
                            </div>
                            <button 
                                onClick={handleLogout} 
                                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg"
                                title="Log Out"
                            >
                                {/* Use a clear LogOut Icon if available, or just text */}
                                <LogOutIcon className="w-5 h-5 hidden xl:inline" />
                                <span className="xl:hidden">Log Out</span>
                            </button>
                        </div>
                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm">
                                <span className="sr-only">Open menu</span>
                                {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </nav>
            </header>
            
            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300" 
                    onClick={() => setIsMenuOpen(false)}
                >
                    {/* Sliding Menu Panel: White background, deep shadow */}
                    <div 
                        className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-gray-800 p-6 z-50 shadow-2xl transition-transform duration-300 transform translate-x-0" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-10 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <h2 className="font-extrabold text-2xl text-indigo-600 dark:text-indigo-400">ParkPulse</h2>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 -mr-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <XIcon className="w-7 h-7" />
                            </button>
                        </div>
                        
                        {/* Mobile Navigation Links */}
                        <div className="flex flex-col space-y-3">
                            <button 
                                onClick={() => handleNavClick('chat')} 
                                className={`${navItemClasses} w-full justify-start text-base ${currentView === 'chat' ? activeClasses : inactiveClasses}`}
                            >
                                <ChatIcon className="w-6 h-6" />
                                <span>AI Assistant</span>
                            </button>
                            <button 
                                onClick={() => handleNavClick('profile')} 
                                className={`${navItemClasses} w-full justify-start text-base ${currentView === 'profile' ? activeClasses : inactiveClasses}`}
                            >
                                <ProfileIcon className="w-6 h-6" />
                                <span>My Dashboard</span>
                            </button>
                            
                            {/* User Info and Logout Section */}
                            <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6 space-y-4">
                                <div className="flex items-center space-x-3 px-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <ProfileIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleLogout} 
                                    className="w-full flex items-center gap-3 text-left font-bold text-red-600 dark:text-red-400 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <LogOutIcon className="w-5 h-5" />
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
