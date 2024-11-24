const { cleanRussianText } = require('./russianUtils');

describe('cleanRussianText', () => {
    test('removes HTML tags', () => {
        const input = '<div>привет</div>';
        expect(cleanRussianText(input)).toBe('привет');
    });

    test('removes parentheses and their contents', () => {
        const input = 'слово (pronunciation)';
        expect(cleanRussianText(input)).toBe('слово');
    });

    test('removes stress marks', () => {
        const input = 'приве́т';
        expect(cleanRussianText(input)).toBe('привет');
    });

    test('replaces slashes with spaces', () => {
        const input = 'привет/пока';
        expect(cleanRussianText(input)).toBe('привет пока');
    });

    test('handles multiple cleaning operations', () => {
        const input = '<div>приве́т</div> (hello) / <span>пока́</span>';
        expect(cleanRussianText(input)).toBe('привет пока');
    });
}); 