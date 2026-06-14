/**
 * Flexible answer checking utility for riddles.
 *
 * Improvements over the original:
 *  1. Richer normalisation  – strips possessives, more punctuation, expands
 *     common contractions, removes filler words beyond just articles.
 *  2. Plural / basic stemming  – "footstep" matches "footsteps", etc.
 *  3. Synonym / alias table  – common riddle answers accept well-known variants.
 *  4. Word-set containment check  – "letter m" accepted when answer is "the letter m".
 *  5. Core-word extraction  – Levenshtein is run on the *core* noun, not the
 *     full phrase, so "an echo" and "echo" both score 100 %.
 *  6. Graduated feedback messages  – "Very close!", "Getting warmer!", etc.
 *  7. Consistent threshold across the codebase (default 0.75).
 */

// ---------------------------------------------------------------------------
// 1. Synonym / alias table
//    Keys are the normalised correct answers; values are arrays of normalised
//    acceptable alternatives the user might reasonably type.
// ---------------------------------------------------------------------------
const SYNONYMS = {
    // echo
    'echo': ['echoes', 'sound reflection', 'reflected sound'],
    // footsteps
    'footsteps': ['steps', 'footstep', 'foot steps', 'tracks', 'prints', 'footprints'],
    // fire
    'fire': ['flame', 'flames', 'blaze'],
    // candle
    'candle': ['candles'],
    // map
    'map': ['maps'],
    // keyboard
    'keyboard': ['computer keyboard', 'keyboards', 'keypad'],
    // river
    'river': ['rivers', 'stream'],
    // clock
    'clock': ['clocks', 'watch', 'timepiece'],
    // towel
    'towel': ['towels'],
    // coin
    'coin': ['coins'],
    // shadow
    'shadow': ['shadows'],
    // breath
    'breath': ['air', 'breathing'],
    // your breath
    'your breath': ['breath', 'air', 'breathing'],
    // stamp
    'stamp': ['stamps', 'postage stamp'],
    // sponge
    'sponge': ['sponges'],
    // promise
    'promise': ['promises', 'a vow', 'pledge'],
    // silence
    'silence': ['quiet', 'quiet silence'],
    // age
    'age': ['your age', 'aging'],
    // your age
    'your age': ['age', 'aging'],
    // letter m
    'the letter m': ['m', 'letter m'],
    'letter m': ['m', 'the letter m'],
    // needle
    'needle': ['needles'],
    // road
    'road': ['roads', 'street', 'highway'],
    // mountain
    'mountain': ['mountains'],
    // book
    'book': ['books'],
    // bank
    'bank': ['banks'],
    // piano
    'piano': ['pianos'],
    // comb
    'comb': ['combs'],
    // cold
    'cold': ['flu', 'colds', 'illness'],
    // tomorrow
    'tomorrow': ['the next day'],
    // time
    'time': ['times'],
    // fence
    'fence': ['fences'],
    // table
    'table': ['tables'],
    // pencil lead
    'pencil lead': ['pencil', 'graphite', 'lead'],
    // ice cube
    'ice cube': ['ice', 'ice block'],
    // deck of cards
    'deck of cards': ['cards', 'playing cards', 'card deck'],
    // envelope
    'envelope': ['envelopes'],
    // a hole
    'hole': ['holes', 'a hole'],
    // charcoal
    'charcoal': ['coal', 'char'],
    // stairs
    'stairs': ['staircase', 'steps', 'stair'],
    // window
    'window': ['windows'],
    // teapot
    'teapot': ['tea pot', 'teapots'],
    // library
    'library': ['libraries'],
    // your name
    'your name': ['name', 'my name'],
    // your word
    'your word': ['word', 'promise'],
    // your left hand
    'your left hand': ['left hand'],
    // your legs
    'your legs': ['legs'],
    // your brain
    'your brain': ['brain', 'mind'],
    // your nose
    'your nose': ['nose'],
    // your eyes
    'your eyes': ['eyes'],
    // cloud
    'cloud': ['clouds'],
    // sound
    'sound': ['noise', 'audio'],
    // cornfield
    'cornfield': ['corn field', 'corn'],
    // mississippi
    'mississippi': ['mississippi river'],
    // mushroom
    'mushroom': ['mushrooms'],
    // temperature
    'temperature': ['temp', 'temperatures'],
    // light
    'light': ['sunlight'],
    // joke
    'joke': ['jokes'],
    // pine tree
    'pine tree': ['pine', 'pine trees'],
    // tongue
    'tongue': ['tongues'],
    // tennis ball
    'tennis ball': ['tennis'],
    // conversation
    'conversation': ['conversation talk', 'talk', 'dialogue'],
    // living room
    'the living room': ['living room'],
};

