# Answer Checking System Guide

## Overview

The answer checking system allows users to input their guesses and get automatic feedback on how close they are to the correct answer. It uses flexible matching that accounts for variations in spelling, case, and punctuation.

## Features

### 1. **Flexible Matching**
- ✅ Case-insensitive (e.g., "Echo", "echo", "ECHO" all match)
- ✅ Whitespace trimming (e.g., leading/trailing spaces ignored)
- ✅ Punctuation removal (e.g., "a coin" matches "a coin.")
- ✅ Article removal (e.g., "An echo" matches "echo")
- ✅ Similarity scoring using Levenshtein distance (allows ~25% variations)

### 2. **User Feedback**
- Shows a similarity percentage when answer is close but not exact
- Green highlight and "✓ Correct!" message for correct answers
- Input field is disabled after correct answer is found
- Clear button to try again or skip to another answer

### 3. **Progress Tracking**
- Correct answers are automatically tracked in AsyncStorage
- Solved riddles persist across sessions
- Hint usage is also tracked (separate from guessed answers)

## How It Works

### Matching Algorithm

The system uses a threshold of **0.75** (75% similarity) by default:

```javascript
checkAnswer(userGuess, correctAnswer, 0.75)
```

**Examples of passing matches:**
- "Echo" → "An echo" ✅
- "footsteps" → "Footsteps" ✅
- "keyboard" → "A keyboard" ✅
- "coin" → "A coin" ✅

**Examples of partial matches:**
- "candle" → "A map" (50% similarity - shown as "50% match")
- "echo" → "footsteps" (low similarity - shown as close %)

## Multiple Valid Answers

You can add multiple valid answers to any riddle. Simply update the `Answer` field in `riddles.js`:

### Single Answer (Current Format)
```javascript
{
    "Index": 1,
    "Riddle": "I speak without a mouth...",
    "Answer": "An echo",
    "Hint": "Think about a sound that repeats"
}
```

### Multiple Answers (New Format)
```javascript
{
    "Index": 1,
    "Riddle": "I speak without a mouth...",
    "Answer": ["An echo", "echo", "sound reflection"],
    "Hint": "Think about a sound that repeats"
}
```

The system automatically checks against all provided answers.

## Customization

### Change Matching Threshold

In [app/riddle/index.jsx](app/riddle/index.jsx), modify the `handleCheckAnswer` function:

```javascript
const result = checkAnswer(userGuess, answer, 0.75); // Change 0.75 to desired threshold
```

**Threshold Guide:**
- 0.95+ = Very strict (almost exact match only)
- 0.80 = Strict (minor variations allowed)
- 0.75 = Default (good balance)
- 0.60 = Lenient (major variations allowed)

### Adjust Feedback Messages

Edit the feedback messages in [app/riddle/index.jsx]:

```javascript
// Around line 230 in the JSX
{checkResult.isCorrect ? '✓ Correct!' : `${checkResult.similarity}% match`}
```

### Customize Normalization

Edit [utils/answerChecker.js](utils/answerChecker.js) to change what's considered:

```javascript
function normalizeAnswer(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[.,!?;:\-]/g, '')              // Punctuation to remove
        .replace(/\b(a|an|the)\b/g, '')          // Articles to ignore
        .replace(/\s+/g, ' ')
        .trim();
}
```

## File Structure

```
utils/
  └── answerChecker.js          # Core answer checking logic
app/riddle/
  └── index.jsx                 # Riddle display with input UI
assets/data/
  └── riddles.js                # Riddle data
```

## API Reference

### `checkAnswer(userAnswer, correctAnswer, threshold)`

Checks if user answer matches the correct answer.

**Parameters:**
- `userAnswer` (string): User's input
- `correctAnswer` (string|array): Correct answer(s)
- `threshold` (number): Similarity threshold 0-1 (default: 0.8)

**Returns:**
```javascript
{
    isCorrect: boolean,          // True if answer is correct
    similarity: number,          // 0-100 percentage match
    message: string             // User-friendly feedback
}
```

### Example
```javascript
const result = checkAnswer("echo", "An echo", 0.75);
// { isCorrect: true, similarity: 100, message: "✓ Correct!" }

const result2 = checkAnswer("water", "An echo", 0.75);
// { isCorrect: false, similarity: 20, message: "20% match" }
```

## Future Improvements

Possible enhancements:
- 🎯 Leaderboard with statistics (correct/total, streak, fastest)
- 🎨 Difficulty levels with adjusted thresholds
- 🔤 Language support (synonyms checking)
- ⏱️ Timed riddle mode
- 🏆 Achievement/badge system
