(function(){
const $=id=>document.getElementById(id), selector=$('grammar-select'),results=$('results-list'),status=$('status');
let current=null, outputs=[];
const allButton=$('toggle-all');
const disclosures=()=>[...results.querySelectorAll('.score-breakdown')].filter(d=>d._disclosureControls);
function updateAllButton(){
 const items=disclosures();allButton.hidden=!items.length;
 if(!items.length)return;
 // Prefer collapsing when anything is open; expand only if all are closed.
 const anyOpen=items.some(d=>!d.hidden);
 allButton.textContent=anyOpen?'Collapse all':'Expand all';
 allButton.setAttribute('aria-label',(anyOpen?'Collapse':'Expand')+' all result details');
}

function render(){
 if(!current)return;try{const count=Number($('quantity').value),fragment=document.createDocumentFragment();outputs=[];
 const previewMode=new URLSearchParams(location.search).get('preview');
 const preview=current.id==='benedict'&&previewMode==='badges';
 const ghostPreview=current.id==='ghost'&&previewMode==='ghost-flags';
 const demo=['Benedict Cumberbatch','Benedict Cucumber','Babadook Cabbagepatch','Bathysphere Constantine','Bumbaclaat Cyberpunk'];
 // Preview mode uses real edition entries so positions and calculations remain accurate.
 const ghostSamples=[['edition_one','Ghost echoes'],['edition_three','Retrace your steps'],
   ['edition_one','Water'],['edition_one','Make an exhaustive list of everything you might do and do the last thing on the list'],
   ['edition_two','Accretion'],['edition_one','Do we need holes?']];
 const ghostDraw=(i)=>{const [edition,text]=ghostSamples[i%ghostSamples.length],cards=current.grammar[edition];return {text,edition,index:cards.indexOf(text)+1,total:cards.length};};
 for(let i=0;i<count;i++){const draw=ghostPreview?ghostDraw(i):preview?{text:demo[i%demo.length]}:current.draw();outputs.push(draw.text);
  const li=GE.el('li'),wrap=GE.el('span','result-name-wrap'),label=GE.el('button','result-text',draw.text);label.type='button';wrap.append(label);li.append(wrap);
  if(current.decorate)current.decorate(draw,label,wrap,li);else {label.disabled=true;label.classList.add('plain-output');}
  fragment.append(li);
 }results.replaceChildren(fragment);$('copy-all').disabled=false;updateAllButton();status.textContent='';
 }catch(e){status.textContent='Couldn’t generate outputs: '+e.message;console.error(e);}
}
function select(id){current=GE.registry.find(x=>x.id===id)||GE.registry[0];selector.value=current.id;
 $('grammar-title').textContent=current.title;$('grammar-description').textContent=current.description;
 const method=$('experiment-method');method.innerHTML=current.methodHTML||'';method.hidden=!current.methodHTML;
 $('system-origin').textContent='#origin#';$('system-rule').textContent=current.example||'→ #origin#';
 $('system-rule').classList.toggle('ghost-rule',current.id==='ghost');
 document.querySelector('.system-note').textContent=current.note||'';
 $('experiment-counter').textContent='EXPERIMENT '+String(GE.registry.indexOf(current)+1).padStart(3,'0')+' / '+String(GE.registry.length).padStart(3,'0');
 const legend=$('analysis-legend');legend.replaceChildren();if(current.legend)current.legend(legend);legend.hidden=!current.legend;
 render();
}
async function copy(){try{await navigator.clipboard.writeText(outputs.join('\n'));const b=$('copy-all');b.textContent='Copied ✓';setTimeout(()=>b.textContent='Copy all ↗',1400);}catch{status.textContent='Clipboard access was blocked. Try hosting over HTTPS.';}}
for(const x of GE.registry){const o=GE.el('option','',x.label);o.value=x.id;selector.append(o);}
selector.addEventListener('change',()=>select(selector.value));$('generate-many').addEventListener('click',render);$('quantity').addEventListener('change',render);$('copy-all').addEventListener('click',copy);
allButton.addEventListener('click',()=>{const items=disclosures();const expand=!items.some(d=>!d.hidden);for(const d of items)GE.setDisclosure(d,expand);updateAllButton();});
results.addEventListener('ge:disclosurechange',updateAllButton);
$('generate-many').disabled=false;
if(new URLSearchParams(location.search).get('preview')==='ghost-flags')$('quantity').value='10';
select(new URLSearchParams(location.search).get('preview')==='ghost-flags'?'ghost':'benedict');
})();