// ---------------------------------------------------------------------------
// 2. Normalisation helpers
// ---------------------------------------------------------------------------

/** Strip filler words that don't carry meaning for matching purposes. */
const FILLER_WORDS = new Set([
    'a', 'an', 'the', 'some', 'my', 'your', 'our', 'their',
    'its', 'this', 'that', 'is', 'are', 'am', 'be',
]);

function normalizeAnswer(text) {
    return text
        .toLowerCase()
        .trim()
        // Expand common contractions
        .replace(/it's/g, 'it is')
        .replace(/i'm/g, 'i am')
        .replace(/don't/g, 'do not')
        .replace(/can't/g, 'cannot')
        .replace(/won't/g, 'will not')
        // Strip possessives
        .replace(/'s\b/g, '')
        // Strip punctuation (keep letters, digits, spaces)
        .replace(/[^a-z0-9\s]/g, '')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/** Remove filler words to get the meaningful core of a phrase. */
function removeFiller(text) {
    return text
        .split(' ')
        .filter(w => w.length > 0 && !FILLER_WORDS.has(w))
        .join(' ');
}

/**
 * Naïve stemmer – strips common English suffixes so "footsteps" ≈ "footstep",
 * "echoes" ≈ "echo", "flames" ≈ "flame", etc.
 */
function stem(word) {
    if (word.length <= 3) return word;
    // -ing
    if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
    // -tion / -sion  (keep noun roots)
    // -es  e.g. echoes → echo, matches → match
    if (word.endsWith('oes')) return word.slice(0, -2);          // echoes → echo
    if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y'; // flies → fly
    if (word.endsWith('es') && word.length > 4) return word.slice(0, -1);         // flames → flame
    // -s   e.g. steps → step  (don't strip if word is too short)
    if (word.endsWith('s') && word.length > 4) return word.slice(0, -1);
    return word;
}

/** Stem every word in a normalised phrase. */
function stemPhrase(phrase) {
    return phrase.split(' ').map(stem).join(' ');
}

// ---------------------------------------------------------------------------
// 3. Levenshtein distance (unchanged from original, but used on core words)
// ---------------------------------------------------------------------------
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

/** Similarity 0–1 between two already-normalised strings. */
function stringSimilarity(s1, s2) {
    if (s1 === s2) return 1;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1;
    const dist = getEditDistance(longer, shorter);
    return (longer.length - dist) / longer.length;
}

// ---------------------------------------------------------------------------
// 4. Multi-strategy matcher
// ---------------------------------------------------------------------------

/**
 * Returns a similarity score 0–1 for one (user, correct) answer pair.
 * Combines several strategies and returns the highest score found.
 */
function scorePair(rawUser, rawCorrect) {
    // --- Layer 1: normalise ---
    const normUser    = normalizeAnswer(rawUser);
    const normCorrect = normalizeAnswer(rawCorrect);

    // Exact match after normalisation
    if (normUser === normCorrect) return 1;

    // --- Layer 2: filler-stripped ---
    const coreUser    = removeFiller(normUser);
    const coreCorrect = removeFiller(normCorrect);

    if (coreUser === coreCorrect) return 1;

    // --- Layer 3: stemmed cores ---
    const stemUser    = stemPhrase(coreUser);
    const stemCorrect = stemPhrase(coreCorrect);

    if (stemUser === stemCorrect) return 1;

    // --- Layer 4: word-set containment ---
    // "letter m" should match "the letter m" – if user's core words are a
    // SUBSET of the correct answer's core words (or vice versa), accept it.
    const setUser    = new Set(coreUser.split(' ').filter(Boolean));
    const setCorrect = new Set(coreCorrect.split(' ').filter(Boolean));

    if (setUser.size > 0 && setCorrect.size > 0) {
        // How many of the user's words appear in the correct set
        const intersection = [...setUser].filter(w => setCorrect.has(w)).length;
        const userCoverage    = intersection / setUser.size;
        const correctCoverage = intersection / setCorrect.size;

        // If user covered ≥ 80 % of unique correct words → nearly correct
        if (correctCoverage >= 0.8 && userCoverage >= 0.8) return 0.95;
        if (correctCoverage >= 0.6 && userCoverage >= 0.6) return 0.8;
    }

    // --- Layer 5: synonym lookup ---
    const correctAliases = SYNONYMS[coreCorrect] || SYNONYMS[normCorrect] || [];
    if (correctAliases.some(alias => normalizeAnswer(alias) === normUser ||
                                     removeFiller(normalizeAnswer(alias)) === coreUser)) {
        return 1;
    }
    // Also check the reverse: maybe the user typed a canonical form that maps
    // to the correct answer via an alias chain.
    for (const [key, aliases] of Object.entries(SYNONYMS)) {
        if (aliases.some(a => normalizeAnswer(a) === normCorrect ||
                               removeFiller(normalizeAnswer(a)) === coreCorrect)) {
            if (key === normUser || key === coreUser) return 1;
        }
    }

    // --- Layer 6: fuzzy Levenshtein on *core* strings ---
    // Run on the core (filler-stripped) version so "an echo" vs "echo" isn't penalised.
    const fuzzyScore = stringSimilarity(
        stemUser    || normUser,
        stemCorrect || normCorrect,
    );

    return fuzzyScore;
}

// ---------------------------------------------------------------------------
// 5. Public API
// ---------------------------------------------------------------------------

/**
 * Check if a user's answer is correct.
 *
 * @param {string}        userAnswer    - Answer typed by the user.
 * @param {string|Array}  correctAnswer - Correct answer(s) from riddle data.
 * @param {number}        threshold     - Similarity threshold 0–1. Default 0.75.
 * @returns {{ isCorrect: boolean, similarity: number, message: string }}
 */
export function checkAnswer(userAnswer, correctAnswer, threshold = 0.75) {
    if (!userAnswer || !correctAnswer) {
        return { isCorrect: false, similarity: 0, message: 'Please provide an answer' };
    }

    const answers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

    let bestScore = 0;

    for (const answer of answers) {
        const score = scorePair(userAnswer, answer);
        if (score > bestScore) bestScore = score;
        if (bestScore >= 1) break; // perfect match – no need to check further
    }

    const isCorrect = bestScore >= threshold;
    const pct = Math.round(bestScore * 100);

    // Graduated feedback message
    let message;
    if (isCorrect) {
        message = '✓ Correct!';
    } else if (pct >= 65) {
        message = `Very close! ${pct}% match 🔥`;
    } else if (pct >= 45) {
        message = `Getting warmer! ${pct}% match`;
    } else if (pct >= 25) {
        message = `Not quite – ${pct}% match`;
    } else {
        message = `Keep thinking! ${pct}% match`;
    }

    return { isCorrect, similarity: pct, message };
}

/**
 * Get all valid answers for a riddle object.
 * @param {object} riddleObj
 * @returns {string[]}
 */
export function getValidAnswers(riddleObj) {
    const answer = riddleObj.answer || riddleObj.Answer || '';
    return Array.isArray(answer) ? answer : [answer];
}

/**
 * Format answer(s) for display.
 * @param {string|string[]} answer
 * @returns {string}
 */
export function formatAnswer(answer) {
    if (Array.isArray(answer)) return answer.join(' or ');
    return answer;
}
