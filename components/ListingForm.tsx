import React, { useState, useEffect } from 'react';
import { Listing } from '../types';
import { LocationIcon, DollarIcon, CalendarIcon, ClockIcon, MailIcon, InfoIcon, HomeIcon, LockIcon } from './icons'; // Assuming new icons are available

interface ListingFormProps {
    onSubmit: (listing: Omit<Listing, 'id' | 'ownerId'>, id?: string) => Promise<void>;
    initialData?: Listing | null;
}

const PRESET_RATES = [1, 3, 5, 7, 10];

// Helper function to convert HH:MM string to minutes since midnight
const timeToMinutes = (time: string): number => {
    const parts = time.split(':');
    // Ensure both parts exist and are numbers before parsing
    if (parts.length === 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return (hours * 60) + minutes;
        }
    }
    // Return a value that will trigger validation failure if format is wrong
    return -1; 
};

const ListingForm: React.FC<ListingFormProps> = ({ onSubmit, initialData }) => {
    const isEditMode = !!initialData;
    
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState(''); 
    const [description, setDescription] = useState('');
    const [rate, setRate] = useState('5');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    
    useEffect(() => {
        if (initialData) {
            setAddress(initialData.address);
            setCity(initialData.city);
            setState(initialData.state);
            setZipCode(initialData.zipCode);
            setCountry(initialData.country);
            setDescription(initialData.description);
            setRate(initialData.rate.toString());
            setDate(initialData.date);
            setStartTime(initialData.startTime);
            setEndTime(initialData.endTime);
            setContactEmail(initialData.contactEmail);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // --- 1. Basic Required Field Validation ---
        if (!address || !city || !state || !zipCode || !country || !rate || !date || !startTime || !endTime || !contactEmail) {
            setValidationError("Please fill out all required fields.");
            return;
        }

        // --- 2. Rate Validation ---
        const parsedRate = parseFloat(rate);
        if (parsedRate <= 0 || isNaN(parsedRate)) {
            setValidationError("Rate must be a positive number.");
            return;
        }

        // --- 3. Time Logic Validation ---
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        if (startMinutes === -1 || endMinutes === -1) {
            setValidationError("Please enter times in the valid HH:MM 24-hour format (e.g., 09:00).");
            return;
        }
        
        if (startMinutes >= endMinutes) {
             setValidationError("End time must be after start time on the same day.");
             return;
        }
        
        setIsLoading(true);

        try {
            await onSubmit({
                address,
                city,
                state,
                zipCode,
                country,
                rate: parsedRate,
                date,
                startTime,
                endTime,
                contactEmail,
                description,
            }, initialData?.id);
        } catch (error: any) {
            console.error("Submission Error:", error);
            setValidationError(error.message || "An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- ENHANCED UI CLASSES ---
    const inputClasses = "w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all text-gray-800 dark:text-gray-100";
    const labelClasses = "block text-sm font-bold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-100";
    const sectionTitleClasses = "text-xl font-extrabold text-indigo-600 dark:text-indigo-400 border-b pb-2 mb-4 border-gray-200 dark:border-gray-700 flex items-center gap-2";

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl space-y-8 max-w-4xl mx-auto border border-gray-100 dark:border-gray-800">
            <header className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
                    <HomeIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    {isEditMode ? 'Edit Your Driveway' : 'List Your Driveway'}
                </h2>
                <p className="text-md text-gray-500 dark:text-gray-400">
                    {isEditMode ? 'Update the details for your public parking spot.' : 'Provide all necessary information to list your spot on ParkPulse.'}
                </p>
            </header>

            {validationError && (
                 <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-xl text-center text-sm font-medium border border-red-300 dark:border-red-700">
                    {validationError}
                </div>
            )}

            {/* --- SECTION 1: LOCATION DETAILS --- */}
            <div>
                <h3 className={sectionTitleClasses}><LocationIcon className="w-5 h-5" /> Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="address" className={labelClasses}><LocationIcon className="w-4 h-4 text-blue-500" /> Street Address*</label>
                        <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g., 123 Main St" className={inputClasses} required disabled={isLoading} />
                    </div>
                    <div>
                        <label htmlFor="city" className={labelClasses}>City*</label>
                        <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g., Anytown" className={inputClasses} required disabled={isLoading} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                        <label htmlFor="state" className={labelClasses}>State / Province*</label>
                        <input type="text" id="state" value={state} onChange={e => setState(e.target.value)} placeholder="e.g., CA / ON" className={inputClasses} required disabled={isLoading} />
                    </div>
                    <div>
                        <label htmlFor="zipCode" className={labelClasses}>Zip / Postal Code*</label>
                        <input type="text" id="zipCode" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="e.g., 90210 / V5K 0A1" className={inputClasses} required disabled={isLoading} />
                    </div>
                    <div>
                        <label htmlFor="country" className={labelClasses}>Country*</label>
                        <select id="country" value={country} onChange={e => setCountry(e.target.value)} className={inputClasses} required disabled={isLoading}>
                            <option value="" disabled>Select a country</option>
                            <option value="USA">United States</option>
                            <option value="Canada">Canada</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- SECTION 2: AVAILABILITY & RATE --- */}
            <div>
                <h3 className={sectionTitleClasses}><CalendarIcon className="w-5 h-5" /> Availability & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Date */}
                    <div>
                        <label htmlFor="date" className={labelClasses}><CalendarIcon className="w-4 h-4 text-indigo-500" /> Date*</label>
                        <input 
                            type="date" 
                            id="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className={inputClasses} 
                            required 
                            min={new Date().toISOString().split("T")[0]} 
                            disabled={isLoading} 
                        />
                    </div>
                    {/* Start Time */}
                    <div>
                        <label htmlFor="start-time" className={labelClasses}><ClockIcon className="w-4 h-4 text-purple-500" /> Start Time (HH:MM)*</label>
                        <input
                            type="text"
                            id="start-time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className={inputClasses}
                            required
                            placeholder="e.g., 09:00"
                            pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                            title="Enter time in 24-hour HH:MM format (e.g., 09:00 or 17:30)"
                            disabled={isLoading}
                        />
                    </div>
                    {/* End Time */}
                    <div>
                        <label htmlFor="end-time" className={labelClasses}>End Time (HH:MM)*</label>
                        <input
                            type="text"
                            id="end-time"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            className={inputClasses}
                            required
                            placeholder="e.g., 17:30"
                            pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                            title="Enter time in 24-hour HH:MM format (e.g., 09:00 or 17:30)"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                 
                {/* Rate */}
                <div className='mt-6'>
                    <label htmlFor="rate" className={labelClasses}><DollarIcon className="w-4 h-4 text-green-600" /> Rate per Hour ($)*</label>
                    <input
                        id="rate"
                        type="number"
                        value={rate}
                        onChange={e => setRate(e.target.value)}
                        placeholder="e.g., 6.50"
                        className={inputClasses}
                        required
                        min="0"
                        step="0.01"
                        aria-label="Rate per hour"
                        disabled={isLoading}
                    />
                    <div className="flex flex-wrap gap-2 mt-2 pt-1">
                        {PRESET_RATES.map(r => (
                            <button
                                type="button"
                                key={r}
                                onClick={() => setRate(r.toString())}
                                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200 shadow-sm ${
                                    rate === r.toString() 
                                        ? 'bg-green-600 text-white font-semibold ring-2 ring-green-300 dark:ring-green-400' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                                disabled={isLoading}
                            >
                                ${r}.00
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: DESCRIPTION & CONTACT --- */}
            <div>
                <h3 className={sectionTitleClasses}><InfoIcon className="w-5 h-5" /> Details & Contact</h3>
                
                {/* Description */}
                <div>
                    <label htmlFor="description" className={labelClasses}>Description (Optional)</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g., Covered spot, EV charging available, near the stadium entrance."
                        className={`${inputClasses} h-28 resize-y`}
                        maxLength={200}
                        disabled={isLoading}
                    />
                    <p className="text-right text-xs text-gray-400 dark:text-gray-500 mt-1">{description.length}/200 characters</p>
                </div>

                {/* Contact Email */}
                <div className='mt-6'>
                    <label htmlFor="email" className={labelClasses}><MailIcon className="w-4 h-4 text-red-500" /> Contact Email*</label>
                    <input type="email" id="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="e.g., owner@driveway.com" className={inputClasses} required disabled={isLoading} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <LockIcon className="w-3 h-3 text-gray-500" />
                        This email is used for booking notifications and verification only.
                    </p>
                </div>
            </div>
            
            {/* Submit Button */}
            <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold py-3.5 px-4 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-xl shadow-indigo-500/40 transform hover:scale-[1.005] disabled:bg-gray-400 disabled:shadow-none disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-wait text-lg" 
                disabled={isLoading}
            >
                 {isLoading ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isEditMode ? 'Updating Listing...' : 'Submitting Listing...'}
                    </div>
                ) : (isEditMode ? 'Update My Driveway' : 'Add My Driveway')}
            </button>
        </form>
    );
};

export default ListingForm;