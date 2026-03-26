import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Upload: { input: File; output: File; }
};

export type Mutation = {
  __typename?: 'Mutation';
  translateSutraFromImage: OcrTranslationResult;
};


export type MutationTranslateSutraFromImageArgs = {
  image: Scalars['Upload']['input'];
};

export type OcrTranslationResult = {
  __typename?: 'OcrTranslationResult';
  alternativeTranslations?: Maybe<Array<Scalars['String']['output']>>;
  extractedText: Scalars['String']['output'];
  iastText: Array<Scalars['String']['output']>;
  ocrConfidence: Scalars['Float']['output'];
  ocrWarnings?: Maybe<Array<Scalars['String']['output']>>;
  originalText: Array<Scalars['String']['output']>;
  words: Array<WordEntry>;
};

export type Query = {
  __typename?: 'Query';
  translateSutra?: Maybe<TranslationResult>;
};


export type QueryTranslateSutraArgs = {
  sutra: Scalars['String']['input'];
};

export type TranslationResult = {
  __typename?: 'TranslationResult';
  alternativeTranslations?: Maybe<Array<Scalars['String']['output']>>;
  iastText: Array<Scalars['String']['output']>;
  originalText: Array<Scalars['String']['output']>;
  words: Array<WordEntry>;
};

export type WordEntry = {
  __typename?: 'WordEntry';
  meanings: Array<Scalars['String']['output']>;
  word: Scalars['String']['output'];
};

export type TranslateSutraFromImageMutationVariables = Exact<{
  image: Scalars['Upload']['input'];
}>;


export type TranslateSutraFromImageMutation = { __typename?: 'Mutation', translateSutraFromImage: { __typename?: 'OcrTranslationResult', originalText: Array<string>, iastText: Array<string>, alternativeTranslations?: Array<string> | null, ocrConfidence: number, extractedText: string, ocrWarnings?: Array<string> | null, words: Array<{ __typename?: 'WordEntry', word: string, meanings: Array<string> }> } };

export type TranslateSutraQueryVariables = Exact<{
  sutra: Scalars['String']['input'];
}>;


export type TranslateSutraQuery = { __typename?: 'Query', translateSutra?: { __typename?: 'TranslationResult', originalText: Array<string>, iastText: Array<string>, alternativeTranslations?: Array<string> | null, words: Array<{ __typename?: 'WordEntry', word: string, meanings: Array<string> }> } | null };


export const TranslateSutraFromImageDocument = gql`
    mutation TranslateSutraFromImage($image: Upload!) {
  translateSutraFromImage(image: $image) {
    originalText
    iastText
    words {
      word
      meanings
    }
    alternativeTranslations
    ocrConfidence
    extractedText
    ocrWarnings
  }
}
    `;
export type TranslateSutraFromImageMutationFn = Apollo.MutationFunction<TranslateSutraFromImageMutation, TranslateSutraFromImageMutationVariables>;

/**
 * __useTranslateSutraFromImageMutation__
 *
 * To run a mutation, you first call `useTranslateSutraFromImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTranslateSutraFromImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [translateSutraFromImageMutation, { data, loading, error }] = useTranslateSutraFromImageMutation({
 *   variables: {
 *      image: // value for 'image'
 *   },
 * });
 */
export function useTranslateSutraFromImageMutation(baseOptions?: Apollo.MutationHookOptions<TranslateSutraFromImageMutation, TranslateSutraFromImageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TranslateSutraFromImageMutation, TranslateSutraFromImageMutationVariables>(TranslateSutraFromImageDocument, options);
      }
export type TranslateSutraFromImageMutationHookResult = ReturnType<typeof useTranslateSutraFromImageMutation>;
export type TranslateSutraFromImageMutationResult = Apollo.MutationResult<TranslateSutraFromImageMutation>;
export type TranslateSutraFromImageMutationOptions = Apollo.BaseMutationOptions<TranslateSutraFromImageMutation, TranslateSutraFromImageMutationVariables>;
export const TranslateSutraDocument = gql`
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

/**
 * __useTranslateSutraQuery__
 *
 * To run a query within a React component, call `useTranslateSutraQuery` and pass it any options that fit your needs.
 * When your component renders, `useTranslateSutraQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTranslateSutraQuery({
 *   variables: {
 *      sutra: // value for 'sutra'
 *   },
 * });
 */
export function useTranslateSutraQuery(baseOptions: Apollo.QueryHookOptions<TranslateSutraQuery, TranslateSutraQueryVariables> & ({ variables: TranslateSutraQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TranslateSutraQuery, TranslateSutraQueryVariables>(TranslateSutraDocument, options);
      }
export function useTranslateSutraLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TranslateSutraQuery, TranslateSutraQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TranslateSutraQuery, TranslateSutraQueryVariables>(TranslateSutraDocument, options);
        }
// @ts-ignore
export function useTranslateSutraSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TranslateSutraQuery, TranslateSutraQueryVariables>): Apollo.UseSuspenseQueryResult<TranslateSutraQuery, TranslateSutraQueryVariables>;
export function useTranslateSutraSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TranslateSutraQuery, TranslateSutraQueryVariables>): Apollo.UseSuspenseQueryResult<TranslateSutraQuery | undefined, TranslateSutraQueryVariables>;
export function useTranslateSutraSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TranslateSutraQuery, TranslateSutraQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TranslateSutraQuery, TranslateSutraQueryVariables>(TranslateSutraDocument, options);
        }
export type TranslateSutraQueryHookResult = ReturnType<typeof useTranslateSutraQuery>;
export type TranslateSutraLazyQueryHookResult = ReturnType<typeof useTranslateSutraLazyQuery>;
export type TranslateSutraSuspenseQueryHookResult = ReturnType<typeof useTranslateSutraSuspenseQuery>;
export type TranslateSutraQueryResult = Apollo.QueryResult<TranslateSutraQuery, TranslateSutraQueryVariables>;