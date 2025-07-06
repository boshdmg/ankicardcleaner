const fs = require('fs').promises;
const axios = require('axios');
const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { getEnglishTranslation } = require('./utils/translationUtils');
const { getStress } = require('./utils/wiktionaryUtils');
const { cleanRussianText } = require('./utils/russianUtils');
const { newWordsWithDeepSeek } = require('./utils/deepseek');
const { NEW_WORDS_PROMPT } = require('./prompts');

async function createNewCards() {
    try {
        const words = await fs.readFile('newWords.txt', 'utf-8');
        const wordList = words.split('\n').filter(Boolean).map(word => word.trim());
        
        for (const word of wordList) {

            const aiResponse = await newWordsWithDeepSeek(word, NEW_WORDS_PROMPT);

            if (word.includes('|')) {
                // Split into Russian and English parts
                const [rusText, englishText] = word.split('').map(part => part.trim());
                
                if (!rusText) {
                    throw new Error(`Missing Russian text for entry: ${word}`);
                }

                // Check if it's a sentence (contains spaces)
                if (rusText.includes(' ')) {
                    
                    // Create a one-sided card for sentences
                    // await invokeAnkiConnect('addNote', {
                    //     note: {
                    //         deckName: 'Russian',
                    //         modelName: 'Russian One Sided',
                    //         fields: {
                    //             Front: englishText,
                    //             Back: rusText
                    //         },
                    //         options: {
                    //             allowDuplicate: false,
                    //             duplicateScope: 'deck',
                    //         },
                    //         tags: ['auto_added', 'sentence'],
                    //     }
                    // });
                    console.log(`Added new sentence card: "${englishText}" -> "${rusText}"`);
                    continue;
                } 
            } 

            const noteFields = {
                Russian: aiResponse.russian,
                'Russian without stress': aiResponse.russian_without_stress,
                English: aiResponse.english,
                'Related Words': aiResponse.related_words,
                Sentence: aiResponse.sentence,
                Synonym: aiResponse.synonym,
                AIProcessed: '1'
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
            
            console.log(`Added new card for "${word}" with translation "${noteFields.Russian}"`);
        }
        
        console.log('Finished creating new cards');
    } catch (error) {
        console.error('Error creating new cards:', error);
    }
}

createNewCards();
