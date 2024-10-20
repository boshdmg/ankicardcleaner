// Function to send requests to AnkiConnect
async function invokeAnkiConnect(action, params = {}) {
    const response = await fetch('http://localhost:8765', {
        method: 'POST',
        body: JSON.stringify({ action, version: 6, params }),
    });
    const responseJson = await response.json();
    if (responseJson.error) {
        throw new Error(responseJson.error);
    }
    return responseJson.result;
}

// Function to strip leading and trailing whitespace, handle HTML escaped spaces, and remove all HTML tags except <u>, <b>, <br>, and <strong>
function stripWhitespace(text) {
    const stripped = text
        .replace(/^(&nbsp;|\s)+|(&nbsp;|\s)+$/g, '')  // Remove leading and trailing whitespace, including &nbsp;
        .replace(/<(?!\/?(?:u|b|br|strong|img|div)\b)[^>]+>/g, '')  // Remove all HTML tags except <u>, <b>, <br>, <img>, <div>, and <strong>
        .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
        .trim();  // Trim any remaining whitespace

    return stripped || text;  // Return the stripped text if non-empty, otherwise return the original text
}

// Helper function to remove HTML tags
function stripHtmlTags(text) {
    return text.replace(/<[^>]*>/g, '');
}

// Function to update cards in a deck
async function updateCardsInDeck(deckName) {
    try {
        const noteIds = await invokeAnkiConnect('findNotes', { query: `deck:"${deckName}"` });
        for (const noteId of noteIds) {
            const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [noteId] });
            
            // Check if Russian field exists and check spelling
            if (noteInfo.fields.Russian) {
                const russianField = noteInfo.fields.Russian.value;
         
                // Check spelling
                // const spellingResult = await checkSpelling(russianField);
                // if (spellingResult.matches && spellingResult.matches.length > 0) {
                //     console.log(`Spelling issues found in note ${noteId}:`, spellingResult.matches);
                //     // You could choose to automatically correct the spelling or flag the card for review
                // }
            }

            // Process each field in the note
            const updatedFields = {};
            let hasChanges = false;

            for (const [field, { value }] of Object.entries(noteInfo.fields)) {
                const strippedValue = stripWhitespace(value);
                if (!strippedValue && value) {
                    throw new Error(`Stripped value is empty or undefined for note ${noteId}, field ${field}`);
                }
                if (strippedValue !== value) {
                    updatedFields[field] = strippedValue;
                    hasChanges = true;
                    console.log(`Field: ${field}`);
                    console.log(`Original Value: [${value}]`);
                    console.log(`Cleaned Value: [${strippedValue}]`);
                }
            }

            if (hasChanges) {
                if (Object.keys(updatedFields).length > 0) {
                    await invokeAnkiConnect('updateNoteFields', {
                        note: {
                            id: noteId,
                            fields: updatedFields
                        }
                    });
                }
                console.log(`Updated note ${noteId}`);
            }

            // Check if the note has a leech tag and intervals > 20 days
            if (noteInfo.tags.includes('leech')) {
                const cardIds = await invokeAnkiConnect('findCards', { query: `nid:${noteId}` });
                const cardInfo = await invokeAnkiConnect('cardsInfo', { cards: cardIds });
                
                if (cardInfo.length === 2 && 
                    cardInfo[0].interval > 20 && 
                    cardInfo[1].interval > 20) {
                    // Remove leech tag
                    await invokeAnkiConnect('removeTags', {
                        notes: [noteId],
                        tags: 'leech'
                    });
                    console.log(`Removed leech tag from note ${noteId}`);
                }
            }
            
        }

        console.log('Finished updating cards');
    } catch (error) {
        console.error('Error updating cards:', error);
    }
}

// Replace 'Your Deck Name' with the actual name of your deck
const deckName = 'Russian';
updateCardsInDeck(deckName);

// Function to check spelling using Yandex Speller API with retry logic
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

//восемнàдцать -> восемна́дцать
//Когдá -> когда́
