async function invokeAnkiConnect(action, params = {}) {
    const response = await fetch('http://localhost:8765', {
        method: 'POST',
        body: JSON.stringify({ action, version: 6, params }),
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseJson = await response.json();
    if (responseJson.error) {
        throw new Error(responseJson.error);
    }
    return responseJson.result;
}

async function findLapsedRussianWords(deckName) {
    try {
        // Find all cards in the specified deck
        const cardIds = await invokeAnkiConnect('findCards', { query: `deck:"${deckName}"` });
        
        // Get card info for all cards
        const cardsInfo = await invokeAnkiConnect('cardsInfo', { cards: cardIds });
        
        // Filter and process cards
        const lapsedWords = new Set(); // Use a Set to automatically remove duplicates
        for (const card of cardsInfo) {
            if (card.lapses > 20 && card.interval < 7) { // Changed to >12 lapses and <7 days interval
                const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [card.note] });
                if (noteInfo.fields.Russian) {
                    // Remove HTML tags from the word
                    const cleanWord = noteInfo.fields.Russian.value.replace(/<[^>]*>/g, '');
                    lapsedWords.add(cleanWord);
                }
            }
        }
        
        // Print the lapsed words to the console
        console.log('Russian words that have lapsed more than 12 times and have an interval below 7 days:');
        lapsedWords.forEach(word => {
            console.log(`${word}`);
        });
        
        console.log(`Total unique lapsed words: ${lapsedWords.size}`);
    } catch (error) {
        console.error('Error finding lapsed Russian words:', error);
    }
}

// Replace 'Russian' with the actual name of your Russian deck
const deckName = 'Russian';
findLapsedRussianWords(deckName);
