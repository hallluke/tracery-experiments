
/* ============================================================
   EXPERIMENT METADATA, GENERATION AND DISPLAY — GHOST-ECHOES
   ============================================================ */
(function(){
const EDITIONS={edition_one:['First',1975],edition_two:['Second',1978],edition_three:['Third',1979],edition_four:['Fourth',1996]};
const MERGES = [
  [
    "Simple subtraction",
    "Simple Subtraction"
  ],
  [
    "Remember those quiet evenings",
    "Remember .those quiet evenings"
  ],
  [
    "Emphasise differences",
    "Emphasize differences"
  ],
  [
    "Emphasise the flaws",
    "Emphasize the flaws"
  ],
  [
    "Imagine the music as a set of disconnected events",
    "Imagine the piece as a set of disconnected events"
  ],
  [
    "Not building a wall but making a brick",
    "Not building a wall; making a brick"
  ],
  [
    "Always first steps",
    "Always the first steps"
  ],
  [
    "State the problem in words as clearly as possible",
    "State the problem as clearly as possible"
  ],
  [
    "Don't stress one thing more than another",
    "Don't stress *on* thing more than another (sic)"
  ],
  [
    "Remember those quiet evenings",
    "Remember quiet evenings"
  ],
  [
    "Would anybody want it?",
    "Would anyone want it?"
  ],
  [
    "Is the tuning intonation correct?",
    "Is the intonation correct?"
  ],
  [
    "Destroy -nothing -the most important thing",
    "Destroy nothing; Destroy the most important thing"
  ],
  [
    "Is there something missing?",
    "Is something missing?"
  ],
  [
    "Remember .those quiet evenings",
    "Remember quiet evenings"
  ]
];
// Every printed word contributes. Approved spelling variants share one frequency key;
// editorially grouped strategies remain a single reference document.
const SPELLINGS = new Map([['emphasize','emphasise']]);
const words = text => [...new Set((text.toLowerCase().normalize('NFC').match(/[\p{L}]+(?:[’'][\p{L}]+)*/gu)||[]).map(w=>SPELLINGS.get(w)||w))];
function buildIndex(grammar){
 const entries=Object.keys(EDITIONS).flatMap(key=>grammar[key]);
 const texts=[...new Set(entries)];const parent=new Map(texts.map(x=>[x,x]));
 const root=x=>{while(parent.get(x)!==x)x=parent.get(x);return x;};
 for(const [a,b] of MERGES){if(!parent.has(a)||!parent.has(b))throw Error('Unknown Ghost Echoes merge: '+a+' / '+b);parent.set(root(b),root(a));}
 const groups=new Map();for(const text of texts){const id=root(text);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(text);}
 // Document frequency counts one normalised identity once, using the union of its variants.
 const docs=[...groups.values()].map(variants=>new Set(variants.flatMap(words)));
 const df=new Map();for(const doc of docs)for(const word of doc)df.set(word,(df.get(word)||0)+1);
 const idf=w=>1+Math.log((docs.length+1)/((df.get(w)||0)+1));
 const maxIDF=1+Math.log((docs.length+1)/2);
 const scoreVariant=text=>{const vocab=words(text);return vocab.reduce((sum,w)=>sum+idf(w),0)/vocab.length;};
 // Each identity gets one reference score: the mean of its distinct wording variants.
 const raw=new Map();for(const [id,variants] of groups)raw.set(id,variants.reduce((sum,v)=>sum+scoreVariant(v),0)/variants.length);
 const ordered=[...raw.entries()].sort((a,b)=>a[1]-b[1]);
 const ranks=new Map();let i=0;while(i<ordered.length){let j=i+1;while(j<ordered.length&&Math.abs(ordered[j][1]-ordered[i][1])<1e-10)j++;
   const rank=j/ordered.length*100; // inclusive empirical percentile; ties share rank
   for(let k=i;k<j;k++)ranks.set(ordered[k][0],rank);i=j;
 }
 const editionLookup=new Map();
 for(const key of Object.keys(EDITIONS))for(const text of grammar[key]){
   const id=root(text);if(!editionLookup.has(id))editionLookup.set(id,new Set());editionLookup.get(id).add(key);
 }
 return {count:groups.size,maxIDF,identity:text=>root(text),editions:text=>[...(editionLookup.get(root(text))||[])],
   score:text=>({raw:scoreVariant(text),rank:ranks.get(root(text)),referenceRaw:raw.get(root(text)),
     words:words(text).map(word=>({word,frequency:df.get(word),idf:idf(word)})).sort((a,b)=>b.idf-a.idf||a.word.localeCompare(b.word))})};
}
let index = null;
// Edition appearances use approved normalised identities, including curated near-matches.
GE.registry.push({
 id:'ghost',label:'Ghost Echoes',title:'Ghost Echoes',published:'',
 description:'Draw a creative prompt from Brian Eno and Peter Schmidt’s Oblique Strategies, subtitled “Over One Hundred Worthwhile Dilemmas”. Each card offers a fresh way to approach a problem or creative block.',
 methodHTML:'Read more about <a href="https://en.wikipedia.org/wiki/Oblique_Strategies" target="_blank" rel="noopener noreferrer">Oblique Strategies ↗</a>. Word rarity uses inverse document frequency (IDF) across 0 normalised strategies: 1 + ln((1) / (number of strategies containing the word + 1)). Every word on the drawn card contributes to its average rarity. For ranking, each normalised strategy receives the average score of its wording variants. The percentile is the percentage of strategies with an equal or lower reference score (ties share a rank); the score describes vocabulary, not quality.',
 grammarURL:'grammars/ghost-echoes.json',
 initialise(grammar){this.grammar=grammar;index=buildIndex(grammar);this.methodHTML=this.methodHTML.replace(/across \d+ normalised strategies: 1 \+ ln\(\(\d+\)/, 'across '+index.count+' normalised strategies: 1 + ln(('+ (index.count+1) +')');},
 example:'→ #edition_one# / #edition_two# / #edition_three# / #edition_four#',note:'One edition is chosen at random, then one entry from that edition.',
 draw(){const key=GE.choose(this.grammar.origin).replaceAll('#','');const cards=this.grammar[key],i=Math.floor(Math.random()*cards.length);return {text:cards[i],edition:key,index:i+1,total:cards.length};},
 decorate(draw,label,nameWrap,li){
   const metric=index.score(draw.text);const category=metric.rank>=66.6666667?'close':metric.rank>=33.3333333?'mid':'far';
   const chip=GE.el('span','score-chip score-'+category+' small');chip.setAttribute('aria-label','Vocabulary rarity inclusive percentile '+Math.round(metric.rank));chip.append(GE.el('span','',String(Math.round(metric.rank))));
   // Special badges are based on the printed card, not the normalised identity.
   // The shortest-card badge takes precedence over the one-word badge.
   const group=GE.el('span','score-group');
   const text=draw.text.trim();
   const lower=text.toLocaleLowerCase('en');
   const badge=(title,special=false)=>{const node=GE.el('span',special?'exact-match-flag':'percentile-flag',title);group.append(node);};
   if(lower==='ghost echoes')badge('★ THE NAMESAKE',true);
   else if(lower==='retrace your steps')badge('★ PERSONAL FAVOURITE',true);
   else {
     if(text.length===5 && lower==='water')badge('SHORTEST');
     else if(text.length===84 && text==='Make an exhaustive list of everything you might do and do the last thing on the list')badge('LONGEST');
     else if((text.match(/[\p{L}]+(?:[’'][\p{L}]+)*/gu)||[]).length===1)badge('ONE WORD');
     if(text.includes('?'))badge('QUESTION?');
   }
   group.append(chip);
   const detail=GE.el('div','score-breakdown ghost-breakdown');const edition=EDITIONS[draw.edition];
   const present=new Set(index.editions(draw.text));
   detail.append(GE.el('h4','ghost-heading',edition[0]+' edition ('+edition[1]+')'));
   function row(value, caption, accessible){
     const r=GE.el('div','ghost-stat-row'),track=GE.el('span','ghost-mini-track'),fill=GE.el('span','ghost-mini-fill');
     fill.style.width=Math.max(0,Math.min(100,value*100))+'%';track.append(fill);track.setAttribute('role','img');track.setAttribute('aria-label',accessible||caption);r.append(track,GE.el('span','ghost-stat-label',caption));detail.append(r);
   }
   row(draw.index/draw.total,'Entry '+draw.index+' / '+draw.total,'Entry '+draw.index+' of '+draw.total);
   const editionRow=GE.el('div','ghost-stat-row'),blocks=GE.el('span','ghost-edition-blocks');
   for(const key of Object.keys(EDITIONS)){
     const block=GE.el('span','ghost-edition-block'+(present.has(key)?' is-present':''));
     block.title=EDITIONS[key][0]+' edition ('+EDITIONS[key][1]+'): '+(present.has(key)?'present':'absent');
     blocks.append(block);
   }
   blocks.setAttribute('role','img');blocks.setAttribute('aria-label','Appears in '+[...present].map(key=>EDITIONS[key][0]+' edition ('+EDITIONS[key][1]+')').join(', '));
   const editionText=present.size===1?'Unique to this edition':'Appears in editions '+Object.keys(EDITIONS).filter(key=>present.has(key)).map(key=>['I','II','III','IV'][Object.keys(EDITIONS).indexOf(key)]).join(', ');
   editionRow.append(blocks,GE.el('span','ghost-stat-label',editionText));detail.append(editionRow);
   row(metric.raw/index.maxIDF,'Word rarity: '+metric.raw.toFixed(3)+' / '+index.maxIDF.toFixed(3),'Average inverse document frequency '+metric.raw.toFixed(3)+' out of '+index.maxIDF.toFixed(3));
   // Show at most three highest-rarity words, but calculate the average from ALL eligible words.
   const top=metric.words.slice(0,3);
   if(top.length){
     for(const item of top){
       row(item.idf/index.maxIDF,item.word+': 1 + ln('+(index.count+1)+' / '+(item.frequency+1)+') = '+item.idf.toFixed(3),item.word+' appears in '+item.frequency+' of '+index.count+' strategies; rarity '+item.idf.toFixed(3));
     }
   }
   nameWrap.append(GE.disclosure(label,detail,'edition and vocabulary details for '+draw.text));li.append(group,detail);
 },
 legend(holder){for(const [cls,label] of [['far','Common · bottom third'],['mid','Mixed · middle third'],['close','Rare · top third']]){const item=GE.el('span','legend-item'),swatch=GE.el('span','legend-swatch score-'+cls);item.append(swatch,GE.el('span','',label));holder.append(item);}holder.append(GE.el('span','','Word uniqueness percentile, not card quality'));}
});
})();
