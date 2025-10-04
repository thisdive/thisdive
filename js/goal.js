const NS = 'thisdive';
const K_P2_CURRENT    = NS + '.p2:current';
const K_P3_LASTSOURCE = NS + '.p3:lastSource';
const K_G_DATA        = NS + '.g:data';
const K_REWARD        = NS + '.reward';

function $(s,r){ return (r||document).querySelector(s); }
function $$(s,r){ return Array.from((r||document).querySelectorAll(s)); }

const catField = $('#catField');
const readout  = $('#readout');
const goalEl   = $('#goalInput');
const rewardEl = $('#rewardInput');
const nextBtn  = $('#nextBtn');

const diffText = {0:'목표의 난이도를 선택하세요.', 1:'아주 쉽게', 2:'쉽게', 3:'적당하게', 4:'약간 어렵게', 5:'도전!'};

// Emotion 변경 시 reset
(function(){
  try{
    const cur  = localStorage.getItem(K_P2_CURRENT)    || '';
    const last = localStorage.getItem(K_P3_LASTSOURCE) || '';
    if (cur !== last) {
      localStorage.removeItem(K_G_DATA);
      sessionStorage.removeItem(K_REWARD);
      $$('#catField .chip input').forEach(r=> r.checked=false);
      $$('input[name="difficulty"]').forEach(r=> r.checked=false);
      if (goalEl) goalEl.value = '';
      if (rewardEl) rewardEl.value = '';
      updateReadout(0);
    }
    localStorage.setItem(K_P3_LASTSOURCE, cur);
  }catch(_){}
})();

function updateReadout(v){ if (readout) readout.textContent = diffText[Number(v)||0]; }
function save(){
  const cat    = (catField?.querySelector('input:checked')||{}).value || '';
  const diff   = $('input[name="difficulty"]:checked')?.value || 0;
  const goal   = goalEl?.value || '';
  const reward = rewardEl?.value || '';
  try{
    localStorage.setItem(K_G_DATA, JSON.stringify({cat,diff,goal,reward,at:Date.now()}));
    sessionStorage.setItem(NS+'.goal', goal);
    sessionStorage.setItem(NS+'.cat',  cat);
    sessionStorage.setItem(K_REWARD, reward);
  }catch(_){}
}

// Restore
(function(){
  updateReadout(0);
  try{
    const raw = localStorage.getItem(K_G_DATA);
    if(raw){
      const d = JSON.parse(raw);
      if(d.cat){
        const chip = $(`#catField input[value="${d.cat}"]`);
        if(chip){ chip.checked = true; chip.closest('.chip').classList.add('on'); }
      }
      if(d.diff){ const r=$('#diff-'+d.diff); if(r){ r.checked=true; updateReadout(d.diff);} }
      if(goalEl) goalEl.value = d.goal||'';
      if(rewardEl) rewardEl.value = d.reward||'';
    }else{
      const sr = sessionStorage.getItem(K_REWARD)||'';
      if(sr && rewardEl) rewardEl.value=sr;
    }
  }catch(_){}
})();

// Event binding
catField?.addEventListener('click', e=>{
  const label = e.target.closest('.chip');
  if(!label) return;
  const input = label.querySelector('input[type="radio"]');
  if(!input) return;
  input.checked = true;
  $$('#catField .chip').forEach(c=> c.classList.remove('on'));
  label.classList.add('on');
  save();
});
$$('#starsGroup input').forEach(r=>{
  r.addEventListener('change', ()=>{ updateReadout(r.value); save(); });
});
goalEl?.addEventListener('input', save);
rewardEl?.addEventListener('input', save);

// CTA 이동
(function(){
  if(!nextBtn) return;
  let didGo=false;
  function go(ev){
    ev.preventDefault(); ev.stopPropagation();
    if(didGo) return;
    didGo=true;
    const goal=(goalEl?.value||'').trim();
    const reward=(rewardEl?.value||'').trim();
    try{
      sessionStorage.setItem(NS+'.goal',goal);
      sessionStorage.setItem(K_REWARD,reward);
    }catch(_){}
    const qs=new URLSearchParams({goal,reward,v:String(Date.now())});
    const target=`timer.html?${qs}`;
    window.location.href=target;
  }
  ['click','touchend','pointerup'].forEach(evt=>
    nextBtn.addEventListener(evt,go,{passive:false})
  );
  window.addEventListener('pageshow', e=>{ if(e.persisted) didGo=false; });
})();
