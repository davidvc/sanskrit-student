import { gql } from '@apollo/client';

export const TRANSLATE_SUTRA_QUERY = gql`
  query TranslateSutra($sutra: String!) {
    translateSutra(sutra: $sutra) {
      originalText
      iastText
      words {
        word
        meanings
      }
      alternativeTranslations
    }
  }
`;
