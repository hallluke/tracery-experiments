
 // Good Design — experiment definition (uses grammars/good-design.json)
(function () {
  'use strict';

  const ORIGINALS = new Map([
    ['is innovative', 1],
    ['makes a product useful', 2],
    ['is aesthetic', 3],
    ['makes a product understandable', 4],
    ['is unobtrusive', 5],
    ['is honest', 6],
    ['is long-lasting', 7],
    ['is thorough down to the last detail', 8],
    ['is environmentally-friendly', 9],
    ['is as little design as possible', 10]
  ]);

  const stripNumber = text =>
    text.replace(/\s*(?:[1-9]️⃣|🔟)\s*$/u, '').trim();

  const fullSentence = text => {
    const phrase = stripNumber(text);
    return 'Good design ' + phrase +
      (/[.!?…]$/.test(phrase) ? '' : '.');
  };

  GE.registry.push({
    id: 'good-design',
    label: 'Good Design',
    title: 'Good Design',
    published: '',
    description: 'What makes good design? A collection of sometimes insightful, sometimes contradictory and occasionally absurd answers gathered from design principles and public posts.',
    methodHTML: 'Each result randomly selects one of the statements in the grammar. The ten principles associated with Dieter Rams are marked <strong>THE ORIGINAL</strong>; the others are presented without a ranking or quality score.',
    grammarURL: 'grammars/good-design.json',
    example: '→ Good design #desc#.',
    note: 'One statement is selected at random from the full collection.',

    initialise(grammar) {
      if (!grammar || !Array.isArray(grammar.desc) || !grammar.desc.length) {
        throw new Error(
          'Good Design grammar must contain a non-empty desc array.'
        );
      }
      this.grammar = grammar;
    },

    draw() {
      const phrase = GE.choose(this.grammar.desc);
      return {
        text: fullSentence(phrase),
        original: ORIGINALS.get(stripNumber(phrase)) || null
      };
    },

    decorate(draw, label, wrap) {
      // Keep the shared output appearance; no expandable detail panels.
      label.disabled = true;
      label.classList.add('plain-output');

      if (draw.original) {
        const badge = GE.el(
          'span',
          'exact-match-flag',
          'THE ORIGINAL'
        );

        badge.title =
          'Dieter Rams principle ' + draw.original + ' of 10';

        badge.setAttribute(
          'aria-label',
          'Dieter Rams original principle ' +
          draw.original + ' of 10'
        );

        wrap.append(badge);
      }
    }
  });
})();
