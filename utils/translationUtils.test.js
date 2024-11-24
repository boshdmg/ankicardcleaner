const { getEnglishTranslation } = require('./translationUtils');
const axios = require('axios');

jest.mock('axios');

describe('getEnglishTranslation', () => {
    // Mock console.error once before all tests
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    // Clean up after all tests are done
    afterAll(() => {
        console.error.mockRestore();
    });

    test('returns translation when successful', async () => {
        const mockResponse = {
            data: {
                responseStatus: 200,
                responseData: {
                    translatedText: 'hello'
                }
            }
        };
        
        axios.get.mockResolvedValueOnce(mockResponse);
        
        const result = await getEnglishTranslation('привет');
        expect(result).toBe('hello');
    });

    test('returns null when translation fails', async () => {
        const mockResponse = {
            data: {
                responseStatus: 403,
                responseData: {
                    translatedText: ''
                }
            }
        };
        
        axios.get.mockResolvedValueOnce(mockResponse);
        
        const result = await getEnglishTranslation('привет');
        expect(result).toBe(null);
    });

    test('returns null when network error occurs', async () => {
        axios.get.mockRejectedValueOnce(new Error('Network error'));
        
        const result = await getEnglishTranslation('привет');
        expect(result).toBe(null);
    });
}); 