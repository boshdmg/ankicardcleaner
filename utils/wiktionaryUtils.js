const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { cleanRussianText } = require('./russianUtils');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getStress(word) {
    const urls = [
        `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`,
        `https://en.wiktionary.org/wiki/${encodeURIComponent(word.toLowerCase())}`
    ];

    for (const url of urls) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            
            const headwordElement = $('span.headword-line strong.Cyrl.headword[lang="ru"]').first();
            
            if (headwordElement.length > 0) {
                const stressedWord = headwordElement.text();
                
                if (stressedWord && stressedWord.toLowerCase() !== word.toLowerCase()) {
                    return stressedWord;
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
               // console.log(`404 error for URL: ${url}`);
            } else {
                console.error(`Error fetching stressed word for "${word}":`, error.message);
            }
        }
    }
    return word;
}

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
    
    return null;
}

module.exports = {
    getStress,
    downloadWiktionaryAudio
}; 