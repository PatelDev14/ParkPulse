import { GoogleGenAI, Type } from "@google/genai";
import { Listing, Booking, User } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY


if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

// NOTE: We initialize the client without specifying a model here, 
// and define the model in each generateContent call.
const ai = new GoogleGenAI({ apiKey: API_KEY });

// The preferred model for non-grounded, structured responses.
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';

// ------------------------------------------------------------------------------------------------------------------
// --- 1. Parking Search Schemas and Function -------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------

const parkingResponseSchema = {
    type: Type.OBJECT,
    properties: {
        marketplaceResults: {
            type: Type.ARRAY,
            description: "Parking spots found in the private driveway marketplace.",
            items: {
                type: Type.OBJECT,
                properties: {
                    listingId: { type: Type.STRING, description: "The unique ID of the listing from the marketplace data." },
                    name: { type: Type.STRING, description: "Should be 'Private Driveway'." },
                    address: { type: Type.STRING, description: "The full address of the parking spot." },
                    details: { type: Type.STRING, description: "A summary of rate and availability. e.g., '$5.00/hr, available on 2024-09-20 from 09:00 - 17:00'. ALWAYS use 24-hour format for times and YYYY-MM-DD for dates." }
                },
                required: ["listingId", "name", "address", "details"],
            }
        },
        webResults: {
            type: Type.ARRAY,
            description: "Parking spots found from general web knowledge (garages, public lots, etc.).",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the parking garage or lot." },
                    address: { type: Type.STRING, description: "The approximate address or cross-streets." },
                    details: { type: Type.STRING, description: "A summary of typical rates or hours, if known." },
                    website: { type: Type.STRING, description: "The official website URL for the parking location, if available." }
                },
                 required: ["name", "address", "details"],
            }
        }
    },
    required: ["marketplaceResults", "webResults"],
};

/**
 * Searches for parking spots based on the user's query, integrating both
 * real-time marketplace data and general web knowledge (via the model's training).
 * @param userQuery The natural language query from the user (e.g., "parking near stadium tomorrow").
 * @param marketplaceListings The current, available listings from Firestore.
 * @returns A JSON string containing structured search results.
 */
