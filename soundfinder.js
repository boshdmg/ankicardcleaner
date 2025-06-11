const { invokeAnkiConnect } = require('./utils/ankiConnect');
const fs = require('fs').promises;
const path = require('path');
const { isSingleRussianWord } = require('./utils/russianUtils');
const { downloadWiktionaryAudio } = require('./utils/wiktionaryUtils');

async function findSounds(deckName, outputDir) {
    try {
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Find all cards in the specified deck
        const cardIds = await invokeAnkiConnect('findCards', { query: `deck:"${deckName}" "Russian Sound:" prop:lapses>10` });
        console.log(`Found ${cardIds.length} cards with empty Russian Sound field and more than 10 lapses in deck "${deckName}"`);
        
    
        const cardsInfo = await invokeAnkiConnect('cardsInfo', { cards: cardIds });
        
        const targetNotes = cardsInfo.map(card => card.note);

        // Batch fetch all notes information
        console.log(`Processing ${targetNotes.length} cards that meet criteria...`);
        const notesInfo = await invokeAnkiConnect('notesInfo', { notes: targetNotes });
        
        let processed = 0;
        // Process notes in parallel with a limit of 5 concurrent operations
        const batchSize = 5;
        for (let i = 0; i < notesInfo.length; i += batchSize) {
            const batch = notesInfo.slice(i, i + batchSize);
            await Promise.all(batch.map(async (noteInfo) => {
                try {
                    if (noteInfo.fields.Russian && 
                        noteInfo.fields['Russian Sound'] && 
                        !noteInfo.fields['Russian Sound'].value && 
                        isSingleRussianWord(noteInfo.fields.Russian.value)) 
                    {
                        const russianField = noteInfo.fields.Russian.value;
                        
                        // Download audio
                        const audioPath = await downloadWiktionaryAudio(russianField, outputDir);
                        if (audioPath) {
                            try {
                                await fs.access(audioPath);
                                const audioFilename = path.basename(audioPath);
                                const fileContent = await fs.readFile(audioPath);
                                
                                // Store media file
                                await invokeAnkiConnect('storeMediaFile', {
                                    filename: audioFilename,
                                    data: fileContent.toString('base64')
                                });

                                // Update note
                                await invokeAnkiConnect('updateNoteFields', {
                                    note: {
                                        id: noteInfo.noteId,
                                        fields: {
                                            'Russian Sound': `[sound:${audioFilename}]`
                                        }
                                    }
                                });

                                console.log(`✓ Updated sound for ${russianField} with ${audioFilename}`);
                            } catch (error) {
                                console.error(`✗ Error processing audio for ${russianField}:`, error.message);
                            }
                        } else {
                            console.log(`- No audio found for ${russianField}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing note:`, error);
                }
                processed++;
                console.log(`Progress: ${processed}/${notesInfo.length} (${Math.round(processed/notesInfo.length*100)}%)`);
            }));
        }
        
        console.log('Finished processing all cards');
    } catch (error) {
        console.error('Error processing cards:', error);
    }
}

// Replace 'Your Deck Name' with the actual name of your Russian deck
const deckName = 'Russian';
const outputDir = path.join(__dirname, 'wiktionary_audio');
findSounds(deckName, outputDir);
