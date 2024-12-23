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
        
        // Create array to store word-lapse pairs
        const suspendedWordsWithLapses = [];
        
        for (const card of cardsInfo) {
            const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [card.note] });
            if (noteInfo.fields.Russian) {
                const cleanWord = noteInfo.fields.Russian.value
                    .replace(/<[^>]*>/g, '')
                    .trim();
                
                suspendedWordsWithLapses.push({
                    word: cleanWord,
                    lapses: card.lapses
                });
            }
        }
        
        // Sort by lapses (descending) and get top 10
        const top10Words = suspendedWordsWithLapses
            .sort((a, b) => b.lapses - a.lapses)
            .slice(0, 30);
        
        // Print the top 10 suspended words with their lapse counts
        console.log('Top 10 suspended Russian words by lapses:');
        top10Words.forEach((item, index) => {
            console.log(`${item.word}`);
        });
        
    } catch (error) {
        console.error('Error finding suspended Russian words:', error);
    }
}

// Replace 'Russian' with the actual name of your Russian deck
const deckName = 'Russian';
//findLapsedRussianWords(deckName);
findSuspendedRussianWords(deckName);
