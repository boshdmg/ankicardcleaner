const axios = require('axios');
const { invokeAnkiConnect } = require('./utils/ankiConnect');
const fs = require('fs').promises;
const path = require('path');
const { cleanRussianText, isSingleRussianWord } = require('./utils/russianUtils');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to download audio from Wiktionary
async function downloadWiktionaryAudio(word, outputDir) {
    await sleep(100);
    const cleanWord = cleanRussianText(word);
    
    const wordForms = [cleanWord, cleanWord.toLowerCase()];
    
    for (const wordForm of wordForms) {
        const url = `https://ru.wiktionary.org/wiki/${encodeURIComponent(wordForm)}`;
        
        try {
            const response = await axios.get(url);
            
            const audioRegex = /<source src="(\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+\.ogg)"/;
            const match = response.data.match(audioRegex);
            
            if (match && match[1]) {
                const audioUrl = `https:${match[1]}`;
                const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                const fileName = `${cleanWord}.ogg`;
                const filePath = path.join(outputDir, fileName);
                await fs.writeFile(filePath, audioResponse.data);
                console.log(`Audio downloaded for "${cleanWord}"`);
                return filePath;
            }
        } catch (error) {
            // Only log detailed error if it's not a 404
            if (error.response?.status !== 404) {
                console.error(`Error accessing Wiktionary for "${wordForm}":`, error.message);
            }
            continue;
        }
    }
    
    console.log(`No audio found for any form of "${cleanWord}"`);
    return null;
}

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
                if (noteInfo.fields.Russian && 
                    (!noteInfo.fields['Russian Sound'] || !noteInfo.fields['Russian Sound'].value) &&
                    isSingleRussianWord(noteInfo.fields.Russian.value)) {
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
                            
                            console.log(`Updated 'Russian sound' field for note ${card.note} with ${audioFilename}`);
                            
                            // Add the file to Anki's media collection
                            const fileContent = await fs.readFile(audioPath);
                            await invokeAnkiConnect('storeMediaFile', {
                                filename: audioFilename,
                                data: fileContent.toString('base64')
                            });
                            
                            console.log(`Added ${audioFilename} to Anki's media collection`);
                        } catch (error) {
                            console.error(`Error processing audio file ${audioPath}:`, error.message);
                        }
                    } else {
                        console.log(`No audio found for note ${card.note}`);
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
