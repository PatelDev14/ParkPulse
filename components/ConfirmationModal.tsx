import React, { useMemo, useState, useEffect } from 'react';
import { Listing, Booking } from '../types';
import { LocationIcon, ClockIcon, DollarIcon, CalendarIcon, XIcon, InfoIcon } from './icons';
//import { getExistingBookingsForListing } from '../services/firestoreService';

interface ConfirmationModalProps {
    listing: Listing;
    onClose: () => void;
    onConfirm: (startTime: string, endTime: string) => Promise<void>;
}

// Helper to convert HH:MM time string to total minutes from midnight for reliable comparison.
const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return NaN;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return NaN;
    }
    return hours * 60 + minutes;
};

// Helper function to correctly calculate duration and total cost using the robust timeToMinutes function
const calculateTotalCost = (rate: number, startTime: string, endTime: string): string => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
        return '0.00';
    }

    const durationMinutes = endMinutes - startMinutes;
    const durationHours = durationMinutes / 60;
    const total = rate * durationHours;

    return total.toFixed(2);
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ listing, onClose, onConfirm }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [existingBookings, setExistingBookings] = useState<Booking[]>([]);

    useEffect(() => {
        // Set initial times when component mounts
        setSelectedStartTime(listing.startTime);
        setSelectedEndTime(listing.endTime);

        // Cannot fetch existing bookings on the client due to security rules.
        // The definitive conflict check happens when the owner approves the request.
        setExistingBookings([]);

    }, [listing]);


    const totalCost = useMemo(() => calculateTotalCost(listing.rate, selectedStartTime, selectedEndTime), [listing.rate, selectedStartTime, selectedEndTime]);

    const handleConfirmClick = async () => {
        setValidationError(null);

        const startMinutes = timeToMinutes(selectedStartTime);
        const endMinutes = timeToMinutes(selectedEndTime);
        const listingStartMinutes = timeToMinutes(listing.startTime);
        const listingEndMinutes = timeToMinutes(listing.endTime);

        if (isNaN(startMinutes) || isNaN(endMinutes)) {
            setValidationError("Please enter a valid start and end time in HH:MM format.");
            return;
        }

        if (startMinutes >= endMinutes) {
            setValidationError("End time must be after start time.");
            return;
        }

        if (startMinutes < listingStartMinutes || endMinutes > listingEndMinutes) {
            setValidationError(`Please select a time within the available window (${listing.startTime} - ${listing.endTime}).`);
            return;
        }
        
        // REMOVED: Pre-emptive client-side conflict check is no longer possible
        // due to security rules. The owner will perform the final check upon approval.

        setIsLoading(true);
        try {
            await onConfirm(selectedStartTime, selectedEndTime);
            onClose(); // Close modal on successful booking request
        } catch (error: any) {
            // The `onConfirm` (requestBooking) function will now show its own generic toast.
            // We can simplify the error handling here.
            setValidationError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    const fullLocation = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}`;
    
    // Updated Input Classes for a modern, sunken look
    const inputClasses = "w-full p-3.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-shadow text-lg font-mono placeholder-gray-500 dark:placeholder-gray-400";

    return (
        // Backdrop: Darker and smoother
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-30 p-4" onClick={onClose} role="dialog" aria-modal="true">
            {/* Modal Container: Higher shadow and rounded corners */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-gray-900/50 w-full max-w-md transform transition-all border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                
                {/* Header: Clean with border */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Request to Book</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <XIcon className="w-7 h-7" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    
                    {/* Listing Details */}
                    <div className="space-y-4 text-gray-700 dark:text-gray-200 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Spot Details</h3>
                        <div className="flex items-start gap-3">
                            <LocationIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white leading-snug">Parking Location</p>
                                <span className="text-sm text-gray-600 dark:text-gray-300">{fullLocation}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CalendarIcon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white leading-snug">Date & Available Window</p>
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {listing.date} ({listing.startTime} - {listing.endTime})
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <DollarIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white leading-snug">Hourly Rate</p>
                                <span className="text-sm text-gray-600 dark:text-gray-300">${listing.rate.toFixed(2)}/hour</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Alert: Enhanced with vibrant colors */}
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-xl border border-yellow-300 dark:border-yellow-700/50">
                        <div className="flex items-start gap-3">
                            <InfoIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                    **Owner Approval Required:** Your request is an offer subject to the owner's final approval and conflict check.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Time Selection Inputs */}
                    <div className="mt-6 space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="start-time" className="block text-sm font-bold mb-2 text-gray-800 dark:text-gray-100">Start Time</label>
                                <input 
                                    type="text" 
                                    id="start-time" 
                                    value={selectedStartTime}
                                    onChange={e => setSelectedStartTime(e.target.value)}
                                    className={inputClasses}
                                    required
                                    placeholder="HH:MM"
                                    pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                                    title="Enter time in 24-hour HH:MM format (e.g., 09:00 or 17:30)"
                                />
                            </div>
                            <div>
                                <label htmlFor="end-time" className="block text-sm font-bold mb-2 text-gray-800 dark:text-gray-100">End Time</label>
                                <input 
                                    type="text"
                                    id="end-time" 
                                    value={selectedEndTime}
                                    onChange={e => setSelectedEndTime(e.target.value)}
                                    className={inputClasses}
                                    required
                                    placeholder="HH:MM"
                                    pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                                    title="Enter time in 24-hour HH:MM format (e.g., 09:00 or 17:30)"
                                />
                            </div>
                        </div>
                        {validationError && (
                            <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-xl text-center text-sm font-medium border border-red-300 dark:border-red-700">
                                {validationError}
                            </div>
                        )}
                    </div>

                    {/* Total Cost: Prominently displayed */}
                     <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-xl font-medium text-gray-800 dark:text-gray-100">Estimated Total Cost:</span>
                        <span className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                            <span className="text-xl font-normal">$</span>{totalCost}
                        </span>
                    </div>
                </div>

                {/* Footer/Action Button: Gradient and raised */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-b-3xl border-t border-gray-200 dark:border-gray-700">
                     <button
                        onClick={handleConfirmClick}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-extrabold py-4 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-xl shadow-green-500/30 transform hover:scale-[1.01] disabled:bg-gray-400 disabled:shadow-none disabled:cursor-wait text-lg"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                 {/* Custom Spinner for better visual appeal */}
                                 <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending Request...
                            </div>
                        ) : 'Send Booking Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;