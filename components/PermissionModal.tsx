import React from 'react';
import { CrosshairIcon, XIcon, LockClosedIcon } from './icons'; 

interface PermissionModalProps {
    status: PermissionState;
    onClose: () => void;
    onAllow: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ status, onClose, onAllow }) => {
    const isDenied = status === 'denied';

    // Conditional content logic remains the same, but with enhanced typography
    const title = isDenied ? "Location Access Blocked" : "Find Parking Near You?";
    const description = isDenied
        ? "To use this feature, ParkPulse needs location access. Please enable location permissions for this site in your browser's settings."
        : "To find the best parking spots nearby, allow ParkPulse to access your device's location. We only use it when you ask us to find parking near you.";
    
    // Choose icon based on status for better visual cue
    const IconComponent = isDenied ? LockClosedIcon : CrosshairIcon;
    const iconColor = isDenied ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400';
    const bgColor = isDenied ? 'bg-red-100 dark:bg-red-900/50' : 'bg-blue-100 dark:bg-blue-900/50';

    return (
        // Backdrop with robust a11y attributes
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="permission-modal-title">
            <div 
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm transform scale-100 opacity-100 transition-all border border-gray-100 dark:border-gray-700" 
                onClick={e => e.stopPropagation()}
            >
                {/* Close button in the corner for better UX */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    aria-label="Close modal"
                >
                    <XIcon className="h-5 w-5" />
                </button>

                <div className="p-8 text-center">
                    {/* Icon section with dynamic colors */}
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full ${bgColor} mb-5`}>
                        <IconComponent className={`h-8 w-8 ${iconColor}`} />
                    </div>
                    
                    {/* Title and Description */}
                    <h2 id="permission-modal-title" className="text-2xl font-extrabold text-gray-900 dark:text-white leading-snug">
                        {title}
                    </h2>
                    <p className="mt-3 text-md text-gray-600 dark:text-gray-400 leading-relaxed">
                        {description}
                    </p>
                </div>
                
                {/* Action Buttons Section */}
                <div className="p-6 pt-0 flex flex-col sm:flex-row-reverse gap-3">
                    
                    {/* Primary Action Button (Allow/I Understand) */}
                    <button
                        onClick={isDenied ? onClose : onAllow}
                        className={`w-full sm:w-auto flex-1 font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-[1.01] ${
                            isDenied
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/40' // Use blue for the necessary acknowledgement
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/40' // Use green for permission allowance
                        }`}
                    >
                        {isDenied ? "Got It, I'll Fix It" : "Allow Access"}
                    </button>

                    {/* Secondary Action Button (Maybe Later/Close) */}
                    {!isDenied && (
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto flex-1 font-semibold py-3 px-4 rounded-xl transition-colors bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Maybe Later
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PermissionModal;