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

           
           //REMOVE LEECH TAG
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


            // REMOVE SPACES AND HTML TAGS
            if (options.cleanCards) {
                const cleanedText = stripWhitespace(russianField);
                if (cleanedText !== russianField) {
                    updatedField = cleanedText;
                    shouldUpdate = true;
                    console.log(`Removed spaces and HTML tags from ${russianField}`);
                }
            }
            
            // Add or update 'Russian without stress' field
            if (!noteInfo.fields['Russian without stress'] || 
                noteInfo.fields['Russian without stress'].value !== cleanRussianText(russianField).toLowerCase()) {
                
                    try {
                        await invokeAnkiConnect('updateNoteFields', {
                            note: {
                                id: noteId,
                                fields: {
                                    'Russian without stress': cleanRussianText(updatedField).toLowerCase()
                                }
                            }
                        });
                        console.log(`Set ${russianField} stressless field => ${cleanRussianText(russianField).toLowerCase()}`);
                    } catch (error) {
                        console.error(`Error updating note ${noteId}:`, error.message);
                    }
               
            }
            
            // ADD STRESS MARKS
            if (options.addStressMarks) {
                const cleanedWord = cleanRussianText(updatedField);
                
                if (isSingleRussianWord(cleanedWord) && !hasStressMarks(updatedField)) {
                    try {
                        const stressedWord = await getStress(cleanedWord);
                        
                        if (stressedWord && stressedWord !== cleanedWord) {
                            updatedField = stressedWord;
                            try {
                                await invokeAnkiConnect('updateNoteFields', {
                                    note: {
                                        id: noteId,
                                        fields: {
                                            Russian: updatedField,
                                        }
                                    }
                                });
                                console.log(`Updated ${updatedField}`);
                            } catch (error) {
                                console.error(`Error updating note ${noteId}:`, error.message);
                            }



                            console.log(`Adding stress marks: "${cleanedWord}" → "${stressedWord}"`);
                        }
                    } catch (error) {
                        console.error(`Error processing "${cleanedWord}":`, error.message);
                    }
                }
            }

            
            // REMOVE AUTO_ADDED TAG IF CARD IS OLD ENOUGH
            if (options.removeOldAutoAddedTags) {
                const cardInfo = await invokeAnkiConnect('cardsInfo', {
                    cards: [noteInfo.cards[0]]  // Get info for first card of note
                });
                
                if (cardInfo && cardInfo[0]) {
                    const firstReviewTime = cardInfo[0].first;  // Unix timestamp of first review
                    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                    
                    if (firstReviewTime < oneMonthAgo && noteInfo.tags.includes('auto_added')) {
                        try {
                            await invokeAnkiConnect('removeTags', {
                                notes: [noteId],
                                tags: "auto_added"
                            });
                            console.log(`Removed auto_added tag from  ${russianField}`);
                        } catch (error) {
                            console.error(`Error removing auto_added tag from note ${noteId}:`, error.message);
                        }
                    }
                }
            }

            // UNSUSPEND OLD SUSPENDED CARDS
            if (options.unsuspendOldCards) {
                const cardInfo = await invokeAnkiConnect('cardsInfo', {
                    cards: [noteInfo.cards[0]]  // Get info for first card of note
                });
                
                if (cardInfo && cardInfo[0] && cardInfo[0].queue === -1) { // -1 indicates suspended
                    const lastReviewTime = cardInfo[0].rmod; // Last review timestamp
                    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
                    
                    if (lastReviewTime < sixMonthsAgo) {
                        try {
                            await invokeAnkiConnect('suspend', {
                                cards: [noteInfo.cards[0]],
                                suspend: false
                            });
                            console.log(`Unsuspended card for ${russianField} after 6 months`);
                        } catch (error) {
                            console.error(`Error unsuspending card ${noteInfo.cards[0]}:`, error.message);
                        }
                    }
                }
            }
sj
        }
        
        console.log('Finished processing deck');
    } catch (error) {
        console.error('Error processing deck:', error);
    }
}

//toto: not sure this option concept is needed
const deckName = 'Russian';
processRussianDeck(deckName, {
     addStressMarks: true,
     cleanCards: true,
     removeOldAutoAddedTags: true,
    unsuspendOldCards: true
});
