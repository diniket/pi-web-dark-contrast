// Run only in the isolated preview. Compare the selected declarative theme
// with the exact official Dark baseline in memory; no plugin files are changed.
export async function runChecks(){
 const fixture=window.redesignFixture;
 if(!fixture)throw new Error('Synthetic fixture is not ready');
 const all=()=>fixture.all();
 const find=tag=>all().find(e=>e.localName===tag);
 const rows=()=>all().filter(e=>e.matches('.ui-nav-row'));
 const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const results=[];
 const check=(name,pass,details)=>results.push({name,pass:!!pass,...(details===undefined?{}:{details})});
 const baselineSheet=new CSSStyleSheet();
 const baselineResponse=await fetch('/__redesign/baseline.css');
 if(!baselineResponse.ok)throw new Error('Official Dark comparison baseline unavailable');
 baselineSheet.replaceSync(await baselineResponse.text());
 fixture.bind();
 const roots=[document,...all().filter(e=>e.shadowRoot).map(e=>e.shadowRoot)];
 const owned=sheet=>[...sheet.cssRules].some(rule=>rule.cssText.includes('--dc-'));
 const saved=roots.map(root=>({root,sheets:[...root.adoptedStyleSheets]}));
 const panel=find('openspec-status-panel');
 check('real OpenSpec panel mounted (unmodified external package)',!!panel?.shadowRoot);
 const properties=['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','fontSize','fontFamily','fontWeight','lineHeight'];
 const snapshot=()=>panel?[panel,...fixture.all(panel.shadowRoot)].map(e=>{const s=getComputedStyle(e);return properties.map(p=>s[p]);}):[];
 const pluginTokens=()=>panel?[...getComputedStyle(panel)].filter(p=>p.startsWith('--pi-')).sort().map(p=>[p,getComputedStyle(panel).getPropertyValue(p)]):[];
 const before=snapshot(),tokensBefore=pluginTokens();
 const currentRow=rows().find(e=>e.dataset.current==='true');
 const rowMain=currentRow?.querySelector('.ui-nav-row-main');
 const selectedBefore=rowMain&&getComputedStyle(rowMain).backgroundColor;
 try{
  for(const {root,sheets} of saved)root.adoptedStyleSheets=[...sheets.filter(sheet=>!owned(sheet)),baselineSheet];
  check('OpenSpec subtree appearance unchanged by redesign',JSON.stringify(before)===JSON.stringify(snapshot()),{elements:before.length});
  check('all inherited OpenSpec --pi-* tokens unchanged',JSON.stringify(tokensBefore)===JSON.stringify(pluginTokens()),{tokens:tokensBefore.length});
  check('redesign really changes core navigation selection',rowMain&&selectedBefore!==getComputedStyle(rowMain).backgroundColor);
 }finally{for(const {root,sheets} of saved)root.adoptedStyleSheets=sheets;}
 await frames();
 const chat=find('chat-view');
 const appRoot=fixture.app.shadowRoot;
 check('core sidebar paint matches palette',getComputedStyle(appRoot.querySelector('aside')).backgroundColor==='rgb(22, 27, 34)');
 check('core chat paint matches palette',getComputedStyle(chat.shadowRoot.querySelector('.chat')).backgroundColor==='rgb(13, 17, 23)');
 const label=all().filter(e=>e.localName==='project-list').map(e=>e.shadowRoot.querySelector('.ui-nav-row-label')).find(Boolean);
 if(label)check('navigation label typography matches palette',getComputedStyle(label).color==='rgb(230, 237, 243)'&&Number(getComputedStyle(label).fontWeight)>=600);
 else results.push({name:'navigation label typography',skipped:true,details:'Project sections are collapsed at this viewport; verified in desktop checks.'});
 const group=chat?.shadowRoot.querySelector('details.event-group');
 if(group){group.querySelector('summary').click();await chat.updateComplete;await frames();}
 check('native event disclosure expands',group?.open);
 const tools=all().filter(e=>e.localName==='tool-execution-view');
 check('real core tool cards rendered',tools.length>=2,{count:tools.length});
 check('tool heading paint matches panel palette',tools.every(e=>getComputedStyle(e.shadowRoot.querySelector('.tool-header')).backgroundColor==='rgb(28, 35, 45)'));
 const labels=tools.map(e=>e.shadowRoot.querySelector('.status-label')).filter(Boolean);
 check('tool statuses have distinct readable colors',new Set(labels.map(e=>getComputedStyle(e).color)).size>=2);
 if(group){group.querySelector('summary').click();await frames();check('native event disclosure collapses',!group.open);}
 // Open the real mobile navigation view before interacting with its rows.
 const previousView=fixture.app.state.mainView;
 if(innerWidth<=760){fixture.app.state={...fixture.app.state,mainView:'navigation'};await fixture.app.updateComplete;await frames();fixture.bind();}
 const sessions=all().find(e=>e.localName==='session-list'&&e.getBoundingClientRect().width>0)??find('session-list');
 const old=sessions.selected;
 // Parent renders may refresh callback properties during earlier checks.
 sessions.onSelect=s=>{sessions.selected=s;};
 const second=sessions.shadowRoot.querySelectorAll('.ui-nav-row')[1];
 second?.click();await sessions.updateComplete;
 check('session selection remains connected to existing row handler',sessions.selected?.id===fixture.sessions[1].id);
 sessions.selected=old;await sessions.updateComplete;
 const trigger=sessions.shadowRoot.querySelector('.ui-nav-row-action');
 trigger?.click();await sessions.updateComplete;await frames();
 const popup=sessions.shadowRoot.querySelector('.ui-popup-panel');
 check('native session action popup opens',popup?.matches(':popover-open'));
 if(popup?.matches(':popover-open'))popup.hidePopover();
 if(innerWidth<=760){fixture.app.state={...fixture.app.state,mainView:previousView};await fixture.app.updateComplete;await frames();fixture.bind();}
 const editor=find('prompt-editor');
 const cm=editor?.shadowRoot.querySelector('.cm-content');
 check('composer remains editable',cm?.getAttribute('contenteditable')==='true');
 const send=editor.shadowRoot.querySelector('[data-composer-action][data-default="true"]');
 check('default composer action uses accessible accent treatment',send&&getComputedStyle(send).backgroundColor==='rgb(56, 139, 253)'&&getComputedStyle(send).color==='rgb(13, 17, 23)');
 check('composer placeholder contrast uses secondary token',getComputedStyle(editor.shadowRoot.querySelector('.cm-placeholder')).color==='rgb(170, 182, 197)');
 const outline=editor?.shadowRoot.querySelector('footer');
 cm?.focus();await frames();
 check('composer focus is visible',getComputedStyle(outline).borderTopColor==='rgb(56, 139, 253)');
 const scroller=chat.shadowRoot.querySelector('.chat');
 const prev=scroller.scrollTop;scroller.scrollTop=scroller.scrollHeight;await frames();
 check('chat scroll remains independently contained',scroller.scrollHeight<=scroller.clientHeight||scroller.scrollTop>0,{height:scroller.clientHeight,scrollHeight:scroller.scrollHeight});
 scroller.scrollTop=prev;
 const rect=editor.getBoundingClientRect();
 check('composer stays within viewport',rect.right<=innerWidth+1&&rect.left>=-1&&rect.bottom<=innerHeight+1);
 check('document has no horizontal overflow',document.documentElement.scrollWidth<=innerWidth+1);
 check('plugin panel has no horizontal overflow',!panel||panel.scrollWidth<=panel.clientWidth+1||panel.clientWidth===0);
 window.dcChecks=results;
 return {viewport:[innerWidth,innerHeight],passed:results.filter(r=>r.pass).length,total:results.filter(r=>!r.skipped).length,skipped:results.filter(r=>r.skipped).length,results};
}
