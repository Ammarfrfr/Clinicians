/**
 * Voice Command Parser for Scribologist.
 *
 * Detects wake-word "scribologist" (with fuzzy matching for common
 * speech-to-text misinterpretations) followed by a command keyword.
 *
 * Usage:
 *   const result = parseVoiceCommand("scribologist stop recording");
 *   // → { command: 'stop', args: '', matchedText: 'scribologist stop' }
 */

// Common misinterpretations of "Scribologist" by speech recognition
const WAKE_WORDS = [
  'scribologist', 'scribe', 'scribology', 'scribble', 'psychologist', 'tribologist',
];

const WAKE_PATTERN = new RegExp(
  `(?:^|\\s)(${WAKE_WORDS.join('|')})\\s+`,
  'i'
);

/**
 * Parse a transcript string for a Scribologist voice command.
 * Returns null if no command is found.
 *
 * @param {string} text - The transcript text (interim or final) to scan.
 * @returns {{ command: string, args: string, matchedText: string } | null}
 */
export function parseVoiceCommand(text) {
  if (!text || text.length < 5) return null;

  const lower = text.toLowerCase().trim();
  const match = lower.match(WAKE_PATTERN);
  if (!match) return null;

  // Everything after the wake word
  const afterWake = lower.slice(match.index + match[0].length).trim();
  if (!afterWake) return null;

  // Command: stop
  if (/^stop/.test(afterWake)) {
    return {
      command: 'stop',
      args: '',
      matchedText: match[0].trim() + ' stop',
    };
  }

  // Command: save
  if (/^save/.test(afterWake)) {
    return {
      command: 'save',
      args: '',
      matchedText: match[0].trim() + ' save',
    };
  }

  // Command: follow up [X] [days|weeks]
  const followUpMatch = afterWake.match(
    /^follow\s*-?\s*up\s+(?:in\s+)?(\d+)\s*(day|days|week|weeks)/
  );
  if (followUpMatch) {
    const num = parseInt(followUpMatch[1], 10);
    const unit = followUpMatch[2].replace(/s$/, ''); // normalize
    return {
      command: 'followup',
      args: `${num} ${unit}${num > 1 ? 's' : ''}`,
      matchedText: match[0].trim() + ' follow up ' + followUpMatch[0].slice(followUpMatch[0].indexOf(followUpMatch[1])),
    };
  }

  return null;
}

/**
 * Strip a detected command phrase from the transcript text,
 * so it doesn't end up in the clinical note.
 */
export function stripCommand(text, matchedText) {
  if (!text || !matchedText) return text;
  const idx = text.toLowerCase().indexOf(matchedText.toLowerCase());
  if (idx === -1) return text;
  return (text.slice(0, idx) + text.slice(idx + matchedText.length)).trim();
}
