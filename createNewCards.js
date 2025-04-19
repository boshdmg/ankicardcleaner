const fs = require('fs').promises;
const axios = require('axios');
const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { getEnglishTranslation } = require('./utils/translationUtils');
const { getStress } = require('./utils/wiktionaryUtils');
const { cleanRussianText } = require('./utils/russianUtils');

async function createNewCards() {
    try {
        const words = await fs.readFile('newWords.txt', 'utf-8');
        const wordList = words.split('\n').filter(Boolean).map(word => word.trim());
        
        for (const word of wordList) {
            if (word.includes(',')) {
                // Split into Russian and English parts
                const [rusText, englishText] = word.split(',').map(part => part.trim());
                
                if (!rusText) {
                    throw new Error(`Missing Russian text for entry: ${word}`);
                }

                // Check if it's a sentence (contains spaces)
                if (rusText.includes(' ')) {
                    // Create a one-sided card for sentences
                    await invokeAnkiConnect('addNote', {
                        note: {
                            deckName: 'Russian',
                            modelName: 'Russian One Sided',
                            fields: {
                                Front: englishText,
                                Back: rusText
                            },
                            options: {
                                allowDuplicate: false,
                                duplicateScope: 'deck',
                            },
                            tags: ['auto_added', 'sentence'],
                        }
                    });
                    console.log(`Added new sentence card: "${englishText}" -> "${rusText}"`);
                } else {
                    // Handle single words as before
                    let russianWord = rusText;
                    // Add stress marks if not already present
                    if (!russianWord.includes('́')) {
                        const stressedWord = await getStress(russianWord);
                        if (stressedWord) {
                            russianWord = stressedWord;
                        }
                    }
                    
                    const noteFields = {
                        Russian: russianWord,
                        'Russian without stress': cleanRussianText(russianWord),
                        English: englishText,
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
                    console.log(`Added new word card for "${russianWord}" with translation "${englishText}"`);
                }
            } else {
                let translation;
                let russianWord;
                
                if (word.includes(',')) {
                    // If word contains comma, split and use second part as translation
                    const [rusWord, englishTranslation] = word.split(',').map(part => part.trim());
                    russianWord = rusWord;
                    translation = englishTranslation;
                } else {
                    russianWord = word;
                    translation = await getEnglishTranslation(word);
                }

                // Add stress marks if not already present
                if (!russianWord.includes('́')) {
                    const stressedWord = await getStress(russianWord);
                    if (stressedWord) {
                        russianWord = stressedWord;
                    }
                }
                
                if (translation) {
                    const noteFields = {
                        Russian: russianWord,
                        'Russian without stress': cleanRussianText(russianWord),
                        English: translation,
                    };
                    //console.log(noteFields);
                    
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
        }
        
        console.log('Finished creating new cards');
    } catch (error) {
        console.error('Error creating new cards:', error);
    }
}

createNewCards();
