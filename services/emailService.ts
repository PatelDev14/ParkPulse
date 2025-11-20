export const sendEmail = (to: string, subject: string, htmlBody: string): boolean => {
    // 1. Basic Validation
    if (!to || !subject || !htmlBody) {
        console.error("sendEmail failed: Missing required fields (to, subject, or body).");
        return false;
    }

    // 2. Convert HTML to Plain Text for mailto link compatibility
    // Step a: Replace <br> and <p> tags with two newlines for readability
    let plainTextBody = htmlBody
        .replace(/<br\s*\/?>/gi, '\n\n') 
        .replace(/<p\s*\/?>/gi, '\n\n'); 

    // Step b: Remove all remaining HTML tags
    plainTextBody = plainTextBody.replace(/<[^>]*>/g, '');
    
    // Step c: Tidy up multiple newlines created by stripping (e.g., from nested tags)
    plainTextBody = plainTextBody.replace(/(\n\s*){3,}/g, '\n\n').trim();

    // 3. Encode components
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(plainTextBody);

    // 4. Construct the mailto link
    const mailtoLink = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;

    // 5. Trigger the default mail client
    try {
        window.location.href = mailtoLink;
        return true;
    } catch (error) {
        console.error("sendEmail failed to open mail client:", error);
        return false;
    }
};