export async function findParkingSpots(userQuery: string, marketplaceListings: Listing[]): Promise<string> {
    const marketplaceListingsJson = JSON.stringify(marketplaceListings.map(l => ({
        id: l.id, // Important: pass the ID to Gemini
        location: `${l.address}, ${l.city}, ${l.state} ${l.zipCode}, ${l.country}`,
        rate: l.rate,
        date: l.date,
        startTime: l.startTime,
        endTime: l.endTime,
        description: l.description,
    })), null, 2);

    const prompt = `
You are ParkPulse, an intelligent and helpful parking assistant. The user's request is: "${userQuery}".

You have access to two data sources:
1.  **Private Driveway Marketplace:** A real-time list of user-submitted driveways. Each has a unique 'id'.
2.  **General Web Knowledge:** Your vast understanding of public and commercial parking.

Here are the current marketplace listings. Pay close attention to the 'description' field for keywords like 'EV charging', 'covered spot', 'near stadium', etc., to find the best match.
\`\`\`json
${marketplaceListingsJson}
\`\`\`

**Your Task:**
Analyze the user's query and the marketplace data. Return a JSON object matching the provided schema containing relevant parking options from BOTH sources.

- **BE INTELLIGENT:** If a user provides a location that seems incorrect (e.g., "Oshawa, USA"), use your knowledge to correct it (Oshawa is in Canada) and find relevant results. Your goal is to be helpful, not pedantic. If the location is truly ambiguous, you can mention it in your response, but always try to provide some results.
- If a marketplace listing is a strong match, include it in 'marketplaceResults' and YOU MUST include its original 'listingId'.
- For marketplace results, the 'details' string MUST include the rate, date, and time. Example: '$5.00/hr, available on 2024-09-20 from 09:00 - 17:00'.
- Use your web knowledge to find public/commercial options and add them to 'webResults'. If you find an official website, include it in the 'website' field.
- If no results are found in a category, return an empty array for it. Do not invent results.
- **IMPORTANT: All times in the 'details' string MUST be in 24-hour format (e.g., 09:00, 17:30). All dates MUST be in YYYY-MM-DD format.**
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: parkingResponseSchema,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return JSON.stringify({ error: "I'm sorry, I encountered an error while searching for parking. Please check your API key and try again." });
    }
}

// ------------------------------------------------------------------------------------------------------------------
// --- 2. Email Generation Schemas and Functions --------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------

const singleEmailSchema = {
    type: Type.OBJECT,
    properties: {
        subject: { type: Type.STRING, description: "The subject line for the email." },
        body: { type: Type.STRING, description: "The full, friendly, and helpful HTML email body." },
    },
    required: ["subject", "body"],
};

/**
 * Generates an email to the driveway owner requesting a booking approval.
 */
export async function generateBookingRequestEmail(booking: Booking): Promise<{ subject: string; body: string }> {
    const fallback = {
        subject: `New Booking Request for ${booking.location}`,
        body: `You have a new booking request from ${booking.bookerName} for your driveway at ${booking.location} on ${booking.date}. Please log in to your ParkPulse dashboard to respond.`,
    };

    const prompt = `
    You are the automated notification system for ParkPulse.
    A user named "${booking.bookerName}" has just requested to book your driveway at "${booking.location}".

    The requested details are:
    - Date: ${booking.date}
    - Time: ${booking.startTime} to ${booking.endTime}
    - Booker: ${booking.bookerName} (${booking.bookerEmail})

    **Your Task:**
    Generate a professional email to the driveway owner to inform them of this new booking request.
    IMPORTANT: Use the provided time values *exactly* as they are given (e.g., '09:00', '17:30'). Do not reformat them into AM/PM or add seconds.
    The email should clearly state the request details and instruct the owner to visit their ParkPulse dashboard to approve or deny the request.
    Return a single JSON object with "subject" and "body".
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: singleEmailSchema }
        });
        // Safely parse the JSON response
        try {
            return JSON.parse(response.text);
        } catch (e) {
            console.warn("Model returned malformed JSON for generateBookingRequestEmail. Using fallback.", response.text);
            return fallback;
        }
    } catch (error) {
        console.error("Error generating booking request email:", error);
        return fallback;
    }
}

/**
 * Generates an email to the booker informing them their booking request was denied.
 */
