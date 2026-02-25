# Opportunity Scoring: OCR Translation Feature

**Opportunity Score Formula:**
`Opportunity = Importance + max(Importance - Satisfaction, 0)`

Higher scores indicate bigger opportunities to address through design.

---

## Job Priority Ranking

| Rank | Job | Importance | Satisfaction | Gap | Opportunity Score | Priority |
|------|-----|------------|--------------|-----|-------------------|----------|
| 1 | **Access Sacred Teachings** | 10 | 2 | 8 | **18** | **HIGHEST** |
| 1 | **Trust the Extraction** | 9 | 0 | 9 | **18** | **HIGHEST** |
| 3 | **Mobile Screenshot** | 9 | 1 | 8 | 17 | DEFERRED (future) |
| 4 | **Recover from Upload Issues** | 7 | 0 | 7 | **14** | **MEDIUM** |

---

## Interpretation

### Highest Priority Jobs (Score: 18)

**Job 1: Access Sacred Teachings**
- **Why high opportunity:** Users are completely blocked (satisfaction = 2/10) from accessing Devanagari texts. Cannot read or type the script. This is existential pain.
- **Design focus:** Make photo → translation flow seamless, fast (under 5 seconds), and trustworthy
- **Success metric:** Users can photograph and understand a sutra faster than finding pre-translated version online

**Job 2: Trust the Extraction**
- **Why high opportunity:** No current solution exists (satisfaction = 0/10), and trust is critical for sacred texts. Anxiety around errors has spiritual consequences.
- **Design focus:** Confidence scores, visual verification, transparency at every step
- **Success metric:** Users feel confident in OCR accuracy, willingness to rely on it for spiritual study

### Deferred Job (Score: 17)

**Job 3: Mobile Screenshot**
- **Why deferred:** While high opportunity score, this is out of scope for camera-focused MVP
- **Future iteration:** After camera workflow is proven, add screenshot upload capability
- **Design consideration:** Keep architecture flexible to add screenshot path later

### Medium Priority Job (Score: 14)

**Job 4: Recover from Upload Issues**
- **Why medium:** Only matters when things go wrong. Important for UX polish but not core value
- **Design focus:** Clear error messages, actionable guidance, easy retry
- **Success metric:** Users can self-recover from failures without abandoning the feature

---

## MVP Feature Prioritization

Based on opportunity scores:

### Must Have (Addresses Score 18 Jobs)
- ✅ Camera interface for photographing Devanagari text (2-6 line sutras)
- ✅ OCR extraction with Google Cloud Vision
- ✅ Confidence score display (color-coded: green/yellow/orange)
- ✅ Visual comparison: original photo vs extracted Devanagari
- ✅ IAST transliteration output
- ✅ Word-by-word translation breakdown
- ✅ Alternative translations
- ✅ Copy buttons (IAST, translation)

### Should Have (Addresses Score 14 Job)
- ✅ Clear error messages for upload failures (file too large, wrong format)
- ✅ Low confidence warnings with actionable guidance
- ✅ Retake photo workflow (easy recovery)
- ✅ Quality guidance ("Use bright lighting")

### Won't Have (MVP)
- ❌ Screenshot upload (deferred to future iteration)
- ❌ Save to history/bookmarks (nice-to-have)
- ❌ Crop/rotate/edit tools (keep simple)
- ❌ Multi-scan quick-repeat workflow (optimization, not essential)

---

## Validation Metrics

Track these to validate we're addressing the high-opportunity jobs:

**Job 1 Success Indicators:**
- Time from photo to translation < 5 seconds (speed)
- User completes first translation successfully (no blockers)
- User returns to translate additional sutras (repeat usage)

**Job 2 Success Indicators:**
- Users check confidence score before trusting translation (engagement with trust signals)
- Low confidence warnings lead to retakes (heeding guidance)
- Users visually compare extracted text to original (verification behavior)

**Job 4 Success Indicators:**
- Error recovery rate > 80% (users successfully retake/fix issues)
- Low abandonment on errors (don't give up when things fail)
- Error messages are actionable (users understand what to fix)

---

**Next:** Journey Design (Visual Map + YAML Schema + Gherkin)
