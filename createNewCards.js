const fs = require('fs').promises;
const axios = require('axios');
const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { getEnglishTranslation } = require('./utils/translationUtils');

async function createNewCards() {
    try {
        const words = await fs.readFile('newWords.txt', 'utf-8');
        const wordList = words.split('\n').filter(Boolean).map(word => word.trim());
        
        for (const word of wordList) {
            let translation;
            
            if (word.includes(',')) {
                // If word contains comma, split and use second part as translation
                const [russianWord, englishTranslation] = word.split(',').map(part => part.trim());
                translation = englishTranslation;
            } else {
                // Otherwise get translation from API
                translation = await getEnglishTranslation(word);
            }
            
            if (translation) {
                const noteFields = {
                    Russian: word,
                    English: translation,
                };
                console.log(noteFields);
                
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
