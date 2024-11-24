/**
 * Strips whitespace and removes HTML tags except for allowed ones
 * @param {string} text - The text to clean
 * @returns {string} - The cleaned text
 */
function stripWhitespace(text) {
    const stripped = text
        .replace(/^(&nbsp;|\s)+|(&nbsp;|\s)+$/g, '')  // Remove leading and trailing whitespace, including &nbsp;
        .replace(/<(?!\/?(?:u|b|br|strong|img|div)\b)[^>]+>/g, '')  // Remove all HTML tags except <u>, <b>, <br>, <img>, <div>, and <strong>
        .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
        .trim();  // Trim any remaining whitespace

    return stripped || text;  // Return the stripped text if non-empty, otherwise return the original text
}

function hasStressMarks(text) {
    const russianVowels = /[аеёиоуыэюяАЕЁИОУЫЭЮЯ]/g;
    const stressMarks = /[́̀]/;
    const hasYo = /[ёЁ]/;
    
    // Return true if:
    // 1. There are stress marks, or
    // 2. There is exactly one Russian vowel, or
    // 3. The text contains ё/Ё
    const vowelMatches = text.match(russianVowels) || [];
    return stressMarks.test(text) || vowelMatches.length === 1 || hasYo.test(text);
}

module.exports = {
    stripWhitespace,
    hasStressMarks
}; 