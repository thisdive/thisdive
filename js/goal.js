// ===== Constants / Keys =====
const NS = 'thisdive';
const K_P2_CURRENT    = `${NS}.p2:current`;     // 2페이지(감정) 현재 스냅샷
const K_P3_LASTSOURCE = `${NS}.p3:lastSource`;  // 3페이지가 직전에 참고했던 2페이지 스냅샷
const K_G_DATA        = `${NS}.g:data`;         // 3페이지(목표) 입력 스냅샷
const K_REWARD        = `${NS}.reward`;         // ▶ timer와 공유

// DOM helpers
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// Elements
const catField  = $('#catField');
const readout   = $('#readout');
const goalEl    = $('#goalInput');
const rewardEl  = $('#rewardInput');
const nextBtn   = $('#nextBtn');
const starsWrap = $('#starsGroup');

// Stars text
const diffText  = {0:'목표의 난이도를 선택하세요.', 1:'아주 쉽게', 2:'쉽게', 3:'적당하게', 4:'약간 어렵게', 5:'도전!'};

// ===== Init reset if emotion changed =====
(function compareEmotionAndResetIfChanged(){
  try{
    const cur = localStorage.getItem(K_P2_CURRENT)    || '';
    const last= localStorage.getItem(K_P3_LASTSOURCE) || '';

    if (cur !== last) {
      // 저장값 삭제
      try{ localStorage.removeItem(K_G_DATA); }catch(_){}

      // UI 초기화
      try{
        $$('#catField .chip').forEach(c=>{
          c.classList.remove('on');
          const r = c.querySelector('input[type="radio"]');
          if (r) r.checked = false;
        });
        $$('input[name="difficulty"]').forEach(r=> r.checked = false);
        updateReadout(0);
        if (goalEl) goalEl.value = '';
        if (rewardEl) rewardEl.value = '';
      }catch(_){}
    }
    localStorage.setItem(K_P3_LASTSOURCE, cur);
  }catch(_){}
})();

// ===== UI helpers =====
function updateReadout(v){ readout && (readout.textContent = diffText[Number(v) || 0]); }
function currentDiff(){
  const sel = $('input[name="difficulty"]:checked');
  return sel ? Number(sel.value) : 0;
}
function save(){
  const cat  = (catField?.querySelector('input:checked')||{}).value || '';
  const diff = currentDiff();
  const goal = goalEl?.value || '';
  const reward = rewardEl?.value || '';
  const data = {cat, diff, goal, reward, at: Date.now()};
  try{
    localStorage.setItem(K_G_DATA, JSON.stringify(data));
    sessionStorage.setItem(`${NS}.goal`, goal);
    sessionStorage.setItem(`${NS}.cat`,  cat);
    sessionStorage.setItem(K_REWARD, reward); // ▶ timer에서 사용
  }catch(_){}
}

// ===== Restore =====
(function restore(){
  updateReadout(0);
  try{
    const raw = localStorage.getItem(K_G_DATA);
    if(raw){
      const d = JSON.parse(raw);
      if (d.cat) {
        const chip = [...$$('#catField label.chip input')].find(i=>i.value===d.cat);
        if (chip) { chip.checked = true; chip.closest('.chip')?.classList.add('on'); }
      }
      if (d.diff) {
        const r = $('#diff-' + d.diff);
        if (r){ r.checked = true; updateReadout(d.diff); }
      }
      if (typeof d.goal === 'string' && goalEl)   goalEl.value = d.goal;
      if (typeof d.reward === 'string' && rewardEl) rewardEl.value = d.reward;
    } else {
      // 세션에 reward만 남아있을 수 있음
      const sr = (sessionStorage.getItem(K_REWARD) || '').trim();
      if (sr && rewardEl) rewardEl.value = sr;
    }
  }catch(_){}
})();

// ===== Category chips =====
catField?.addEventListener('click', (e)=>{
  const label = e.target.closest('.chip');
  if(!label) return;
  const input = label.querySelector('input[type="radio"]');
  if(!input) return;
  input.checked = true;
  $$('#catField .chip').forEach(c=> c.classList.remove('on'));
  label.classList.add('on');
  save();
});

// ===== Stars (accessibility) =====
(function initStars(){
  const radios = [...$$('#starsGroup input[name="difficulty"]')];
  const labels = [...$$('#starsGroup label[for]')];

  function setDifficulty(v){ updateReadout(v); save(); }

  radios.forEach(r=>{
    r.addEventListener('change', ()=> setDifficulty(r.value));
  });

  labels.forEach(l=>{
    l.addEventListener('click', ()=>{
      const id = l.getAttribute('for');
      const el = $('#' + id);
      if (el){
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles:true }));
      }
    });
  });

  radios.forEach(r=>{
    r.addEventListener('keydown', e=>{
      if(e.key==='ArrowLeft' || e.key==='ArrowDown'){
        e.preventDefault();
        const prev = [...radios].reverse().find(x=> +x.value < +r.value);
        if(prev){ prev.checked = true; prev.dispatchEvent(new Event('change', {bubbles:true})); prev.focus(); }
      }
      if(e.key==='ArrowRight' || e.key==='ArrowUp'){
        e.preventDefault();
        const next = [...radios].find(x=> +x.value > +r.value);
        if(next){ next.checked = true; next.dispatchEvent(new Event('change', {bubbles:true})); next.focus(); }
      }
    });
  });

  setDifficulty(($('input[name="difficulty"]:checked')||{}).value || 0);
})();

// ===== Inputs save =====
goalEl?.addEventListener('input', save);
rewardEl?.addEventListener('input', save);

// ===== CTA → timer (t-test.html) =====
(function bindCTA(){
  const go = (ev)=>{
    ev.preventDefault(); ev.stopPropagation();
    const goal   = (goalEl?.value||'').trim();
    const reward = (rewardEl?.value||'').trim();
    try{
      sessionStorage.setItem(`${NS}.goal`, goal);
      sessionStorage.setItem(K_REWARD, reward);
    }catch(_){}
    const qs = new URLSearchParams({ goal, reward, v:String(Date.now()) });
    const target = `timer.html?${qs.toString()}`;
    try { window.location.assign(target); } catch { window.location.href = target; }
  };
  if (nextBtn){
    ['click','touchend','pointerup'].forEach(evt =>
      nextBtn.addEventListener(evt, go, { passive:false })
    );
  }
})();
