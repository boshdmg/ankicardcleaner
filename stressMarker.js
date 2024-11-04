const axios = require('axios');
const cheerio = require('cheerio');
const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { cleanRussianText, isSingleRussianWord } = require('./utils/russianUtils');

function hasStressMarks(text) {
    return /[́̀]/.test(text);
}

async function getStressedWordFromWiktionary(word) {
    const urls = [
        `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`,
        `https://en.wiktionary.org/wiki/${encodeURIComponent(word.toLowerCase())}`
    ];

    for (const url of urls) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            
            const headwordElement = $('span.headword-line strong.Cyrl.headword[lang="ru"]').first();
            
            if (headwordElement.length > 0) {
                const stressedWord = headwordElement.text();
                
                if (stressedWord && stressedWord.toLowerCase() !== word.toLowerCase()) {
                    return stressedWord;
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
               // console.log(`404 error for URL: ${url}`);
            } else {
                console.error(`Error fetching stressed word for "${word}":`, error.message);
            }
        }
    }
    return word;
}

async function updateCardsWithStressMarks(deckName) {
    try {
        const noteIds = await invokeAnkiConnect('findNotes', { query: `deck:"${deckName}"` });
        
        for (const noteId of noteIds) {
            const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [noteId] });
            
            if (noteInfo.fields.Russian) {
                const russianField = noteInfo.fields.Russian.value;
                const cleanedWord = cleanRussianText(russianField);
                
                if (isSingleRussianWord(cleanedWord) && !hasStressMarks(russianField)) {
                    try {
                        const stressedWord = await getStressedWordFromWiktionary(cleanedWord);
                        
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
