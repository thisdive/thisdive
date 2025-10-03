// ===== Constants / Keys =====
const NS = 'thisdive';
const K_P2_CURRENT    = `${NS}.p2:current`;     // 2페이지(감정) 현재 스냅샷
const K_P3_LASTSOURCE = `${NS}.p3:lastSource`;  // goal이 마지막으로 참고한 감정 스냅샷
const K_G_DATA        = `${NS}.g:data`;         // goal 입력 스냅샷
const K_REWARD        = `${NS}.reward`;         // timer와 공유

// DOM helpers
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// Elements
const catField  = $('#catField');
const readout   = $('#readout');
const goalEl    = $('#goalInput');
const rewardEl  = $('#rewardInput');
const nextBtn   = $('#nextBtn');

// Stars text
const diffText  = {
  0:'목표의 난이도를 선택하세요.',
  1:'아주 쉽게',
  2:'쉽게',
  3:'적당하게',
  4:'약간 어렵게',
  5:'도전!'
};

// ===== 감정 변경 감지 → 초기화 =====
(function compareEmotionAndResetIfChanged(){
  try {
    const cur  = (localStorage.getItem(K_P2_CURRENT) || '').trim();
    const last = (localStorage.getItem(K_P3_LASTSOURCE) || '').trim();

    const emotionChanged = !cur || (cur !== last); // 비어있어도 리셋
    if (emotionChanged) {
      try {
        localStorage.removeItem(K_G_DATA);
        sessionStorage.removeItem(`${NS}.goal`);
        sessionStorage.removeItem(`${NS}.cat`);
        sessionStorage.removeItem(K_REWARD);
      } catch (_) {}

      // UI 초기화
      try {
        $$('#catField .chip').forEach(c=>{
          c.classList.remove('on');
          const r = c.querySelector('input[type="radio"]');
          if (r) r.checked = false;
        });
        $$('input[name="difficulty"]').forEach(r=> r.checked = false);
        updateReadout(0);
        if (goalEl) goalEl.value = '';
        if (rewardEl) rewardEl.value = '';
      } catch (_) {}
    }

    localStorage.setItem(K_P3_LASTSOURCE, cur);
  } catch (_) {}
})();

// ===== UI helpers =====
function updateReadout(v){ readout && (readout.textContent = diffText[Number(v) || 0]); }
function currentDiff(){
  const sel = document.querySelector('input[name="difficulty"]:checked');
  return sel ? Number(sel.value) : 0;
}
function save(){
  const cat    = (catField?.querySelector('input:checked')||{}).value || '';
  const diff   = currentDiff();
  const goal   = goalEl?.value || '';
  const reward = rewardEl?.value || '';
  const data   = {cat, diff, goal, reward, at: Date.now()};
  try {
    localStorage.setItem(K_G_DATA, JSON.stringify(data));
    sessionStorage.setItem(`${NS}.goal`, goal);
    sessionStorage.setItem(`${NS}.cat`,  cat);
    sessionStorage.setItem(K_REWARD, reward);
  } catch(_) {}
}

// ===== Restore =====
(function restore(){
  updateReadout(0);
  try {
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
      if (typeof d.goal === 'string'   && goalEl)   goalEl.value   = d.goal;
      if (typeof d.reward === 'string' && rewardEl) rewardEl.value = d.reward;
    } else {
      const sr = (sessionStorage.getItem(K_REWARD) || '').trim();
      if (sr && rewardEl) rewardEl.value = sr;
    }
  } catch(_) {}
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

// ===== Stars =====
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
      const el = document.getElementById(id);
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

  setDifficulty((document.querySelector('input[name="difficulty"]:checked')||{}).value || 0);
})();

// ===== CTA → timer (a[href] 백업 + 파라미터 합치기) =====
(function bindCTA(){
  const buildURL = () => {
    const goal   = (goalEl?.value||'').trim();
    const reward = (rewardEl?.value||'').trim();

    try {
      sessionStorage.setItem(`${NS}.goal`, goal);
      sessionStorage.setItem(K_REWARD, reward);
    } catch(_) {}

    const base = (nextBtn?.getAttribute('href') || 'timer.html').replace(/\?.*$/, '');
    const qs   = new URLSearchParams({ goal, reward, v: String(Date.now()) }).toString();
    return `${base}?${qs}`;
  };

  const go = (ev)=>{
    try { ev.preventDefault(); ev.stopPropagation(); } catch(_) {}
    const url = buildURL();
    try { location.assign(url); } catch { location.href = url; }
  };

  if (nextBtn) {
    ['click','touchend','pointerup'].forEach(evt =>
      nextBtn.addEventListener(evt, go, { passive:false })
    );
  }
})();
