const axios = require('axios');

async function invokeAnkiConnect(action, params = {}) {
    try {
        const response = await fetch('http://localhost:8765', {
            method: 'POST',
            body: JSON.stringify({ action, version: 6, params }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseJson = await response.json();
        if (responseJson.error) {
            throw new Error(responseJson.error);
        }
        return responseJson.result;
    } catch (error) {
        console.error(`AnkiConnect error: ${error.message}`);
        throw error;
    }
}

module.exports = { invokeAnkiConnect }; 