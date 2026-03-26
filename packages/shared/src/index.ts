// Barrel export for @sanskrit-student/shared

// Domain types are the canonical type definitions
export * from './types';

// GraphQL operations, hooks, and query/mutation types
// (excludes base type names that collide with domain types)
export {
  // Scalars and utility types
  type Maybe,
  type InputMaybe,
  type Exact,
  type MakeOptional,
  type MakeMaybe,
  type MakeEmpty,
  type Incremental,
  type Scalars,

  // Query and Mutation root types
  type Query,
  type QueryTranslateSutraArgs,
  type Mutation,
  type MutationTranslateSutraFromImageArgs,

  // Operation types (query/mutation result shapes)
  type TranslateSutraQuery,
  type TranslateSutraQueryVariables,
  type TranslateSutraFromImageMutation,
  type TranslateSutraFromImageMutationVariables,

  // Apollo hooks
  useTranslateSutraQuery,
  useTranslateSutraLazyQuery,
  useTranslateSutraSuspenseQuery,
  useTranslateSutraFromImageMutation,

  // Hook result types
  type TranslateSutraQueryHookResult,
  type TranslateSutraLazyQueryHookResult,
  type TranslateSutraSuspenseQueryHookResult,
  type TranslateSutraFromImageMutationHookResult,
  type TranslateSutraFromImageMutationResult,
  type TranslateSutraFromImageMutationOptions,
  type TranslateSutraFromImageMutationFn,

  // GQL documents
  TranslateSutraDocument,
  TranslateSutraFromImageDocument,
} from './graphql/generated';
