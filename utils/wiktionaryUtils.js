const axios = require('axios');
const cheerio = require('cheerio');

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

module.exports = {
    getStress
}; 