export async function generateBookingDeniedEmail(booking: Booking): Promise<{ subject: string; body: string }> {
    const fallback = {
        subject: `Update on your booking request for ${booking.location}`,
        body: `Unfortunately, your booking request for the driveway at ${booking.location} on ${booking.date} could not be accepted by the owner. We encourage you to search for other available spots on ParkPulse.`,
    };

    const prompt = `
    You are the automated notification system for ParkPulse.
    A booking request from "${booking.bookerName}" for the driveway at "${booking.location}" has been denied by the owner.

    The original request details were:
    - Date: ${booking.date}
    - Time: ${booking.startTime} to ${booking.endTime}

    **Your Task:**
    Generate a polite and empathetic email to the user (${booking.bookerName}) informing them that their booking request was not accepted by the driveway owner.
    IMPORTANT: Use the provided time values *exactly* as they are given. Do not reformat them.
    Do not speculate on the reason for denial. Simply state the outcome clearly and encourage them to search for other options on ParkPulse.
    Return a single JSON object with "subject" and "body".
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: singleEmailSchema }
        });
        // Safely parse the JSON response
        try {
            return JSON.parse(response.text);
        } catch (e) {
            console.warn("Model returned malformed JSON for generateBookingDeniedEmail. Using fallback.", response.text);
            return fallback;
        }
    } catch (error) {
        console.error("Error generating booking denied email:", error);
        return fallback;
    }
}


const bookingConfirmationEmailSchema = {
    type: Type.OBJECT,
    properties: {
        bookerSubject: {
            type: Type.STRING,
            description: "The subject line for the booker's email. e.g., 'Your ParkPulse Booking is Confirmed!'"
        },
        bookerEmailContent: {
            type: Type.STRING,
            description: "The full, friendly, and helpful email body for the person who booked the spot."
        },
        ownerSubject: {
            type: Type.STRING,
            description: "The subject line for the owner's email. e.g., 'Booking Confirmed for Your Driveway on ParkPulse'"
        },
        ownerEmailContent: {
            type: Type.STRING,
            description: "The full, professional email body for the driveway owner, confirming the booking."
        },
    },
    required: ["bookerSubject", "bookerEmailContent", "ownerSubject", "ownerEmailContent"],
};

/**
 * Generates two emails: one for the booker (confirmation) and one for the owner (notification).
 */
export async function generateBookingConfirmationEmails(
    details: { bookerName: string; ownerEmail: string; location: string; date: string; startTime: string; endTime: string, rate: number }
): Promise<{ bookerSubject: string; bookerEmailContent: string; ownerSubject: string; ownerEmailContent: string }> {
    const fallback = {
        bookerSubject: `Booking Confirmed: ${details.location}`,
        bookerEmailContent: `Your booking for ${details.location} on ${details.date} from ${details.startTime} to ${details.endTime} is confirmed.`,
        ownerSubject: `Booking Confirmed: ${details.location}`,
        ownerEmailContent: `Your driveway at ${details.location} has been booked by ${details.bookerName} on ${details.date} from ${details.startTime} to ${details.endTime}.`,
    };

    const prompt = `
You are the automated notification system for ParkPulse.
A booking has just been CONFIRMED for a driveway at "${details.location}" by "${details.bookerName}".

The booking details are:
- Date: ${details.date}
- Time: ${details.startTime} to ${details.endTime}
- Rate: $${details.rate}/hour

**Your Task:**
Generate two separate emails as a single JSON object matching the schema. This is the FINAL confirmation.
IMPORTANT: Use the provided time values *exactly* as they are given (e.g., '09:00'). Do not reformat them into AM/PM or add seconds.
1.  **For the Booker:** A confirmation email to "${details.bookerName}". It should be friendly, confirm all booking details, and provide clear instructions.
2.  **For the Owner:** A notification email to the driveway owner (contact email: ${details.ownerEmail}). It should be professional, inform them of the CONFIRMED booking, and include all relevant details.
`;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: bookingConfirmationEmailSchema,
            }
        });
        // Safely parse the JSON response
        try {
            return JSON.parse(response.text);
        } catch (e) {
            console.warn("Model returned malformed JSON for generateBookingConfirmationEmails. Using fallback.", response.text);
            return fallback;
        }
    } catch (error) {
        console.error("Error generating emails with Gemini API:", error);
        return fallback;
    }
}

const listingConfirmationEmailSchema = {
    type: Type.OBJECT,
    properties: {
        subject: {
            type: Type.STRING,
            description: "The subject line for the email. e.g., 'Congratulations! Your Driveway is Listed on ParkPulse'"
        },
        emailContent: {
            type: Type.STRING,
            description: "The full, friendly, and helpful email body for the driveway owner."
        },
    },
    required: ["subject", "emailContent"],
};

/**
 * Generates a confirmation email to the owner after they successfully list a driveway.
 */
export async function generateListingConfirmationEmail(
    listing: Listing,
    userName: string
): Promise<{ subject: string; emailContent: string }> {
    const fallback = {
        subject: "Your Driveway is Listed!",
        emailContent: `Congratulations, ${userName}! Your driveway at ${listing.address} is now live on ParkPulse.`,
    };

    const prompt = `
You are the automated notification system for ParkPulse.
A user named "${userName}" has just successfully listed their driveway.

The listing details are:
- Location: ${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}
- Date: ${listing.date}
- Time: ${listing.startTime} to ${listing.endTime}
- Rate: $${listing.rate}/hour

**Your Task:**
Generate a friendly and congratulatory confirmation email to the user.
IMPORTANT: Use the provided time values *exactly* as they are given. Do not reformat them.
The email should confirm the listing is live and visible to others.
Return a single JSON object with "subject" and "emailContent".
`;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: listingConfirmationEmailSchema,
            }
        });
        // Safely parse the JSON response
        try {
            return JSON.parse(response.text);
        } catch (e) {
            console.warn("Model returned malformed JSON for generateListingConfirmationEmail. Using fallback.", response.text);
            return fallback;
        }
    } catch (error) {
        console.error("Error generating listing confirmation email:", error);
        return fallback;
    }
}

const bookingCancellationEmailSchema = {
    type: Type.OBJECT,
    properties: {
        bookerSubject: { type: Type.STRING },
        bookerEmailContent: { type: Type.STRING },
        ownerSubject: { type: Type.STRING },
        ownerEmailContent: { type: Type.STRING },
    },
    required: ["bookerSubject", "bookerEmailContent", "ownerSubject", "ownerEmailContent"],
};

/**
 * Generates two emails: one for the booker (cancellation confirmation) and one for the owner (notification of cancellation).
 */
export async function generateBookingCancellationEmails(
    booking: Booking,
    canceler: User
): Promise<{ bookerSubject: string; bookerEmailContent: string; ownerSubject: string; ownerEmailContent: string }> {
    const fallback = {
        bookerSubject: `Booking Canceled: ${booking.location}`,
        bookerEmailContent: `Your booking for ${booking.location} on ${booking.date} has been successfully canceled.`,
        ownerSubject: `Booking Canceled by User: ${booking.location}`,
        ownerEmailContent: `The booking for your driveway at ${booking.location} on ${booking.date} from ${booking.startTime} to ${booking.endTime} has been canceled by the user.`,
    };

    const prompt = `
You are the automated notification system for ParkPulse.
A booking for the driveway at "${booking.location}" has been CANCELED by the booker, "${canceler.name}".

The original booking details were:
- Date: ${booking.date}
- Time: ${booking.startTime} to ${booking.endTime}

**Your Task:**
Generate two separate emails as a single JSON object.
IMPORTANT: Use the provided time values *exactly* as they are given. Do not reformat them.
1.  **For the Booker:** A confirmation email to "${canceler.name}" confirming their cancellation.
2.  **For the Owner:** A notification email to the driveway owner informing them that the booking has been canceled by the user.
`;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: bookingCancellationEmailSchema,
            }
        });
        // Safely parse the JSON response
        try {
            return JSON.parse(response.text);
        } catch (e) {
            console.warn("Model returned malformed JSON for generateBookingCancellationEmails. Using fallback.", response.text);
            return fallback;
        }
    } catch (error) {
        console.error("Error generating cancellation emails:", error);
        return fallback;
    }
}

/**
 * Generates an email to the booker informing them their booking was auto-canceled 
 * due to the owner updating the listing.
 */
export async function generateListingUpdateCancellationEmail(booking: Booking): Promise<{ subject: string; body: string }> {
    const fallback = {
        subject: `Important Update on your booking for ${booking.location}`,
        body: `Unfortunately, your booking for the driveway at ${booking.location} on ${booking.date} has been canceled because the owner updated their availability. We apologize for any inconvenience this may cause and encourage you to search for other available spots on ParkPulse.`,
    };

    const prompt = `
    You are the automated notification system for ParkPulse.
    A booking for "${booking.location}" has been automatically canceled because the driveway owner updated their listing's availability.

    The canceled booking details were:
    - Booker: ${booking.bookerName}
    - Date: ${booking.date}
    - Time: ${booking.startTime} to ${booking.endTime}

    **Your Task:**
    Generate a polite and empathetic email to the user (${booking.bookerName}) informing them that their booking was canceled due to a change made by the owner.
    IMPORTANT: Use the provided time values *exactly* as they are given.
    Apologize for the inconvenience and encourage them to search for other options on ParkPulse.
    Return a single JSON object with "subject" and "body".
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: singleEmailSchema }
        });
        // Safely parse the JSON response
        try {
            return JSON.parse(response.text);
        } catch (e) {
            console.warn("Model returned malformed JSON for generateListingUpdateCancellationEmail. Using fallback.", response.text);
            return fallback;
        }
    } catch (error) {
        console.error("Error generating listing update cancellation email:", error);
        return fallback;
    }
}