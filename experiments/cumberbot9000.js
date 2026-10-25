/* ============================================================
   EXPERIMENT METADATA, GENERATION AND DISPLAY — CUMBERBOT
   ============================================================ */
(function(){
const {el}=GE;
const config={ reference:['Benedict','Cumberbatch'], thresholds:[0.50,0.58] };
function jaroDetails(a, b) {
  a = a.toLocaleLowerCase().normalize('NFC'); b = b.toLocaleLowerCase().normalize('NFC');
  const n = a.length, m = b.length;
  const range = Math.max(0, Math.floor(Math.max(n, m) / 2) - 1);
  const ma = Array(n).fill(false), mb = Array(m).fill(false);
  let matches = 0;
  for (let i = 0; i < n; i++) for (let j = Math.max(0, i-range); j < Math.min(m, i+range+1); j++) {
    if (!mb[j] && a[i] === b[j]) { ma[i] = mb[j] = true; matches++; break; }
  }
  let swaps = 0, k = 0;
  if (matches) for (let i = 0; i < n; i++) if (ma[i]) {
    while (!mb[k]) k++;
    if (a[i] !== b[k]) swaps++;
    k++;
  }
  const transpositions = swaps / 2;
  const jaro = a === b ? 1 : matches ? (matches/n + matches/m + (matches-transpositions)/matches)/3 : 0;
  let prefix = 0;
  while (prefix < Math.min(4,n,m) && a[prefix] === b[prefix]) prefix++;
  const adjusted = jaro > 0.7 && a !== b;
  const score = adjusted ? jaro + prefix * 0.1 * (1-jaro) : jaro;
  return { n, m, range, matches, transpositions, prefix, jaro, adjusted, score };
}
function jaroWinkler(a, b) { return jaroDetails(a, b).score; }
function scoreExplanation(name, config) {
  const [first, last] = name.trim().split(/\s+/);
  const [referenceFirst, referenceLast] = config.reference;
  const comparisons = [[first, referenceFirst], [last, referenceLast]];
  const panel = document.createElement('div');
  panel.className = 'score-breakdown';
  const grid = document.createElement('div');
  grid.className = 'breakdown-grid';
  const number = value => value.toFixed(3);
  const percent = value => (value * 100).toFixed(1) + '%';
  const make = (tag, cls, value) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value !== undefined) el.textContent = value;
    return el;
  };
  for (const [word, reference] of comparisons) {
    const d = jaroDetails(word, reference);
    const col = make('div', 'breakdown-word');
    col.append(make('h4', '', `${word} ↔ ${reference}`));
    const ratio1 = d.n ? d.matches / d.n : 0;
    const ratio2 = d.m ? d.matches / d.m : 0;
    const order = d.matches ? (d.matches - d.transpositions) / d.matches : 0;
    const bonus = d.adjusted ? d.prefix * 0.1 * (1 - d.jaro) : 0;
    const lines = [
      [`Generated: ${d.matches} / ${d.n} = ${number(ratio1)}`, ratio1],
      [`Reference: ${d.matches} / ${d.m} = ${number(ratio2)}`, ratio2],
      [`Order: (${d.matches} − ${number(d.transpositions)}) / ${d.matches || 1} = ${number(order)}`, order],
      [`Jaro: (${number(ratio1)} + ${number(ratio2)} + ${number(order)}) / 3 = ${number(d.jaro)}`, d.jaro],
      [d.adjusted ? `Winkler: ${d.prefix} × 0.1 × (1 − ${number(d.jaro)}) = +${number(bonus)}` : `Winkler: Jaro ≤ 0.7 ∴ ${number(0)}`, bonus],
      [`Final: ${number(d.jaro)} + ${number(bonus)} = ${number(d.score)}`, d.score]
    ];
    const steps = make('div', 'breakdown-steps');
    lines.forEach(([line, value], i) => {
      const row = make('div', 'breakdown-step');
      const track = make('span', 'mini-track');
      track.title = i === 4 ? `Winkler bonus: ${number(value)} (bar scale 0–0.120)` : `${['Generated ratio','Reference ratio','Letter order','Jaro','Winkler bonus','Final score'][i]}: ${percent(value)}`;
      const fill = make('span', 'mini-fill');
      fill.style.width = `${Math.max(0, Math.min(100, value / (i === 4 ? 0.120 : 1) * 100))}%`;
      track.append(fill);
      const formula = make('span', 'breakdown-formula', line);
      row.append(track, formula);
      steps.append(row);
    });
    col.append(steps);
    grid.append(col);
  }
  panel.append(grid);
  return panel;
}

