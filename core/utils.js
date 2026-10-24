window.GE = window.GE || { registry: [] };
GE.el = (tag, cls, text) => { const e=document.createElement(tag); if(cls)e.className=cls; if(text!==undefined)e.textContent=text; return e; };
GE.choose = items => items[Math.floor(Math.random()*items.length)];
GE.expand = (rules, origin='origin') => {
  const expandRule = (key, depth=0) => {
    if(depth>15) throw Error('Grammar expansion too deep');
    if(!Array.isArray(rules[key]) || !rules[key].length) throw Error('Missing grammar rule: '+key);
    return String(GE.choose(rules[key])).replace(/#([^#]+)#/g, (_,next)=>expandRule(next,depth+1));
  };
  return expandRule(origin);
};
// A disclosure is controlled by its own name and +/- button. Both controls
// share the same state, and changes notify the collection-level action.
GE.disclosure = (label, detail, description) => {
  const toggle=GE.el('button','score-expand','+'); toggle.type='button';
  const id='ge-detail-'+(GE._detailId=(GE._detailId||0)+1);
  detail.id=id;
  detail._disclosureControls={toggle,label,description};
  toggle.setAttribute('aria-controls',id);
  label.setAttribute('aria-controls',id);
  toggle.addEventListener('click',()=>GE.setDisclosure(detail,detail.hidden));
  label.addEventListener('click',()=>GE.setDisclosure(detail,detail.hidden));
  GE.setDisclosure(detail,false,false);
  return toggle;
};
GE.setDisclosure=(detail,expanded,notify=true)=>{
  const controls=detail._disclosureControls;
  if(!controls)return;
  detail.hidden=!expanded;
  const {toggle,label,description}=controls;
  toggle.textContent=expanded?'−':'+';
  toggle.setAttribute('aria-expanded',String(expanded));
  label.setAttribute('aria-expanded',String(expanded));
  toggle.setAttribute('aria-label',(expanded?'Hide ':'Show ')+description);
  if(notify)detail.dispatchEvent(new CustomEvent('ge:disclosurechange',{bubbles:true}));
};
