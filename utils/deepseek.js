require('dotenv').config();
const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Enhances Russian language learning cards using DeepSeek AI
 * @param {string} russian - The Russian text to analyze
 * @param {string} english - The English translation
 * @param {string} prompt - The system prompt to guide the AI
 * @returns {Promise<Object|null>} The enhanced card data or null if enhancement fails
 */
async function enhanceWithDeepSeek(russian, english, prompt) {
    if (!DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
    }

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
        console.log("DeepSeek response", jsonStr);
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('DeepSeek enhancement failed:', error);
        console.error('Raw response:', error.response?.data);
        return null;
    }
}

async function newWordsWithDeepSeek(word, prompt) {
    if (!DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
    }

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
     //  response_format: { type: "json_object" },
        model: "deepseek-chat",
        messages: [
            {
                role: "system",
                content: prompt
            },
            {
                role: "user",
                content: word
            }
        ],  
        temperature: 1.3
    }, {
        headers: {
            'Authorization': `Bearer sk-6d4860e431e043d0ab9a4cc3d0098b16`,
            'Content-Type': 'application/json'
        }   
    });
    const content = response.data.choices[0].message.content;
    const jsonStr = content.replace(/```json\n|\n```/g, '');
    
    return JSON.parse(jsonStr);
}

module.exports = {
    enhanceWithDeepSeek,
    newWordsWithDeepSeek
}; 