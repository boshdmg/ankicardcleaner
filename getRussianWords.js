const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { cleanRussianText, isSingleRussianWord } = require('./utils/russianUtils');

async function getAllRussianWords(deckName) {
    try {
        const noteIds = await invokeAnkiConnect('findNotes', {
            query: `deck:"${deckName}"`
        });

        const notes = await invokeAnkiConnect('notesInfo', {
            notes: noteIds
        });

        const russianWords = notes
            .map(note => note.fields.Russian?.value)
            .filter(word => word)
            .map(word => cleanRussianText(word))
            .filter(word => !word.includes(' '))
            .filter(word => isSingleRussianWord(word))
            .sort();

        const uniqueWords = [...new Set(russianWords)];

        console.log('\nAll unique single Russian words:');
        console.log('------------------------');
        uniqueWords.forEach(word => {
            console.log(word);
        });

        console.log('------------------------');
        console.log(`Total unique single words: ${uniqueWords.length}`);

        return uniqueWords;
    } catch (error) {
        console.error('Error getting Russian words:', error);
        return [];
    }
}

const deckName = 'Russian';
getAllRussianWords(deckName).catch(console.error);