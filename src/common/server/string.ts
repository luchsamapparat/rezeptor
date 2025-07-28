import * as capitalize from 'capitalize';
import * as stopword from 'stopword';

const stopwordList = stopword.deu;

export function sanitizeString(string: string) {
  if (/[a-z]/.test(string)) {
    return string;
  }

  return capitalize
    .words(string)
    .split(' ')
    .map((word) => {
      const lowerCaseWord = word.toLowerCase();
      return stopwordList.includes(lowerCaseWord) ? lowerCaseWord : word;
    })
    .join(' ');
}
