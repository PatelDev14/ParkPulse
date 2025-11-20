import React, { useState, useRef, useEffect } from 'react';
import { Listing, ChatMessage, ParkingResults, ParkingLocation, ChatRole } from '../types';
import { findParkingSpots } from '../services/geminiService';

import { SendIcon, UserIcon, BotIcon, LocationIcon, CarIcon, GlobeIcon, CrosshairIcon, LinkIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import PermissionModal from './PermissionModal';


type PermissionState = 'prompt' | 'granted' | 'denied';

interface ResultCardProps {
    result: ParkingLocation;
    icon: React.ReactNode;
    onBookNow?: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, icon, onBookNow }) => (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-300/10 flex items-center justify-center shadow-lg">
                {icon}
            </div>
            <div className="flex-grow">
                <p className="font-extrabold text-lg text-gray-900 dark:text-white leading-snug">{result.name}</p>
                <div className="flex items-start gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <LocationIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                    <span className="truncate">{result.address}</span>
                </div>
                 <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{result.details}</p>
                 {result.website && (
                    <a href={result.website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                        <LinkIcon className="w-4 h-4" />
                        Explore Site
                    </a>
                )}
                {onBookNow && (
                     <button 
                        onClick={onBookNow}
                        className="mt-4 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 ease-in-out text-sm"
                    >
                        Request to Book
                    </button>
                )}
            </div>
        </div>
    </div>
);

// --- STYLED ChatView Component ---

interface ChatViewProps {
    marketplaceListings: Listing[];
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    requestBooking: (listing: Listing, startTime: string, endTime: string) => Promise<void>;
    addSystemChatMessage: (content: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ marketplaceListings, messages, setMessages, requestBooking, addSystemChatMessage }) => {
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [listingToBook, setListingToBook] = useState<Listing | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        // Check permission status on component mount to provide a smoother experience
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state);
                // Listen for changes, e.g., if user changes it in settings
                result.onchange = () => {
                    setPermissionStatus(result.state);
                };
            });
        }
    }, []);

    const handleBookNow = (listingId: string) => {
        const listing = marketplaceListings.find(l => l.id === listingId);
        if (listing) {
            setListingToBook(listing);
        } else {
            addSystemChatMessage("Sorry, I couldn't find the details for that listing. It might no longer be available.");
        }
    };
    
     const renderMessageContent = (msg: ChatMessage) => {
        if (msg.role === 'system') {
            // Updated system message style
            return <p className="px-4 py-3 italic text-sm text-gray-500 dark:text-gray-400 border-l-4 border-yellow-500/80" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
        }
        
        try {
            const parsed: ParkingResults | { error: string } = JSON.parse(msg.content);

            if ('error' in parsed) {
                return <p className="text-red-600 dark:text-red-400 font-medium px-4 py-3">Error: {parsed.error}</p>;
            }

            const results: ParkingResults = parsed;
            const hasMarketplaceResults = results.marketplaceResults.length > 0;
            const hasWebResults = results.webResults.length > 0;
            
            if (!hasMarketplaceResults && !hasWebResults) {
                return <p className="px-4 py-3 text-gray-600 dark:text-gray-300">I couldn't find any parking spots matching your request. Please try a different location.</p>
            }

            return (
                <div className="space-y-4">
                    {hasMarketplaceResults && (
                        <>
                            <h3 className="px-4 pt-4 text-md font-extrabold flex items-center gap-2 text-blue-700 dark:text-blue-300 border-b border-gray-200 dark:border-gray-700/50 pb-2">
                                <CarIcon className="w-5 h-5 text-blue-500"/> ParkPulse Driveways (Premium)
                            </h3>
                            {results.marketplaceResults.map((r, i) => (
                                <ResultCard 
                                    key={`m-${i}`} 
                                    result={r} 
                                    icon={<CarIcon className="w-5 h-5 text-blue-500" />} 
                                    onBookNow={r.listingId ? () => handleBookNow(r.listingId!) : undefined}
                                />
                            ))}
                        </>
                    )}
                     {hasWebResults && (
                        <>
                            <h3 className="px-4 pt-4 text-md font-extrabold flex items-center gap-2 text-green-700 dark:text-green-300 border-b border-gray-200 dark:border-gray-700/50 pb-2">
                                <GlobeIcon className="w-5 h-5 text-green-500"/> Public & Commercial Lots
                            </h3>
                            {results.webResults.map((r, i) => <ResultCard key={`w-${i}`} result={r} icon={<GlobeIcon className="w-5 h-5 text-green-500" />} />)}
                        </>
                    )}
                </div>
            );
        } catch (e) {
            return <p className="px-4 py-3">{msg.content}</p>;
        }
    };


    const executeSearch = async (query: string) => {
        if (query.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: query, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMessage]);
        
        // Clear form
        setCity('');
        setState('');
        setZipCode('');
        setCountry('USA');
        setIsLoading(true);

        try {
            const botResponseContent = await findParkingSpots(query, marketplaceListings);
            const botMessage: ChatMessage = { role: 'model', content: botResponseContent, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorContent = JSON.stringify({ error: 'Sorry, I am having trouble connecting. Please try again later.' });
            const errorMessage: ChatMessage = { role: 'system', content: errorContent, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!city && !state && !zipCode) {
            addSystemChatMessage("Please fill out at least one location field to search.");
            return;
        }
        const query = `Find parking in ${city}, ${state} ${zipCode}, ${country}`;
        executeSearch(query);
    };
    
    const fetchLocationAndSearch = () => {
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const query = `Find parking near me (latitude: ${latitude.toFixed(4)}, longitude: ${longitude.toFixed(4)})`;
                executeSearch(query);
                if (permissionStatus === 'prompt') {
                    setPermissionStatus('granted');
                }
            },
            (error) => {
                let errorMessage = "I couldn't get your location. Please try again.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "It looks like you've denied location permissions. You can change this in your browser settings if you'd like to use the 'Near Me' feature.";
                    setPermissionStatus('denied');
                }
                addSystemChatMessage(errorMessage);
                setIsLoading(false);
            }
        );
    };

    const handleNearMeSearch = () => {
        if (!navigator.geolocation) {
            addSystemChatMessage("Sorry, Geolocation is not supported by your browser.");
            return;
        }

        if (permissionStatus === 'granted') {
            fetchLocationAndSearch();
        } else {
            setShowPermissionModal(true);
        }
    };

    const handleRequestLocationPermission = () => {
        setShowPermissionModal(false);
        fetchLocationAndSearch();
    };
    
    return (
        <>
            {/* Main Container: Elegant Shadow, Soft Corners, and a clean backdrop */}
            <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-blue-500/20 overflow-hidden border border-gray-100 dark:border-gray-700">
                {/* Chat History Area: Enhanced padding and flow */}
                <div className="flex-grow p-4 md:p-8 overflow-y-auto space-y-6">
                    {messages.length === 0 && (
                         <div className="text-center text-gray-500 dark:text-gray-400 py-16 flex flex-col items-center">
                            <BotIcon className="w-16 h-16 mx-auto text-blue-300 dark:text-blue-600 animate-bounce-slow" />
                            <h2 className="text-3xl font-extrabold mt-4 text-gray-900 dark:text-white">Welcome to <span className="text-blue-600 dark:text-blue-400">ParkPulse AI</span></h2>
                            <p className="mt-2 text-lg">Your smart parking assistant. Let's find your spot!</p>
                             <div className="mt-10">
                                <button
                                    onClick={() => executeSearch("Show me all available driveways")}
                                    className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full text-md font-semibold border border-blue-200 dark:border-blue-700 shadow-md hover:shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200"
                                >
                                    ✨ Show all available driveways
                                </button>
                            </div>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''} ${msg.role === 'system' ? 'justify-center' : ''}`}>
                            {msg.role === 'model' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                                    <BotIcon className="w-6 h-6" />
                                </div>
                            )}
                            <div className={`max-w-md lg:max-w-xl rounded-2xl shadow-lg transition-all duration-300 ${
                                msg.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-br-3xl rounded-tl-3xl rounded-bl-3xl' : // More defined corners for user
                                msg.role === 'model' ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-3xl rounded-tr-3xl rounded-br-3xl overflow-hidden shadow-xl dark:shadow-gray-900' : // Lighter background for bot
                                'bg-transparent text-gray-900 dark:text-gray-100' // System messages
                            }`}>
                               {/* Increased padding for a softer look */}
                               {msg.role === 'user' ? <p className="px-5 py-3.5 font-medium">{msg.content}</p> : renderMessageContent(msg)}
                            </div>
                             {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-md">
                                    <UserIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && !listingToBook && (
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                               <BotIcon className="w-6 h-6" />
                            </div>
                            <div className="max-w-xl p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 rounded-bl-none shadow-md">
                                <div className="flex items-center space-x-2">
                                    <span className="w-3 h-3 bg-blue-400 rounded-full animate-ping-slow"></span>
                                    <span className="w-3 h-3 bg-indigo-400 rounded-full animate-ping-slow [animation-delay:0.2s]"></span>
                                    <span className="w-3 h-3 bg-blue-400 rounded-full animate-ping-slow [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area: Semi-transparent, elevated, and modern */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-inner-top">
                    <form onSubmit={handleFormSearch} className="space-y-4">
                        {/* Input Fields: Larger, rounded, with focus rings and better contrast */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (e.g., San Francisco)" className="w-full p-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-shadow text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" disabled={isLoading} />
                            <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State / Province (e.g., CA)" className="w-full p-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-shadow text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" disabled={isLoading} />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Zip / Postal Code" className="w-full p-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-shadow text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" disabled={isLoading} />
                             <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country (e.g., USA)" className="w-full p-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-shadow text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" disabled={isLoading} />
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                            {/* Near Me Button: Premium look with distinct style */}
                            <button type="button" onClick={handleNearMeSearch} disabled={isLoading} className="flex-shrink-0 flex items-center justify-center gap-2 p-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm hover:shadow-md disabled:opacity-50 transition-all duration-200" aria-label="Find parking near me">
                                <CrosshairIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
                                <span className="text-sm font-bold">Near Me</span>
                            </button>
                            {/* Search Button: Gradient, bold, and interactive */}
                            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 disabled:dark:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-extrabold text-lg shadow-xl shadow-blue-500/40" aria-label="Search parking">
                                <SendIcon className="w-6 h-6" />
                                <span>Search Parking</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {listingToBook && (
                <ConfirmationModal 
                    listing={listingToBook}
                    onClose={() => setListingToBook(null)}
                    onConfirm={async (startTime, endTime) => {
                        await requestBooking(listingToBook, startTime, endTime);
                        setListingToBook(null);
                    }}
                />
            )}
            {showPermissionModal && (
                <PermissionModal
                    status={permissionStatus}
                    onClose={() => setShowPermissionModal(false)}
                    onAllow={handleRequestLocationPermission}
                />
            )}
        </>
    );
};

export default ChatView;