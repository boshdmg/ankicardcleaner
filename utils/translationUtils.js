const axios = require('axios');

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

module.exports = {
    getEnglishTranslation
}; 