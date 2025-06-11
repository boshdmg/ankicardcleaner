// Function to clean up the Russian text
function cleanRussianText(text) {
    if (typeof text !== 'string') {
        throw new Error('Input must be a string');
    }

    return text
        .replace(/<[^>]*>/g, '') // Remove HTML tag
        .replace(/\([^)]*\)/g, '') // Remove parentheses and their contents
        .replace(/[́̀]/g, '') // Remove stress marks
        .replace(/\s*\/\s*/g, ' ') // Replace slashes with spaces
        .trim(); // Remove leading and trailing whitespace
}

// Function to check if the text is a single Russian word
function isSingleRussianWord(text) {
    const cleanedText = cleanRussianText(text);
    // Check if the cleaned text contains only Cyrillic characters and no spaces
    return /^[\u0400-\u04FF]+$/.test(cleanedText);
}

module.exports = {
    cleanRussianText,
    isSingleRussianWord
}; 