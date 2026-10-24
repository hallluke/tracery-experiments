# Generative Experiments — v19 modular prototype

Open `index.html` directly. All scripts are classic deferred JavaScript in dependency order, so file:// works without a local server or bundler.

## Architecture
- `index.html`: shared layout, one `#experiment-method` slot and shared output list.
- `style.css`: existing shared theme, with experiment-specific rules labelled at the end.
- `core/utils.js`: registry, random grammar expansion, DOM helpers, disclosure controls.
- `core/app.js`: experiment selector, rendering, quantity, regeneration, copying.
- `data/*.js`: offline copies of the original Tracery JSON grammars. The original JSON also remains in `grammars/`.
- `experiments/cumberbot.js`: metadata, name generation, Jaro–Winkler scoring, explanation and badges.
- `experiments/ghost-echoes.js`: metadata, edition-first draw, curated merge map, IDF vocabulary scoring, percentile legend and provenance disclosure.

## Add an experiment
1. Add `data/new-experiment.js` assigning `GrammarData.newExperiment` (or use a server to load JSON).
2. Add `experiments/new-experiment.js` registering an object via `GE.registry.push({...})` with `id`, `label`, `title`, `description`, `methodHTML`, `grammar`, `example`, `note`, `draw()`, and optional `decorate()` / `legend()`.
3. Add the two `<script defer>` tags before `core/app.js` in `index.html`.
4. Add any experiment-specific CSS in the marked section.

## Ghost vocabulary rarity
The 465 original entries and all four decks remain intact. 15 user-approved merge relationships collapse 206 exact strings into 192 normalised identities. The document frequency of a word is the number of normalised identities containing it, not the number of deck appearances. Common stopwords are removed; a strategy's raw score is the mean of its remaining word IDF values. For merged variants, the union of vocabulary is used. The UI shows its midrank percentile among the 192 identities, coloured in thirds; ties receive the same rank. The percentile measures rarity, not card merit.

The 25% edition selection is retained. Percentile flags for Cumberbot9000 use the existing historical cutoffs (not recalculated for the two removed names).


## v20: one JavaScript file per experiment

`experiments/cumberbot.js` and `experiments/ghost-echoes.js` each contain two clearly commented sections: embedded grammar data, followed by experiment-specific metadata and logic. `core/utils.js` supplies shared helpers; `core/app.js` manages the common interface. Load scripts in this order: utils, experiment files, app. `grammars/*.json` are optional reference copies, not runtime dependencies.

Ghost Echoes' expandable panel now identifies the chosen edition/year, entry index and other editions containing the same **normalised strategy identity**. The approved 15 pairwise equivalences are retained; original card text and selection probability remain untouched. If the same identity has a wording variant in another edition, it still counts as appearing there.

## v21 changes
- Consistent experiment filenames: cumberbot9000.js / cumberbot9000.json, ghost-echoes.js / ghost-echoes.json.
- Selector moved to left panel, above active grammar.
- Ghost Echoes detail: edition, entry progress, four edition blocks, average word rarity, up to three highest-IDF words with explicit 1 + ln((N+1)/(df+1)) working and miniature bars. The displayed average uses all eligible unique words.
- The IDF bar maximum is the fixed theoretical maximum 1 + ln((N+1)/2) for the current normalised collection. Percentile badge is separately calculated from the distribution.
- Ghost Echoes metadata and detail rendering remain entirely in experiments/ghost-echoes.js.


## v22 changes
- Cumberbot legend runs red–grey–green.
- Ghost Echoes scores every distinct printed word (no stop-word exclusion); approved spellings are canonicalised for frequency counts. Grouped variants contribute one document to document frequency, but only the words actually printed contribute to a generated card's raw score.
- Identity reference scores average distinct variant scores; inclusive empirical percentile = 100 × (number of reference identities scoring at or below this identity) / 192. All ties share one percentile.
- Ghost disclosure contains aligned miniature bars only, including the three rarest words; edition blocks have the same thickness as other bars.
- Shared Expand all / Collapse all button appears when the selected experiment provides result disclosures. If any result is expanded, the button collapses all; otherwise it expands all.

Version 23: restored reliable per-result disclosure toggling and synchronized Expand/Collapse all state; shortened Ghost Echoes bars; revised legend wording.


## v24 preview

Open `index.html?preview=ghost-flags` in a browser to see examples of every Ghost Echoes flag (namesake, personal favourite, shortest, longest, one word, question). Remove the query parameter for ordinary random generation. Cumberbot's Winkler bonus bars now use a fixed 0–0.120 scale; other bars retain 0–1.
