import React from 'react';
import { useVersePopup } from './BibleVersePopup';
import { BIBLE_BOOKS } from '../constants';

interface LinkifiedTextProps {
  text: string;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text }) => {
  const { openVerse } = useVersePopup();

  // Simple regex for Book Chapter:Verse or Book Chapter
  const verseRegex = /([1-3]?\s?[A-Za-z]+)\s(\d+)(?::(\d+))?/g;
  
  const parts = text.split(verseRegex);
  const matches = Array.from(text.matchAll(verseRegex));
  
  const elements = [];
  let matchIndex = 0;

  for (let i = 0; i < parts.length; i += 4) {
    elements.push(parts[i]);
    
    if (matchIndex < matches.length) {
      const match = matches[matchIndex++];
      const [full, book, chapter, verse] = match;
      
      // Basic check if it's likely a Bible book
      const isLikelyBook = BIBLE_BOOKS.some(b => 
        b.name.toLowerCase().includes(book.toLowerCase().trim()) ||
        book.toLowerCase().trim().startsWith(b.name.toLowerCase().substring(0, 3))
      );

      if (isLikelyBook) {
        elements.push(
          <button
            key={match.index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openVerse(book.trim(), parseInt(chapter), verse ? parseInt(verse) : undefined);
            }}
            className="text-[var(--color-primary)] font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
          >
            {full}
          </button>
        );
      } else {
        elements.push(full);
      }
    }
  }

  return <>{elements}</>;
};
