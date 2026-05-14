import { Index } from 'flexsearch';
import { offlineBibleService } from './offlineBibleService';

class BibleSearchService {
  private indexes: Record<string, Index> = {};

  async indexTranslation(translationId: string, bibleData: any) {
    const index = new Index({
      tokenize: 'forward',
      cache: true,
    });

    // bibleData is expected to be a map of book -> chapter -> verses
    // For our simplified demo storage, we'll iterate the structure
    Object.entries(bibleData).forEach(([bookName, chapters]: [string, any]) => {
      Object.entries(chapters).forEach(([chapterNum, chapterData]: [string, any]) => {
        if (chapterData.verses) {
          chapterData.verses.forEach((v: any) => {
            const docId = `${bookName}_${chapterNum}_${v.verse}`;
            index.add(docId, v.text);
          });
        }
      });
    });

    this.indexes[translationId] = index;
  }

  async search(translationId: string, query: string) {
    const index = this.indexes[translationId];
    if (!index) return [];

    const results = index.search(query, { limit: 20 });
    return results.map(id => {
      const [book, chapter, verse] = (id as string).split('_');
      return { book, chapter: parseInt(chapter), verse: parseInt(verse) };
    });
  }
}

export const bibleSearchService = new BibleSearchService();
