import React, { useState, useEffect, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth, googleProvider, RecaptchaVerifier } from '../firebase';
import { CarIcon, MailIcon, PhoneIcon, LockIcon, UserCircleIcon, LogOutIcon } from './icons';

// Declare recaptchaVerifier in the window scope for Firebase
declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier;
    }
}

const LoginView: React.FC = () => {
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
    const [isSignUp, setIsSignUp] = useState(false);
    
    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // Logic states
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [hostname, setHostname] = useState('');

    const recaptchaContainerRef = useRef<HTMLDivElement>(null); // Unused, but kept for future reference

    useEffect(() => {
        setHostname(window.location.hostname);

        // Setup reCAPTCHA verifier
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': () => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
              }
            });
        }
    }, []);

    const resetFormState = () => {
        setError(null);
        setIsLoading(false);
        setConfirmationResult(null);
        setVerificationCode('');
    }

    const handleMethodChange = (method: 'email' | 'phone') => {
        setLoginMethod(method);
        resetFormState();
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isSignUp) {
                if (!name.trim()) {
                    setError("Please enter your name.");
                    setIsLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCodeVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmationResult) {
            setError("Something went wrong. Please try sending the code again.");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            await confirmationResult.confirm(verificationCode);
            // On success, onAuthStateChanged will handle the login
        } catch (err: any) {
             setError(err.message.replace('Firebase: ', ''));
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleGoogleAuth = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
             if (err.code === 'auth/popup-closed-by-user') {
                setError("Sign-in process cancelled.");
            } else {
                setError(err.message.replace('Firebase: ', ''));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- ENHANCED UI CLASSES ---
    const inputClasses = "w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-inner";
    const labelClasses = "block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200";

    const EmailForm = (
        <>
            <h2 className="text-2xl font-extrabold text-center mb-6 text-gray-900 dark:text-white">{isSignUp ? 'Create Your Account' : 'Welcome Back'}</h2>
            <form onSubmit={handleEmailAuth} className="space-y-5">
                {isSignUp && (
                    <div>
                        <label htmlFor="name" className={labelClasses}>Full Name</label>
                        <div className="relative">
                            <UserCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={`${inputClasses} pl-10`} placeholder="John Doe" required />
                        </div>
                    </div>
                )}
                <div>
                    <label htmlFor="email" className={labelClasses}>Email Address</label>
                    <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className={`${inputClasses} pl-10`} placeholder="email@parkpulse.com" required />
                    </div>
                </div>
                <div>
                    <label htmlFor="password" className={labelClasses}>Password</label>
                    <div className="relative">
                        <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className={`${inputClasses} pl-10`} placeholder="••••••••" required minLength={6} />
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/40 transform hover:scale-[1.005] disabled:bg-gray-400 disabled:shadow-none disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-wait text-lg"
                >
                    {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
                </button>
            </form>
            <p className="text-center mt-5 text-sm text-gray-600 dark:text-gray-400">
                {isSignUp ? 'Already have an account?' : "New to ParkPulse?"}
                <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline ml-1 transition-colors">
                    {isSignUp ? 'Log In' : 'Sign Up Here'}
                </button>
            </p>
        </>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative">
             {hostname && (
                <div className="absolute top-0 left-0 right-0 bg-red-600 text-white p-3 text-center text-sm font-sans z-10 border-b-4 border-red-800">
                    <strong className="tracking-wider">FIREBASE CONFIG WARNING:</strong> Add this domain to your authorized list &#x27A1; 
                    <strong className="select-all bg-white text-black p-1 rounded-md ml-3 font-mono shadow-md">{hostname}</strong>
                </div>
            )}
            <div className="w-full max-w-md my-10">
                <div className="text-center mb-8">
                    <CarIcon className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto transform rotate-3" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mt-4">
                        Park<span className="text-indigo-600 dark:text-indigo-400">Pulse</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-md font-medium">Log in to chat with your AI parking assistant.</p>
                </div>
                
                {/* Main Auth Card */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
                    
                    {/* Tab Navigation */}
                    <div className="flex justify-center mb-8 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl shadow-inner">
                        <button 
                            onClick={() => handleMethodChange('email')} 
                            className={`w-1/2 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${loginMethod === 'email' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            <MailIcon className="w-5 h-5" /> Email
                        </button>
                        <button 
                            onClick={() => handleMethodChange('phone')} 
                            className={`w-1/2 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${loginMethod === 'phone' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                             <PhoneIcon className="w-5 h-5" /> Phone
                        </button>
                    </div>

                    {error && 
                        <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 text-center text-sm font-medium border border-red-300 dark:border-red-700">
                            {error}
                        </div>
                    }
                    
                    {loginMethod === 'email' && EmailForm}
                    {/* {loginMethod === 'phone' && PhoneForm} */}

                    {/* Divider and Google Button */}
                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-gray-200 dark:border-gray-700" />
                        <span className="mx-4 text-sm text-gray-500 dark:text-gray-400 font-medium">OR CONTINUE WITH</span>
                        <hr className="flex-grow border-gray-200 dark:border-gray-700" />
                    </div>
                    
                    <button 
                        onClick={handleGoogleAuth} 
                        disabled={isLoading} 
                        className="w-full flex justify-center items-center gap-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-wait"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.67-11.283-8.591l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.798 44 30.338 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginView;