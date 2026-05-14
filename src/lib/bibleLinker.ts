import { useNavigate } from 'react-router-dom';

/**
 * Parses content for Bible verse references in the format [verse:book:chapter:verse]
 * and converts them into clickable links.
 */
export function processBibleReferences(htmlContent: string) {
  const regex = /\[verse:([a-zA-Z\s]+):(\d+):(\d+)\]/g;
  
  // We cannot directly access the navigate function inside the string replacement, 
  // so we will add a data attribute and use an event listener to handle the click.
  return htmlContent.replace(
    regex, 
    (_match, book, chapter, verse) => 
      `<span 
        class="bible-verse-link text-[var(--color-primary)] cursor-pointer hover:underline font-semibold" 
        data-book="${book}" 
        data-chapter="${chapter}" 
        data-verse="${verse}"
      >${book} ${chapter}:${verse}</span>`
  );
}

/**
 * Hook to be used in components to setup the event listener for verse links.
 */
import { useEffect } from 'react';

export function useBibleVerseLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('bible-verse-link')) {
        const book = target.getAttribute('data-book');
        const chapter = target.getAttribute('data-chapter');
        const verse = target.getAttribute('data-verse');
        // Assuming your bible reader path is /read
        navigate(`/read?book=${book}&chapter=${chapter}&verse=${verse}`);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [navigate]);
}
