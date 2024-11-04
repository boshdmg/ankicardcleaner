const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { checkSpelling } = require('./utils/spellCheck');

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
