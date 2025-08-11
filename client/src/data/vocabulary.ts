import type { CEFRLevel } from '@/constants/categories';

export interface VocabularyItem {
  word: string;
  definition: string;
  partOfSpeech: string;
  example: string;
  pronunciation: string;
  cefrLevel: CEFRLevel;
}

export const vocabularyData: Record<string, VocabularyItem[]> = {
  "a1": [
    {
      word: "impact",
      definition: "A strong effect or influence on something",
      partOfSpeech: "noun",
      example: "The impact of climate change is visible everywhere.",
      pronunciation: "/ˈɪmpækt/",
      cefrLevel: "B2"
    },
    {
      word: "greenhouse",
      definition: "A glass building where plants are grown",
      partOfSpeech: "noun",
      example: "Greenhouse gases trap heat in the atmosphere.",
      pronunciation: "/ˈɡriːnhaʊs/",
      cefrLevel: "B2"
    },
    {
      word: "emissions",
      definition: "Gases or other substances discharged into the atmosphere",
      partOfSpeech: "noun",
      example: "We need to reduce carbon emissions to fight climate change.",
      pronunciation: "/ɪˈmɪʃənz/",
      cefrLevel: "B2"
    },
    {
      word: "sustainable",
      definition: "Able to continue over a period of time without damaging the environment",
      partOfSpeech: "adjective",
      example: "We must find sustainable solutions to environmental problems.",
      pronunciation: "/səˈsteɪnəbəl/",
      cefrLevel: "B2"
    }
  ],
  "v1": [
    {
      word: "marine",
      definition: "Related to the sea or ocean",
      partOfSpeech: "adjective",
      example: "Marine biology studies life in the ocean.",
      pronunciation: "/məˈriːn/",
      cefrLevel: "B2"
    },
    {
      word: "ecosystem",
      definition: "A community of living organisms and their environment",
      partOfSpeech: "noun",
      example: "Coral reefs are complex marine ecosystems.",
      pronunciation: "/ˈiːkoʊsɪstəm/",
      cefrLevel: "B2"
    },
    {
      word: "biodiversity",
      definition: "The variety of plant and animal life in an environment",
      partOfSpeech: "noun",
      example: "The ocean has incredible biodiversity.",
      pronunciation: "/ˌbaɪoʊdaɪˈvɜːrsəti/",
      cefrLevel: "B2"
    },
    {
      word: "species",
      definition: "A group of living organisms that can reproduce together",
      partOfSpeech: "noun",
      example: "Many marine species are endangered.",
      pronunciation: "/ˈspiːʃiːz/",
      cefrLevel: "B2"
    }
  ]
};
