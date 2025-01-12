const axios = require('axios');
const cheerio = require('cheerio');
const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { cleanRussianText, isSingleRussianWord } = require('./utils/russianUtils');
const { getStress } = require('./utils/wiktionaryUtils');
const { stripWhitespace, hasStressMarks } = require('./utils/textCleaner');

async function processRussianDeck(deckName, options = { addStressMarks: true, cleanCards: true, checkSpelling: false}) {
    try {
        const noteIds = await invokeAnkiConnect('findNotes', { query: `deck:"${deckName}"` });
        console.log(`Found ${noteIds.length} notes in deck "${deckName}"`);
        
        for (const noteId of noteIds) {
            const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [noteId] });

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
            
            if (!noteInfo.fields.Russian) continue;
            
            const russianField = noteInfo.fields.Russian.value;
            let updatedField = russianField;
            let shouldUpdate = false;
            
            // Add or update 'Russian without stress' field
            if (!noteInfo.fields['Russian without stress'] || 
                noteInfo.fields['Russian without stress'].value !== cleanRussianText(russianField)) {
                shouldUpdate = true;
            }
            
            // Clean cards if option enabled
            if (options.cleanCards) {
                const cleanedText = stripWhitespace(russianField);
                if (cleanedText !== russianField) {
                    updatedField = cleanedText;
                    shouldUpdate = true;
                }
            }

            if (options.checkSpelling) {
                // Check if Russian field exists and check spelling
                if (noteInfo.fields.Russian) {
                const russianField = noteInfo.fields.Russian.value;
             
                    // Check spelling
                    // const spellingResult = await checkSpelling(russianField);
                    // if (spellingResult.matches && spellingResult.matches.length > 0) {
                    //     console.log(`Spelling issues found in note ${noteId}:`, spellingResult.matches);
                    //     // You could choose to automatically correct the spelling or flag the card for review
                }
            }
            
            // Add stress marks if option enabled
            if (options.addStressMarks) {
                const cleanedWord = cleanRussianText(updatedField);
                
                if (isSingleRussianWord(cleanedWord) && !hasStressMarks(updatedField)) {
                    try {
                        const stressedWord = await getStress(cleanedWord);
                        
                        if (stressedWord && stressedWord !== cleanedWord) {
                            updatedField = stressedWord;
                            shouldUpdate = true;
                            console.log(`Adding stress marks: "${cleanedWord}" → "${stressedWord}"`);
                        }
                    } catch (error) {
                        console.error(`Error processing "${cleanedWord}":`, error.message);
                    }
                }
            }
            
            // Update the note if changes were made
            if (shouldUpdate) {
                try {
                    await invokeAnkiConnect('updateNoteFields', {
                        note: {
                            id: noteId,
                            fields: {
                                Russian: updatedField,
                                'Russian without stress': cleanRussianText(updatedField)
                            }
                        }
                    });
                    console.log(`Updated note ${noteId}`);
                } catch (error) {
                    console.error(`Error updating note ${noteId}:`, error.message);
                }
            }
        }
        
        console.log('Finished processing deck');
    } catch (error) {
        console.error('Error processing deck:', error);
    }
}

// Example usage:
const deckName = 'Russian';
processRussianDeck(deckName, {
    addStressMarks: true,
    cleanCards: true
});
