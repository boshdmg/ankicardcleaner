const axios = require('axios');
const cheerio = require('cheerio');
const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { cleanRussianText, isSingleRussianWord } = require('./utils/russianUtils');
const { getStress } = require('./utils/wiktionaryUtils');

function hasStressMarks(text) {
    const russianVowels = /[аеёиоуыэюяАЕЁИОУЫЭЮЯ]/g;
    const stressMarks = /[́̀]/;
    const hasYo = /[ёЁ]/;
    
    // Return true if:
    // 1. There are stress marks, or
    // 2. There is exactly one Russian vowel, or
    // 3. The text contains ё/Ё
    const vowelMatches = text.match(russianVowels) || [];
    return stressMarks.test(text) || vowelMatches.length === 1 || hasYo.test(text);
}

async function updateCardsWithStressMarks(deckName) {
    try {
        const noteIds = await invokeAnkiConnect('findNotes', { query: `deck:"${deckName}"` });
        
        console.log(`Found ${noteIds.length} notes in deck "${deckName}"`);
        
        for (const noteId of noteIds) {
            const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [noteId] });
            
            if (noteInfo.fields.Russian) {
                const russianField = noteInfo.fields.Russian.value;
                const cleanedWord = cleanRussianText(russianField);
                
                if (isSingleRussianWord(cleanedWord) && !hasStressMarks(russianField)) {
                    try {
                        const stressedWord = await getStress(cleanedWord);
                        
                        console.log(`Stressed word for "${cleanedWord}": "${stressedWord}"`);
                        
                        if (stressedWord && stressedWord !== cleanedWord) {
                            await invokeAnkiConnect('updateNoteFields', {
                                note: {
                                    id: noteId,
                                    fields: {
                                        Russian: stressedWord
                                    }
                                }
                            });
                            console.log(`Updated "${cleanedWord}" to "${stressedWord}"`);
                        } 

                    } catch (error) {
                        console.error(`Error processing "${cleanedWord}":`, error.message);
                    }
                } else if (hasStressMarks(russianField)) {
                    //console.log(`Skipped "${russianField}" as it already has stress marks`);
                }
            }
        }
        
        console.log('Finished updating cards with stress marks');
    } catch (error) {
        console.error('Error updating cards with stress marks:', error);
    }
}

const deckName = 'Russian';
updateCardsWithStressMarks(deckName);
