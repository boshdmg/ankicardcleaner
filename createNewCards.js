const fs = require('fs').promises;
const axios = require('axios');

async function invokeAnkiConnect(action, params = {}) {
    try {
        const response = await axios.post('http://localhost:8765', {
            action,
            version: 6,
            params
        });
        
        if (response.data.error) {
            throw new Error(response.data.error);
        }
        return response.data.result;
    } catch (error) {
        console.error(`AnkiConnect error: ${error.message}`);
        throw error;
    }
}

async function getEnglishTranslation(word) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=ru|en`;
        const response = await axios.get(url);

        if (response.data.responseStatus === 200) {
            return response.data.responseData.translatedText;
        } else {
            console.error(`Translation error for "${word}": ${response.data.responseStatus}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching translation for "${word}":`, error.message);
        return null;
    }
}

async function createNewCards() {
    try {
        const words = await fs.readFile('newWords.txt', 'utf-8');
        const wordList = words.split('\n').filter(Boolean).map(word => word.trim());
        
        for (const word of wordList) {
            const translation = await getEnglishTranslation(word);
            
            if (translation) {
                const noteFields = {
                    Russian: word,
                    English: translation,
                };
                
                await invokeAnkiConnect('addNote', {
                    note: {
                        deckName: 'Russian',
                        modelName: 'Russian Learning-5e5e4',
                        fields: noteFields,
                        options: {
                            allowDuplicate: false,
                            duplicateScope: 'deck',
                        },
                        tags: ['auto_added'],
                    }
                });
                
                console.log(`Added new card for "${word}" with translation "${translation}"`);
            } else {
                console.log(`Skipped "${word}" due to missing translation`);
            }
        }
        
        console.log('Finished creating new cards');
    } catch (error) {
        console.error('Error creating new cards:', error);
    }
}

createNewCards();
