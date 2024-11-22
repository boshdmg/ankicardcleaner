const { invokeAnkiConnect } = require('./utils/ankiConnect');

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

async function findSuspendedRussianWords(deckName) {
    try {
        const cardIds = await invokeAnkiConnect('findCards', { 
            query: `deck:"${deckName}" is:suspended` 
        });
        
        const cardsInfo = await invokeAnkiConnect('cardsInfo', { cards: cardIds });
        
        const suspendedWords = new Set(); // Use Set for unique words
        for (const card of cardsInfo) {
            const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [card.note] });
            if (noteInfo.fields.Russian) {
                // Remove HTML tags and trim whitespace
                const cleanWord = noteInfo.fields.Russian.value
                    .replace(/<[^>]*>/g, '')
                    .trim();
                
                // Only add if it's a single word (no spaces)
                if (!cleanWord.includes(' ')) {
                    suspendedWords.add(cleanWord);
                }
            }
        }
        
        // Print the suspended single words
        console.log('Suspended Russian single words:');
        suspendedWords.forEach(word => {
            console.log(`${word}`);
        });
        
        console.log(`Total unique suspended single words: ${suspendedWords.size}`);
    } catch (error) {
        console.error('Error finding suspended Russian words:', error);
    }
}

// Replace 'Russian' with the actual name of your Russian deck
const deckName = 'Russian';
//findLapsedRussianWords(deckName);
findSuspendedRussianWords(deckName);
