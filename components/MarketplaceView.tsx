import React, { useState } from 'react';
import { Listing, User } from '../types';
import ListingCard from './ListingCard';
import ListingForm from './ListingForm';
import { PlusIcon, CarIcon, HandCoinIcon } from './icons'; // Assuming HandCoinIcon is for marketplace theme

// Update the interface to reflect the full, correct signature of addBooking
interface MarketplaceViewProps {
    listings: Listing[];
    addListing: (listing: Omit<Listing, 'id' | 'ownerId'>) => Promise<void>;
    // FIX 1: Update addBooking to match the required signature from ListingCard
    addBooking: (listing: Listing, startTime: string, endTime: string) => Promise<void>;
    user: User; // We'll use this to determine isLoggedIn status
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ listings, addListing, addBooking, user }) => {
    const [showForm, setShowForm] = useState(false);

    // FIX: Make this function async to align with the 'onSubmit' prop of ListingForm.
    const handleFormSubmit = async (listingData: Omit<Listing, 'id' | 'ownerId'>) => {
        // You might want to show a success message or handle errors here
        await addListing(listingData);
        setShowForm(false);
    };

    // Determine logged-in status based on the 'user' object presence
    const isLoggedIn = !!user;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {/* --- Header Section --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-4 border-b dark:border-gray-700">
                <div className="mb-4 sm:mb-0">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        <HandCoinIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        Driveway Marketplace
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">Rent a private parking spot from a local owner.</p>
                </div>
                
                {/* Toggle Button */}
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`flex items-center space-x-2 font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-[1.02] ${
                        showForm 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/40' 
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/40'
                    }`}
                    aria-expanded={showForm}
                >
                    <PlusIcon className={`w-5 h-5 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
                    <span>{showForm ? 'Close Form' : 'List My Driveway'}</span>
                </button>
            </div>
            {/* --- Form Section --- */}
            {showForm && (
                <div className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <ListingForm onSubmit={handleFormSubmit} />
                </div>
            )}
            
            {/* --- Listings or Empty State --- */}
            {listings.length === 0 && !showForm ? (
                <div className="text-center py-24 px-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
                    <CarIcon className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600" />
                    <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mt-6">No Parking Spots Available Right Now</h2>
                    <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
                        Check back later, or be the first to list yours!
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-6 bg-blue-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-blue-600 transition duration-300"
                    >
                        List My Spot Now
                    </button>
                </div>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {listings.map(listing => (
                        // FIX 2: Pass the correct addBooking function and isLoggedIn status
                        <ListingCard 
                            key={listing.id} 
                            listing={listing} 
                            addBooking={addBooking} 
                            isLoggedIn={isLoggedIn} // Use the calculated isLoggedIn status
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MarketplaceView;