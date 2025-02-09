const { invokeAnkiConnect } = require('./utils/ankiConnect');
const fs = require('fs').promises;
const path = require('path');
const { isSingleRussianWord } = require('./utils/russianUtils');
const { downloadWiktionaryAudio } = require('./utils/wiktionaryUtils');

// Function to find and process cards with high lapses and low interval
async function findHighLapseLowIntervalCards(deckName, outputDir) {
    try {
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Find all cards in the specified deck
        const cardIds = await invokeAnkiConnect('findCards', { query: `deck:"${deckName}"` });
        
        // Get card info for all cards
        const cardsInfo = await invokeAnkiConnect('cardsInfo', { cards: cardIds });
        
        // Filter and process cards
        for (const card of cardsInfo) {
            // Only process cards with lapse count > 7 and interval < 7 days
            if (card.lapses > 3 && card.interval < 14) {
                // Get note info for the card
                const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [card.note] });
                
                // Check if Russian field exists, Russian sound is empty, and it's a single Russian word
                if (noteInfo.fields.Russian && noteInfo.fields['Russian Sound'] && !noteInfo.fields['Russian Sound'].value && isSingleRussianWord(noteInfo.fields.Russian.value)) 
                {
                    
                    const russianField = noteInfo.fields.Russian.value;
                    
                    // Download audio
                    const audioPath = await downloadWiktionaryAudio(russianField, outputDir);
                    if (audioPath) {
                        // Check if the file exists
                        try {
                            await fs.access(audioPath);
                            
                            // Get the filename from the full path
                            const audioFilename = path.basename(audioPath);
                            
                            // Update the 'Russian sound' field with the audio filename
                            await invokeAnkiConnect('updateNoteFields', {
                                note: {
                                    id: card.note,
                                    fields: {
                                        'Russian Sound': `[sound:${audioFilename}]`
                                    }
                                }
                            });
                            
                            // Add the file to Anki's media collection
                            const fileContent = await fs.readFile(audioPath);
                            await invokeAnkiConnect('storeMediaFile', {
                                filename: audioFilename,
                                data: fileContent.toString('base64')
                            });

                            console.log(`Updated sound for  ${russianField} with ${audioFilename}`);
                           
                        } catch (error) {
                            console.error(`Error processing audio file ${audioPath}:`, error.message);
                        }
                    } else {
                        console.log(`No audio found for ${russianField}`);
                    }
                }
            }
        }
        
        console.log('Finished processing cards');
    } catch (error) {
        console.error('Error processing cards:', error);
    }
}

// Replace 'Your Deck Name' with the actual name of your Russian deck
const deckName = 'Russian';
const outputDir = path.join(__dirname, 'wiktionary_audio');
findHighLapseLowIntervalCards(deckName, outputDir);
