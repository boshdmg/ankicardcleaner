const fs = require('fs').promises;
const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { newWordsWithDeepSeek } = require('./utils/deepseek');
const { NEW_WORDS_PROMPT } = require('./prompts');

async function createNewCards() {
    try {
        const words = await fs.readFile('newWords.txt', 'utf-8');
        const wordList = words.split('\n').filter(Boolean).map(word => word.trim());
        
        for (const word of wordList) {

            const aiResponse = await newWordsWithDeepSeek(word, NEW_WORDS_PROMPT);

            if (!aiResponse.english || !aiResponse.russian) {
                console.log(`Skipping ${word} because the response was not valid`);
                continue;
            }

            console.log(aiResponse);

            if (aiResponse.is_sentence) {
                await invokeAnkiConnect('addNote', {
                    note: {
                        deckName: 'Russian',
                        modelName: 'Russian One Sided',
                        fields: {
                            Front: aiResponse.english,
                            Back: aiResponse.russian,
                            AIProcessed: '1'
                        },
                        options: {
                            allowDuplicate: false,
                            duplicateScope: 'deck',
                        },
                        tags: ['auto_added', 'sentence'],
                    }
                });
            }
            else {
                await invokeAnkiConnect('addNote', {
                    note: {
                        deckName: 'Russian',
                        modelName: 'Russian Learning-5e5e4',
                        fields: {
                            Russian: aiResponse.russian,
                            'Russian without stress': aiResponse.russian_without_stress,
                            English: aiResponse.english,
                            'Related Words': aiResponse.related_words,
                            Sentence: aiResponse.sentence,
                            Synonym: aiResponse.synonym,
                            AIProcessed: '1'
                        },
                        options: {
                            allowDuplicate: false,
                            duplicateScope: 'deck',
                        },
                        tags: ['auto_added'],
                    }
                });
            }
                
            console.log(`Added new card for "${word}" with translation "${aiResponse.russian}"`);
        }
        
        console.log('Finished creating new cards');
    } catch (error) {
        console.error('Error creating new cards:', error);
    }
}

createNewCards();
