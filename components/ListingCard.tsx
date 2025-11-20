import React, { useState } from 'react';
import { Listing } from '../types';
import { LocationIcon, ClockIcon, DollarIcon, CalendarIcon, InfoIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

interface ListingCardProps {
    listing: Listing;
    addBooking: (listing: Listing, startTime: string, endTime: string) => Promise<void>;
    isLoggedIn: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, addBooking, isLoggedIn }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleBookNow = () => {
        if (isLoggedIn) {
            setIsModalOpen(true);
        }
    }

    const handleConfirmBooking = async (startTime: string, endTime: string) => {
        await addBooking(listing, startTime, endTime);
        setIsModalOpen(false); // Close modal after booking process is complete
    };

    const fullLocation = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}`;

    return (
        <>
            {/* Main Card Container: Enhanced shadow, rounded edges, and hover effect */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all duration-500 border border-gray-100 dark:border-gray-700/70 flex flex-col">
                
                {/* Content Section: Flex-grow to push footer down */}
                <div className="p-6 flex-grow">
                    
                    {/* Header: Location & Address */}
                    <div className="flex items-start gap-4 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center shadow-md">
                            <LocationIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white leading-snug">Parking Spot</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{fullLocation}</p>
                        </div>
                    </div>
                    
                    {/* Description (Stylized Blockquote) */}
                    {listing.description && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400 border-l-4 border-blue-500 italic">
                            {listing.description}
                        </div>
                    )}
                    
                    {/* Key Details Section */}
                    <div className="space-y-3 text-gray-700 dark:text-gray-300 mt-5">
                        
                        {/* Rate: Highlighted as primary info */}
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <DollarIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <span className="text-base font-semibold">Hourly Rate</span>
                            </div>
                            <span className="text-xl font-extrabold text-green-700 dark:text-green-400">
                                ${listing.rate.toFixed(2)}
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-1">/ hr</span>
                            </span>
                        </div>
                        
                        {/* Date */}
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                            <span className="font-medium">Date:</span>
                            <span className="font-semibold">{listing.date}</span>
                        </div>
                        
                        {/* Time Window */}
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                            <span className="font-medium">Time Window:</span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">{listing.startTime} - {listing.endTime}</span>
                        </div>
                    </div>
                </div>
                
                {/* Footer/Action Button Area: Distinct background */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
                     <button 
                        onClick={handleBookNow}
                        disabled={!isLoggedIn}
                        // Button: Modern gradient and pronounced shadow
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/40 transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:cursor-not-allowed text-lg"
                        title={isLoggedIn ? "Request to book this spot" : "Please log in to make a booking request"}
                    >
                        {isLoggedIn ? "Request to Book" : "Log In to Book"}
                    </button>
                </div>
            </div>
            
            {/* Confirmation Modal */}
            {isModalOpen && (
                <ConfirmationModal 
                    listing={listing}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmBooking}
                />
            )}
        </>
    );
};

export default ListingCard;