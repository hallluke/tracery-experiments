# Generative Experiments

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
