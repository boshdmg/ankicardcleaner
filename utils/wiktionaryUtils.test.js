const { getStress } = require('./wiktionaryUtils');
const axios = require('axios');

jest.mock('axios');

describe('getStress', () => {
    // Spy on console.error before tests
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    // Restore console.error after tests
    afterEach(() => {
        console.error.mockRestore();
    });

    test('returns stressed word when found', async () => {
        const mockHtml = `
            <html>
                <span class="headword-line">
                    <strong class="Cyrl headword" lang="ru">слóво</strong>
                </span>
            </html>
        `;
        
        axios.get.mockResolvedValueOnce({ data: mockHtml });
        
        const result = await getStress('слово');
        expect(result).toBe('слóво');
    });

    test('returns original word when no stress found', async () => {
        const mockHtml = '<html><body>No stress marks here</body></html>';
        axios.get.mockResolvedValueOnce({ data: mockHtml });
        
        const result = await getStress('тест');
        expect(result).toBe('тест');
    });

    test('handles 404 errors gracefully', async () => {
        axios.get.mockRejectedValueOnce({ 
            response: { status: 404 }
        });
        
        const result = await getStress('несуществующееслово');
        expect(result).toBe('несуществующееслово');
    });
}); 