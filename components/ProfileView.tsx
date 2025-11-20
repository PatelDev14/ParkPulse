import React, { useState, useMemo } from 'react';
import { User, Listing, Booking } from '../types';
import { LocationIcon, ClockIcon, DollarIcon, CalendarIcon, CarIcon, PlusIcon, XIcon, InfoIcon, UserIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from './icons'; // Assuming new icons are available for actions
import ListingForm from './ListingForm';

type ProfileTab = 'bookings' | 'listings';

// Helper function to calculate cost (Kept identical)
const calculateTotalCost = (rate: number, startTime: string, endTime: string): string => {
    try {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        if ([startHours, startMinutes, endHours, endMinutes].some(isNaN)) return 'N/A';
        const startDate = new Date();
        startDate.setHours(startHours, startMinutes, 0, 0);
        const endDate = new Date();
        endDate.setHours(endHours, endMinutes, 0, 0);
        // For robustness, if endDate is before startDate, assume it's the next day.
        if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
        
        const durationMillis = endDate.getTime() - startDate.getTime();
        const durationHours = durationMillis / (1000 * 60 * 60);
        return (rate * durationHours).toFixed(2);
    } catch (e) {
        console.error("Error calculating cost:", e);
        return 'N/A';
    }
}

// Status Badge Component (Enhanced colors)
const StatusBadge: React.FC<{ status: Booking['status'] }> = ({ status }) => {
    const statusInfo = {
        pending: { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300' },
        confirmed: { text: 'Confirmed', color: 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300' },
        denied: { text: 'Denied by Owner', color: 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300' },
        canceled_by_user: { text: 'Canceled by You', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400' },
        canceled_by_owner: { text: 'Canceled by Owner', color: 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300' },
    };
    const { text, color } = statusInfo[status] || statusInfo.canceled_by_user;
    return <div className={`px-3 py-1 text-xs font-bold tracking-wider rounded-full inline-block ${color}`}>{text}</div>;
};

// Booking Card Component (Enhanced structure and buttons)
const BookingCard: React.FC<{ booking: Booking, onCancel: (booking: Booking) => Promise<void>, onDelete: (bookingId: string) => Promise<void> }> = ({ booking, onCancel, onDelete }) => {
    const totalCost = useMemo(() => calculateTotalCost(booking.rate, booking.startTime, booking.endTime), [booking.rate, booking.startTime, booking.endTime]);
    const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCancel = async () => {
        setIsCanceling(true);
        await onCancel(booking);
        setIsCanceling(false);
        setIsConfirmingCancel(false);
    };
    
    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(booking.id);
        setIsDeleting(false);
        setIsConfirmingDelete(false);
    };

    const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
    const canDelete = ['canceled_by_user', 'denied', 'canceled_by_owner'].includes(booking.status);


    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                        <LocationIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-gray-900 dark:text-white leading-tight">{booking.location}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Booking ID: {booking.id.substring(0, 8)}...</p>
                    </div>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4 mt-4 flex-grow">
                 <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-indigo-500" /> Date:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{booking.date}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-purple-500" /> Time:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{booking.startTime} - {booking.endTime}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><DollarIcon className="w-4 h-4 text-green-500" /> Total Cost:</span>
                    <span className="font-extrabold text-green-600 dark:text-green-400">${totalCost}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
                {canCancel && (
                    isConfirmingCancel ? (
                        <div className="space-y-2">
                            <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">Confirm cancellation?</p>
                            <div className="flex gap-2">
                                <button onClick={() => setIsConfirmingCancel(false)} disabled={isCanceling} className="w-full bg-gray-200 dark:bg-gray-700 text-sm font-semibold py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Keep</button>
                                <button onClick={handleCancel} disabled={isCanceling} className="w-full bg-red-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-wait flex items-center justify-center gap-1">
                                    <XCircleIcon className="w-4 h-4" />
                                    {isCanceling ? 'Canceling...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsConfirmingCancel(true)} className="w-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors text-sm flex items-center justify-center gap-1">
                            <XIcon className="w-4 h-4" />
                            Cancel Booking
                        </button>
                    )
                )}

                {canDelete && (
                    isConfirmingDelete ? (
                        <div className="space-y-2">
                            <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">Permanently delete?</p>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setIsConfirmingDelete(false)} disabled={isDeleting} className="w-full bg-gray-200 dark:bg-gray-700 text-sm font-semibold py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Keep</button>
                                <button onClick={handleDelete} disabled={isDeleting} className="w-full bg-red-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-wait flex items-center justify-center gap-1">
                                    <TrashIcon className="w-4 h-4" />
                                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsConfirmingDelete(true)} className="w-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-semibold py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm mt-3 flex items-center justify-center gap-1">
                             <TrashIcon className="w-4 h-4" />
                            Delete Record
                        </button>
                    )
                )}
            </div>
        </div>
    );
};

// User Listing Card (Enhanced layout and action)
const UserListingCard: React.FC<{ listing: Listing; onEdit: (listing: Listing) => void; }> = ({ listing, onEdit }) => {
    const fullLocation = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}`;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
            <div className="flex-grow">
                 <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                        <LocationIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="font-extrabold text-lg text-gray-900 dark:text-white leading-tight">{listing.city}, {listing.state}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{listing.address}</p>
                
                {listing.description && (
                     <div className="flex items-start gap-3 mb-4 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <InfoIcon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <p className="italic">{listing.description}</p>
                    </div>
                )}
                
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="flex justify-between items-center"><span className="flex items-center gap-2"><DollarIcon className="w-4 h-4 text-green-500" /> Rate:</span><span className="font-extrabold text-green-600 dark:text-green-400">${listing.rate.toFixed(2)} / hour</span></div>
                    <div className="flex justify-between items-center"><span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-indigo-500" /> Date:</span><span>{listing.date}</span></div>
                    <div className="flex justify-between items-center"><span className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-purple-500" /> Time:</span><span>{listing.startTime} - {listing.endTime}</span></div>
                </div>
            </div>
            
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
                <button 
                    onClick={() => onEdit(listing)} 
                    className="w-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors text-sm flex items-center justify-center gap-1"
                >
                    <PencilIcon className="w-4 h-4" />
                    Edit Listing
                </button>
            </div>
        </div>
    );
};

// Booking Request Card (Enhanced visibility and action)
const BookingRequestCard: React.FC<{ request: Booking, onApprove: (req: Booking) => void, onDeny: (req: Booking) => void }> = ({ request, onApprove, onDeny }) => {
    const [isLoading, setIsLoading] = useState<'approve' | 'deny' | null>(null);

    const handleApprove = async () => {
        setIsLoading('approve');
        await onApprove(request);
        // Note: Parent needs to handle state update (removing the request)
    }
    const handleDeny = async () => {
        setIsLoading('deny');
        await onDeny(request);
        // Note: Parent needs to handle state update (removing the request)
    }
    
    // Calculate total cost for context
    const totalCost = useMemo(() => calculateTotalCost(request.rate, request.startTime, request.endTime), [request.rate, request.startTime, request.endTime]);

    return (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-5 border border-blue-300 dark:border-blue-700 shadow-md">
             <div className="flex items-center justify-between mb-3 border-b border-blue-200 dark:border-blue-700 pb-3">
                 <h4 className="text-lg font-bold text-gray-900 dark:text-white">New Request</h4>
                 <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">ACTION REQUIRED</span>
             </div>
             
             <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex justify-between items-center"><span className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-gray-500" /> Booker:</span><span className="font-extrabold text-gray-900 dark:text-white">{request.bookerName}</span></div>
                <div className="flex justify-between items-center"><span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-indigo-500" /> Date:</span><span>{request.date}</span></div>
                <div className="flex justify-between items-center"><span className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-purple-500" /> Time:</span><span>{request.startTime} - {request.endTime}</span></div>
                 <div className="flex justify-between items-center"><span className="flex items-center gap-2"><DollarIcon className="w-4 h-4 text-green-500" /> Cost:</span><span className="font-extrabold text-green-600 dark:text-green-400">${totalCost}</span></div>
            </div>
             
             <div className="mt-5 pt-5 border-t border-blue-200 dark:border-blue-800 flex gap-3">
                <button onClick={handleApprove} disabled={!!isLoading} className="w-full bg-green-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    {isLoading === 'approve' ? 'Approving...' : 'Approve'}
                </button>
                <button onClick={handleDeny} disabled={!!isLoading} className="w-full bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center gap-1">
                    <XCircleIcon className="w-4 h-4" />
                    {isLoading === 'deny' ? 'Denying...' : 'Deny'}
                </button>
            </div>
        </div>
    );
};

interface ProfileViewProps {
    user: User, 
    listings: Listing[], 
    bookings: Booking[], 
    bookingRequests: Booking[],
    addListing: (listingData: Omit<Listing, 'id' | 'ownerId'>) => Promise<void>; 
    updateListing: (listingId: string, listingData: Omit<Listing, 'id' | 'ownerId'>) => Promise<void>;
    cancelBooking: (booking: Booking) => Promise<void>; 
    approveBooking: (booking: Booking) => Promise<void>;
    denyBooking: (booking: Booking) => Promise<void>;
    deleteBooking: (bookingId: string) => Promise<void>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, listings, bookings, bookingRequests, addListing, updateListing, cancelBooking, approveBooking, denyBooking, deleteBooking }) => {
    const [activeTab, setActiveTab] = useState<ProfileTab>('bookings');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);
    
    const tabClasses = "px-5 py-2.5 text-md font-extrabold rounded-xl transition-colors duration-200";
    const activeTabClasses = "bg-blue-600 text-white shadow-lg shadow-blue-500/40";
    const inactiveTabClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700";

    const handleFormSubmit = async (listingData: Omit<Listing, 'id' | 'ownerId'>, id?: string) => {
        if (id) {
            await updateListing(id, listingData);
        } else {
            await addListing(listingData);
        }
        setIsFormVisible(false);
        setListingToEdit(null);
    };

    const handleOpenEditForm = (listing: Listing) => {
        setListingToEdit(listing);
        setIsFormVisible(true);
    };
    
    const handleCloseForm = () => {
        setIsFormVisible(false);
        setListingToEdit(null);
    }

    // Determine the current form state for the button text
    const formActionText = listingToEdit ? 'Edit Driveway' : 'List New Driveway';

    return (
        <>
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <header className="mb-10 text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">👋 Hello, {user.name || 'User'}</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">Manage your parking business and bookings.</p>
            </header>
            
            {/* Tab Navigation */}
            <div className="flex justify-center mb-10">
                <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex space-x-2">
                    <button 
                        onClick={() => setActiveTab('bookings')} 
                        className={`${tabClasses} ${activeTab === 'bookings' ? activeTabClasses : inactiveTabClasses}`}
                    >
                        My Bookings ({bookings.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('listings')} 
                        className={`${tabClasses} ${activeTab === 'listings' ? activeTabClasses : inactiveTabClasses}`}
                    >
                        My Driveways ({listings.length})
                    </button>
                </div>
            </div>
            
            {/* Content Section */}
            <div>
                {activeTab === 'bookings' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Reservations</h2>
                        {bookings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {bookings.map(b => <BookingCard key={b.id} booking={b} onCancel={cancelBooking} onDelete={deleteBooking} />)}
                            </div>
                        ) : (
                            <div className="text-center py-20 px-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                                <CarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-4">No Bookings Yet</h2>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Use the AI Assistant or the Marketplace to find and book a spot.</p>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'listings' && (
                     <div className="space-y-10">
                        {/* Pending Requests Section */}
                        {bookingRequests.length > 0 && (
                            <div className="bg-blue-50 dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-700">
                                <h2 className="text-2xl font-bold mb-6 text-center text-blue-800 dark:text-blue-400">🚨 Pending Booking Requests ({bookingRequests.length})</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {bookingRequests.map(req => <BookingRequestCard key={req.id} request={req} onApprove={approveBooking} onDeny={denyBooking}/>)}
                                </div>
                            </div>
                        )}
                        
                        {/* Your Listings Section */}
                        <div className="flex justify-between items-center pt-2">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Listed Driveways</h2>
                            <button 
                                onClick={() => { setListingToEdit(null); setIsFormVisible(true); }} 
                                className="flex items-center space-x-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-md transform hover:scale-105"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>List New Driveway</span>
                            </button>
                        </div>
                        
                        {listings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {listings.map(l => <UserListingCard key={l.id} listing={l} onEdit={handleOpenEditForm} />)}
                            </div>
                        ) : (
                            <div className="text-center py-20 px-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                                <CarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-4">You Haven't Listed Any Driveways</h2>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Click the button above to list your driveway and start earning.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        
        {/* Modal for ListingForm (List/Edit) */}
        {isFormVisible && (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300" 
                onClick={handleCloseForm} 
                role="dialog" 
                aria-modal="true"
            >
                <div 
                    className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 relative" 
                    onClick={e => e.stopPropagation()}
                >
                   <button 
                       onClick={handleCloseForm} 
                       className="absolute top-4 right-4 p-2 z-10 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-md"
                   >
                       <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                       <span className="sr-only">Close form</span>
                   </button>
                   <h2 className="text-3xl font-extrabold text-center mb-6 pt-4 text-gray-900 dark:text-white">{formActionText}</h2>
                   <ListingForm onSubmit={handleFormSubmit} initialData={listingToEdit} />
                </div>
            </div>
        )}
        </>
    );
};

export default ProfileView;