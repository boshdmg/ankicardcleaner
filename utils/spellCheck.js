const stripHtmlTags = (text) => text.replace(/<[^>]*>/g, '');

async function checkSpelling(text, retries = 3) {
    const url = 'https://speller.yandex.net/services/spellservice.json/checkText';
    
    // Remove HTML tags from the text
    const strippedText = stripHtmlTags(text);
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'text': strippedText,
                    'lang': 'ru',
                    'options': 4  // Ignore capitalization
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed: ${error.message}`);
            if (i === retries - 1) {
                console.error('All retry attempts failed. Skipping spelling check for this text.');
                return []; // Return an empty array to indicate no spelling issues found
            }
            // Wait for a short time before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

module.exports = { checkSpelling }; 