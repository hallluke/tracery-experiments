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

 // A single button controls each result's disclosure.
 // The final word and +/- indicator stay together when text wraps.
GE.disclosure = (label, detail, description) => {
  const id = 'ge-detail-' + (GE._detailId = (GE._detailId || 0) + 1);
  detail.id = id;
  const text = label.textContent;
  const match = text.match(/(\S+)$/u);
  const ending = GE.el('span', 'result-ending');
  const indicator = GE.el('span', 'score-expand', '+');
  indicator.setAttribute('aria-hidden', 'true');
  if (match) {
    label.textContent = text.slice(0, match.index);
    ending.append(document.createTextNode(match[1]));
  } else {
    label.textContent = '';
  }
  ending.append(indicator);
  label.append(ending);
  detail._disclosureControls = { label, indicator, description };
  label.setAttribute('aria-controls', id);
  label.addEventListener('click', () => GE.setDisclosure(detail, detail.hidden));
  GE.setDisclosure(detail, false, false);
};

GE.setDisclosure = (detail, expanded, notify = true) => {
  const controls = detail._disclosureControls;
  if (!controls) return;
  detail.hidden = !expanded;
  const { label, indicator, description } = controls;
  indicator.textContent = expanded ? '−' : '+';
  label.setAttribute('aria-expanded', String(expanded));
  label.setAttribute(
    'aria-label',
    (expanded ? 'Hide ' : 'Show ') + description
  );
  if (notify) {
    detail.dispatchEvent(
      new CustomEvent('ge:disclosurechange', { bubbles: true })
    );
  }
};
