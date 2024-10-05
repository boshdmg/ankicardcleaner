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

// Function to strip leading and trailing whitespace, handle HTML escaped spaces, and remove <strong> and <b> tags only when they surround the entire content
function stripWhitespace(text) {
    const stripped = text
        .replace(/^(&nbsp;|\s)+|(&nbsp;|\s)+$/g, '')  // Remove leading and trailing whitespace, including &nbsp;
        .replace(/^&nbsp;|&nbsp;$/g, '')  // Remove any remaining leading or trailing &nbsp;
        .replace(/^<(strong|b)>(.*)<\/\1>$/, '$2')  // Remove <strong> or <b> tags only when they surround the entire content
        .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
        .trim();  // Trim any remaining whitespace

    return stripped || text;  // Return the stripped text if non-empty, otherwise return the original text
}

// Function to update cards in a deck
async function updateCardsInDeck(deckName) {
    try {
        // Get all note IDs in the deck
        const noteIds = await invokeAnkiConnect('findNotes', { query: `deck:"${deckName}"` });

        for (const noteId of noteIds) {
            // Get note info
            const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [noteId] });
            
            // Process each field in the note
            const updatedFields = {};
            let hasChanges = false;

            for (const [field, { value }] of Object.entries(noteInfo.fields)) {
                const strippedValue = stripWhitespace(value);
                if (!strippedValue && field === 'Russian') {
                    throw new Error(`Stripped value is empty or undefined for note ${noteId}, field ${field}`);
                }
                if (strippedValue !== value) {
                    updatedFields[field] = strippedValue;
                    hasChanges = true;
                    console.log(`Field: ${field}`);
                    console.log(`Stripped: [${strippedValue}]`);
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
