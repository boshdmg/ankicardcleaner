const { hasStressMarks } = require('./textCleaner');

describe('hasStressMarks', () => {
    test('detects explicit stress marks', () => {
        expect(hasStressMarks('приве́т')).toBe(true);
        expect(hasStressMarks('до́брое у́тро')).toBe(true);
        expect(hasStressMarks('привет')).toBe(false);
    });

    test('recognizes ё as stressed', () => {
        expect(hasStressMarks('ёлка')).toBe(true);
        expect(hasStressMarks('всё')).toBe(true);
        expect(hasStressMarks('Ёж')).toBe(true);
    });

    test('handles single-vowel words they dont need stress marks', () => {
        expect(hasStressMarks('я')).toBe(true);
        expect(hasStressMarks('он')).toBe(true);
        expect(hasStressMarks('два')).toBe(true);
    });

    test('works with mixed text', () => {
        expect(hasStressMarks('ёлка и де́рево')).toBe(true);
        expect(hasStressMarks('привет и пока')).toBe(false);
    });

    test('handles non-Russian text correctly', () => {
        expect(hasStressMarks('hello')).toBe(false);
        expect(hasStressMarks('123')).toBe(false);
        expect(hasStressMarks('')).toBe(false);
    });
}); 