require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { RUSSIAN_ANALYSIS_PROMPT, RUSSIAN_ANALYSIS_PROMPT_ONE_SIDED } = require('./prompts');
const { invokeAnkiConnect } = require('./utils/ankiConnect');
const { isSingleRussianWord, cleanRussianText } = require('./utils/russianUtils');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function enhanceWithDeepSeek(russian, english, prompt) {
    try {
        const response = await axios.post(DEEPSEEK_API_URL, {
            model: "deepseek-chat",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                {
                    role: "user",
                    content: `Analyze this card. Front: ${russian}, Back: ${english}`
                }
            ],
            temperature: 1.3
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
      
        const content = response.data.choices[0].message.content;
      
        const jsonStr = content.replace(/```json\n|\n```/g, '');
        console.log("jsonStr", jsonStr);
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('DeepSeek enhancement failed:', error);
        console.error('Raw response:', error.response?.data);
        return null;
    }
}
//https://en.wiktionary.org/wiki/File:Ru-%D1%88%D0%B8%D1%80%D0%BE%D0%BA%D0%B8%D0%B9.ogg

async function processRussianDeck(deckName, options = { }) {
    try {
        const noteIds = await invokeAnkiConnect('findNotes', { 
            query: `deck:"${deckName}" -AIProcessed:1` 
        });
        console.log(`Found ${noteIds.length} unprocessed notes with Russian text in deck "${deckName}"`);
        
        for (const noteId of noteIds) {
            const [noteInfo] = await invokeAnkiConnect('notesInfo', { notes: [noteId] });

            if (noteInfo.modelName == "Russian One Sided")
            {
                const beenProcessd = noteInfo.fields.AIProcessed?.value;
                if (!beenProcessd) {
                    console.log("processing", noteInfo.fields.Front?.value, noteInfo.fields.Back?.value);
                    const frontField = noteInfo.fields.Front?.value;
                    const backField = noteInfo.fields.Back?.value;
                    const frontImage = noteInfo.fields['FrontImage']?.value;
                    const backImage = noteInfo.fields['BackImage']?.value;
                    const russianSound = noteInfo.fields['Russian Sound']?.value;
                    const enhancement = await enhanceWithDeepSeek(frontField,backField, RUSSIAN_ANALYSIS_PROMPT_ONE_SIDED);
                    console.log("enhancement", enhancement);

                    if (enhancement.skip == "true") {
                        console.log("Skipping card due to AI recommendation");
                        process.exit(0);
                    }
                    await invokeAnkiConnect('updateNoteFields', {
                        note: {
                            id: noteId,
                            fields: {
                                Front: enhancement.front,
                                Back: enhancement.back,
                                'FrontImage': frontImage ? frontImage : enhancement.front_image,
                                'BackImage': backImage ? backImage : enhancement.back_image,
                                'Russian Sound': russianSound ? russianSound : enhancement.found_sound,
                                AIProcessed: '1'
                            }
                        }
                    });
                }
            }
            
            if (noteInfo.modelName == 'Russian Learning-5e5e4') 
            {
                if (!noteInfo.fields.Russian) throw new Error("Russian field is missing");

                console.log("Note Type:", noteInfo.modelName);
                const russianField = noteInfo.fields.Russian?.value;
                const englishField = noteInfo.fields.English?.value;
                let withoutStressMarks = noteInfo.fields['Russian without stress']?.value;
                const pronunciation = noteInfo.fields.Pronunciation?.value;
                const beenProcessd = noteInfo.fields.AIProcessed?.value;
                                    
                if (isSingleRussianWord(russianField) && !withoutStressMarks) {

                    withoutStressMarks = cleanRussianText(russianField);
                }
                
                if (!beenProcessd) {
                    console.log("processing", russianField);
                    try {
                        const enhancement = await enhanceWithDeepSeek(russianField,englishField, RUSSIAN_ANALYSIS_PROMPT);
                        if (enhancement) {
                            console.log("enhancement", enhancement.russian);
                            console.log("enhancement", enhancement.english);
                            console.log("enhancement pronunciation", enhancement.pronunciation);
                            console.log("enhancement related words", enhancement.related_words);
                            console.log("enhancement sentence", enhancement.sentence);
                            console.log("enhancement synonym", enhancement.synonym);

                    

                            if(!enhancement.russian)
                            {
                                throw new Error("No Russian text found");
                                process.exit(0);
                            }

                            await invokeAnkiConnect('updateNoteFields', {
                                note: {
                                    id: noteId,
                                    fields: {
                                        Russian: enhancement.russian,
                                        English: enhancement.english,
                                        Pronunciation: pronunciation ? pronunciation : enhancement.pronunciation,
                                        'Russian without stress': withoutStressMarks,
                                        'Related Words': enhancement.related_words,
                                        Sentence: enhancement.sentence,
                                        Synonym: enhancement.synonym,
                                        AIProcessed: '1'
                                    }
                                }
                            });
                        }   
                    } catch (error) {
                        console.error(`Error getting AI enhancement for "${russianField}":`, error.message);
                    }
                }
            }
            
        }
        
        console.log('Finished processing deck');
    } catch (error) {
        console.error('Error processing deck:', error);
    }
}

//toto: not sure this option concept is needed
const deckName = 'Russian';
processRussianDeck(deckName, {
     addStressMarks: false,
     cleanCards: true,
     removeOldAutoAddedTags: false,
    // checkSpelling: false,
    unsuspendOldCards: false,
    aiEnhance: true  // Enable OpenAI enhancement for testing
});