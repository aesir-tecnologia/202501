export const PRE_WORK_QUOTES = [
  'Every journey begins with a single step.',
  'Small progress is still progress.',
  'Focus on the process, not the outcome.',
  'Today is a fresh start.',
  'One stint at a time.',
  'You\'re capable of great things.',
  'The best time to start is now.',
  'Consistency beats intensity.',
  'Show up for yourself today.',
  'Your future self will thank you.',
] as const;

export function getRandomPreWorkQuote(): string {
  return PRE_WORK_QUOTES[Math.floor(Math.random() * PRE_WORK_QUOTES.length)] ?? PRE_WORK_QUOTES[0];
}
