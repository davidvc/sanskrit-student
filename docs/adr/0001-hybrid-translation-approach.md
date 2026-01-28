# ADR 0001: Hybrid Translation Approach Using Dictionary APIs and LLM

## Status

Accepted

## Context

The application currently uses an LLM to provide translations for Sanskrit sutras. We investigated whether Sanskrit dictionary APIs could serve as an alternative or complement to this approach.

### Available Sanskrit Dictionary APIs

Several Sanskrit dictionary APIs are available:

**C-SALT APIs for Sanskrit Dictionaries** (University of Cologne)
- Provides both REST and GraphQL APIs
- Access to multiple authoritative dictionaries:
  - PWG Sanskrit Dictionary (122,731 entries)
  - Buddhist Hybrid Sanskrit Grammar and Dictionary (17,807 entries)
  - Vedic Index of Names and Subjects (3,834 entries)
  - Grassmann's Rig-Veda Dictionary (10,777 entries)
  - Apte's Student's English-Sanskrit Dictionary (11,364 entries)
- Each dictionary has dedicated REST API endpoints with Swagger UI
- GraphQL endpoints available at api.c-salt.uni-koeln.de

**Shabdkosh Dictionary APIs**
- Support for multiple Indian languages including Sanskrit
- Comprehensive dictionary data
- Requires contacting them for API access

### Dictionary API vs LLM Approaches

**Dictionary APIs provide:**
- ✅ Authoritative, scholarly sources
- ✅ Structured, reliable data
- ✅ Free or low-cost access
- ❌ Only word-by-word lookups without contextual understanding
- ❌ Require compound word splitting (sandhi resolution)
- ❌ No built-in grammatical analysis

**LLM Approach provides:**
- ✅ Contextual understanding
- ✅ Handles compounds and grammar
- ✅ Provides complete, coherent translations
- ❌ May be less accurate for technical terms
- ❌ Higher cost per request
- ❌ Potential for hallucinations

### What "Contextual Understanding" Means

#### 1. Grammatical Context
Sanskrit words change form based on case, number, gender:
- **yogaḥ** (nominative) - "yoga is..."
- **yogena** (instrumental) - "by means of yoga..."
- **yogāya** (dative) - "for the purpose of yoga..."
- **yogāt** (ablative) - "from yoga..."

An LLM can identify the grammatical role and translate accordingly. A dictionary just gives root meanings.

#### 2. Semantic Context (Meaning from Surrounding Words)
**Yoga Sutra 1.2:** *yogaś citta-vṛtti-nirodhaḥ*

Dictionary breaks it down:
- yoga = union/practice
- citta = mind/consciousness
- vṛtti = fluctuation/movement
- nirodhaḥ = restraint/cessation

LLM understands the relationship:
- "Yoga IS (the) cessation OF mind fluctuations"
- Not: "Union mind movement restraint" (nonsense)

#### 3. Compound Words (Sandhi)
Sanskrit joins words together. Example:

**tatpratiprasavahetur avidyā**

Dictionary cannot parse this compound. LLM can recognize:
- **tat** = that
- **prati** = against/counter
- **prasava** = emergence/birth
- **hetuḥ** = cause
- **avidyā** = ignorance

And translate: "ignorance is the cause of their re-emergence"

#### 4. Domain Knowledge
In Yoga Sutras, **samādhi** doesn't just mean "concentration" (generic dictionary definition).

LLM trained on yoga texts knows:
- It's the eighth limb of Ashtanga Yoga
- It refers to a specific meditative state
- Different types: savikalpa vs. nirvikalpa
- Technical meaning in Patanjali's system

#### 5. Idiomatic Expressions
Some phrases don't translate literally.

**Example:** *iti* at end of a sentence
- Dictionary: "thus, so"
- Contextual: Marks end of a quotation or logical conclusion (like punctuation)

### Example Comparison

**Input:** *yogaś citta-vṛtti-nirodhaḥ* (Sutra 1.2)

**Dictionary API alone:**
```
yogaś: union, practice, method
citta: mind, thought, heart
vṛtti: fluctuation, modification, activity
nirodhaḥ: restraint, cessation, control
```

**LLM with contextual understanding:**
```
"Yoga is the cessation of the fluctuations of the mind"
```

The LLM understands:
- **yogaś** is nominative (subject) = "Yoga IS"
- **citta-vṛtti** is a compound = "mind-fluctuations"
- **nirodhaḥ** is nominative predicate = "cessation/restraining"
- The whole phrase is a definition (A = B structure)

## Decision

We will implement a **hybrid approach** that combines both dictionary APIs and LLM capabilities:

1. Use C-SALT APIs for authoritative word definitions and etymologies
2. Use LLM for grammatical analysis and contextual interpretation
3. Combine both sources to provide comprehensive, verifiable translations

### Implementation Structure

For each sutra, provide:

```
Sutra: yogaś citta-vṛtti-nirodhaḥ

Translation: "Yoga is the cessation of the fluctuations of the mind"

Breakdown:
- yogaḥ (nom.) - yoga, union [C-SALT API: PWG Dictionary]
- citta (compound) - mind, consciousness [C-SALT API]
- vṛtti (compound) - fluctuation, modification [C-SALT API]
- nirodhaḥ (nom.) - cessation, restraint [C-SALT API]

Grammar: [LLM analysis]
- Nominal sentence (A = B structure)
- citta-vṛtti is a tatpurusha compound (mind's fluctuations)
- Both yogaś and nirodhaḥ in nominative case (subject-predicate)
```

## Consequences

### Positive

- **Increased accuracy**: Authoritative dictionary sources reduce risk of LLM hallucinations for word meanings
- **Enhanced learning**: Students get both authoritative definitions and contextual understanding
- **Verifiable translations**: Dictionary citations provide scholarly backing
- **Cost optimization**: Dictionary APIs are free/low-cost, reducing reliance on LLM calls
- **Better pedagogical value**: Word-by-word breakdown helps students learn Sanskrit structure

### Negative

- **Increased complexity**: System must integrate two different data sources
- **Potential inconsistencies**: Dictionary and LLM translations may occasionally conflict
- **Additional API dependencies**: Adds dependency on C-SALT API availability
- **Development effort**: Requires building integration with dictionary APIs and combining results

### Mitigations

- Implement caching for dictionary API responses to reduce latency and ensure availability
- Establish clear precedence rules (e.g., dictionary definitions take priority for word meanings)
- Build fallback to LLM-only mode if dictionary API is unavailable
- Consider offline dictionary data snapshot for critical terms

## References

- [C-SALT APIs for Sanskrit Dictionaries](https://cceh.github.io/c-salt_sanskrit_data/)
- [Shabdkosh Dictionary APIs](https://www.shabdkosh.com/services/dictionary-apis)
- Current LLM translation implementation: `src/services/TranslationService.ts`

## Date

2026-01-27
