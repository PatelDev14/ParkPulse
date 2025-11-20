import React, { useEffect, useState, useMemo } from 'react';
import { XIcon, CheckCircleIcon, XCircleIcon, InfoIcon } from './icons'; // Assuming these icons are available

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info'; // Added 'info' type
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(false);

    // --- Configuration based on type ---
    const config = useMemo(() => {
        switch (type) {
            case 'success':
                return {
                    Icon: CheckCircleIcon,
                    bgColor: 'bg-green-500',
                    ringColor: 'ring-green-700',
                    textColor: 'text-white',
                    iconBg: 'bg-green-600',
                    liveRegion: 'assertive', // For critical changes
                };
            case 'error':
                return {
                    Icon: XCircleIcon,
                    bgColor: 'bg-red-500',
                    ringColor: 'ring-red-700',
                    textColor: 'text-white',
                    iconBg: 'bg-red-600',
                    liveRegion: 'assertive', // For critical changes
                };
            case 'info':
            default:
                return {
                    Icon: InfoIcon,
                    bgColor: 'bg-blue-500',
                    ringColor: 'ring-blue-700',
                    textColor: 'text-white',
                    iconBg: 'bg-blue-600',
                    liveRegion: 'polite', // For non-critical changes
                };
        }
    }, [type]);

    useEffect(() => {
        // Animate in
        setVisible(true);

        const timer = setTimeout(() => {
            handleClose();
        }, 4000); // Increased time slightly for better readability

        return () => clearTimeout(timer);
    }, [message, type]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300); // Adjusted to match animation duration
    }
    
    // Deconstruct config for cleaner JSX
    const { Icon, bgColor, ringColor, textColor, iconBg, liveRegion } = config;

    return (
        <div
            className={`fixed bottom-5 right-5 z-50 flex items-center max-w-sm w-full p-2 pr-4 rounded-xl shadow-2xl ${textColor} ${bgColor} ring-2 ring-opacity-50 ${ringColor} 
                transition-all duration-300 transform 
                ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
            role="status" // Default role for status messages
            aria-live={liveRegion} // Crucial for screen reader announcements
        >
             {/* Icon Area */}
            <div className={`flex-shrink-0 p-3 rounded-full mr-3 ${iconBg}`}>
                <Icon className="w-5 h-5 text-white" aria-hidden="true" />
            </div>

            {/* Message Area */}
            <p className="flex-grow font-medium text-sm leading-snug">
                {message}
            </p>

            {/* Close Button */}
            <button 
                onClick={handleClose} 
                className={`flex-shrink-0 p-1 ml-3 rounded-full text-white/80 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white`}
            >
                <XIcon className="w-4 h-4" />
                <span className="sr-only">Close notification</span>
            </button>
        </div>
    );
};

export default Toast;