function analyse(text, config) {
  if (!config) return null;
  const parts = text.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const score = (jaroWinkler(parts[0], config.reference[0]) + jaroWinkler(parts[1], config.reference[1])) / 2;
  return { rawScore: score, percent: Math.round(score * 100), category: score >= config.thresholds[1] ? 'close' : score >= config.thresholds[0] ? 'mid' : 'far' };
}
// Derive percentile cutoffs from every possible name in the loaded JSON.
// All combinations are equally likely; no historical population assumptions.
let percentileLimits = null;
let distribution = null;
function calculateDistribution(grammar) {
  const first = grammar.first.map(word => jaroWinkler(word, config.reference[0]));
  const last = grammar.last.map(word => jaroWinkler(word, config.reference[1]));
  const scores = [];
  for (const a of first) for (const b of last) scores.push((a + b) / 2);
  scores.sort((a,b) => a-b);
  const n = scores.length;
  if (!n) throw Error('Cumberbot grammar has no possible names');
  const quantile = p => {
    const position = (n-1)*p, lower = Math.floor(position), upper = Math.ceil(position);
    return scores[lower] + (scores[upper]-scores[lower])*(position-lower);
  };
  percentileLimits = {
    bottom5: quantile(.05), bottom10: quantile(.10),
    top10: quantile(.90), top5: quantile(.95)
  };
  distribution = {
    count:n, minimum:scores[0], maximum:scores[n-1],
    mean:scores.reduce((sum,x)=>sum+x,0)/n,
    median:quantile(.5), ...percentileLimits
  };
}
function percentileFlag(score) {
  if (!percentileLimits) return null;
  const x = score.rawScore;
  if (x >= percentileLimits.top5 - 1e-12) return 'TOP 5%';
  if (x >= percentileLimits.top10 - 1e-12) return 'TOP 10%';
  if (x <= percentileLimits.bottom5 + 1e-12) return 'BOTTOM 5%';
  if (x <= percentileLimits.bottom10 + 1e-12) return 'BOTTOM 10%';
  return null;
}
function createFlag(label, special = false) {
  const flag = document.createElement('span');
  flag.className = special ? 'exact-match-flag' : 'percentile-flag';
  flag.textContent = label;
  return flag;
}
function scoreChip(result, small = false) {
  const chip = document.createElement('span');
  chip.className = `score-chip score-${result.category}${small ? ' small' : ''}`;
  chip.setAttribute('aria-label', `${result.percent}% spelling similarity`);
  const number = document.createElement('span'); number.textContent = `${result.percent}%`;
  chip.append(number);
  return chip;
}

GE.registry.push({
 id:'benedict', label:'Cumberbot9000', title:'Cumberbot9000', published:'2017-03-13',
 description:'Benedict Cumberbatch has one of the most entertaining names in showbusiness. This little machine dreams up alternative versions, from almost believable to completely ridiculous.',
 methodHTML:'Each name is compared with “Benedict Cumberbatch” using <a href="https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance" target="_blank" rel="noopener noreferrer">Jaro–Winkler similarity ↗</a>. The score looks at shared letters, how closely their positions and order match, and whether the words start alike. First name and surname are scored separately, then averaged.',
 grammarURL:'grammars/cumberbot9000.json',
 initialise(grammar){this.grammar=grammar;calculateDistribution(grammar);this.distribution=distribution;},
 example:'→ #first# #last#', note:'A set of rules; countless possible combinations.',
 draw(){return {text:GE.expand(this.grammar)};},
 decorate(draw, label, nameWrap, li){
  const result=analyse(draw.text,config); if(!result)return;
  const group=GE.el('span','score-group');
  if(draw.text==='Benedict Cumberbatch')group.append(createFlag('★ THE REAL DEAL!',true));
  else {const tier=percentileFlag(result);if(tier)group.append(createFlag(tier));}
  const detail=scoreExplanation(draw.text,config);
  nameWrap.append(GE.disclosure(label,detail,'similarity calculation for '+draw.text));
  group.append(scoreChip(result,true));li.append(group,detail);
 },
 legend(holder){
  for(const [cls,label] of [['far','Distant <50%'],['mid','Moderate 50–57%'],['close','Close ≥58%']]){
    const item=GE.el('span','legend-item'),swatch=GE.el('span','legend-swatch score-'+cls);swatch.setAttribute('aria-hidden','true');
    item.append(swatch,GE.el('span','',label));holder.append(item);
  }holder.append(GE.el('span','','Spelling similarity, not quality'));
 }
});
})();
