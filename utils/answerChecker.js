/**
 * Flexible answer checking utility for riddles
 * Handles various matching strategies to accept valid answers
 */

/**
 * Normalize a string for comparison
 * - Remove extra spaces
 * - Convert to lowercase
 * - Remove common articles and punctuation
 */
function normalizeAnswer(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[.,!?;:\-]/g, '') // Remove punctuation
        .replace(/\b(a|an|the)\b/g, '') // Remove common articles
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 * Returns a score 0-1 where 1 is identical
 */
function calculateSimilarity(str1, str2) {
    const s1 = normalizeAnswer(str1);
    const s2 = normalizeAnswer(str2);

    // Exact match
    if (s1 === s2) return 1;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function getEditDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

/**
 * Check if user answer is correct
 * @param {string} userAnswer - The answer provided by the user
 * @param {string|array} correctAnswer - The correct answer(s) from riddles data
 * @param {number} threshold - Similarity threshold (0-1). Default: 0.8
 * @returns {object} { isCorrect: boolean, similarity: number, message: string }
 */
export function checkAnswer(userAnswer, correctAnswer, threshold = 0.8) {
    if (!userAnswer || !correctAnswer) {
        return {
            isCorrect: false,
            similarity: 0,
            message: 'Please provide an answer',
        };
    }

    // Support multiple valid answers
    const answers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

    let bestSimilarity = 0;
    let isCorrect = false;

    for (const answer of answers) {
        const similarity = calculateSimilarity(userAnswer, answer);

        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
        }

        // Check if this answer matches
        if (similarity >= threshold || normalizeAnswer(userAnswer) === normalizeAnswer(answer)) {
            isCorrect = true;
            break;
        }
    }

    return {
        isCorrect,
        similarity: Math.round(bestSimilarity * 100),
        message: isCorrect ? '✓ Correct!' : `Close! ${Math.round(bestSimilarity * 100)}% match`,
    };
}

/**
 * Get all valid answers for a riddle
 * @param {object} riddleObj - The riddle object from riddles data
 * @returns {array} Array of valid answers
 */
export function getValidAnswers(riddleObj) {
    const answer = riddleObj.answer || riddleObj.Answer || '';
    return Array.isArray(answer) ? answer : [answer];
}

/**
 * Format answer for display
 * @param {string|array} answer - The answer(s) to format
 * @returns {string} Formatted answer string
 */
export function formatAnswer(answer) {
    if (Array.isArray(answer)) {
        return answer.join(' or ');
    }
    return answer;
}
