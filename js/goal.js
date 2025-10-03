// ==========================
// Security & constants
// ==========================
var NS = 'thisdive';
var K_P2_CURRENT    = NS + '.p2:current';  // emotion 페이지 현재 상태
var K_P3_LASTSOURCE = NS + '.p3:lastSource';
var K_G_DATA        = NS + '.g:data';      // goal 페이지 데이터
var K_REWARD        = NS + '.reward';      // ▶ timer와 공유

// DOM helpers
function $(s, r){ return (r||document).querySelector(s); }
function $$(s, r){ return Array.from((r||document).querySelectorAll(s)); }

// Elements
var catField  = $('#catField');
var readout   = $('#readout');
var goalEl    = $('#goalInput');
var rewardEl  = $('#rewardInput');
var nextBtn   = $('#nextBtn');

// Stars text
var diffText  = {0:'목표의 난이도를 선택하세요.', 1:'아주 쉽게', 2:'쉽게', 3:'적당하게', 4:'약간 어렵게', 5:'도전!'};

// ==========================
// Reset if emotion changed
// ==========================
(function compareEmotionAndResetIfChanged(){
  try{
    var cur  = localStorage.getItem(K_P2_CURRENT)    || '';
    var last = localStorage.getItem(K_P3_LASTSOURCE) || '';

    if (cur !== last) {
      // 저장값 삭제
      try{ localStorage.removeItem(K_G_DATA); }catch(_){}
      try{ sessionStorage.removeItem(K_REWARD); }catch(_){}

      // UI 초기화
      try{
        $$('#catField .chip').forEach(c=>{
          c.classList.remove('on');
          var r = c.querySelector('input[type="radio"]');
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

// ==========================
// UI helpers
// ==========================
function updateReadout(v){ if (readout) readout.textContent = diffText[Number(v) || 0]; }
function currentDiff(){
  var sel = $('input[name="difficulty"]:checked');
  return sel ? Number(sel.value) : 0;
}
function save(){
  var cat    = (catField?.querySelector('input:checked')||{}).value || '';
  var diff   = currentDiff();
  var goal   = goalEl?.value || '';
  var reward = rewardEl?.value || '';
  var data   = {cat, diff, goal, reward, at: Date.now()};
  try{
    localStorage.setItem(K_G_DATA, JSON.stringify(data));
    sessionStorage.setItem(NS + '.goal', goal);
    sessionStorage.setItem(NS + '.cat',  cat);
    sessionStorage.setItem(K_REWARD, reward); // ▶ timer에서 사용
  }catch(_){}
}

// ==========================
// Restore state
// ==========================
(function restore(){
  updateReadout(0);
  try{
    var raw = localStorage.getItem(K_G_DATA);
    if(raw){
      var d = JSON.parse(raw);
      if (d.cat) {
        var chip = [...$$('#catField label.chip input')].find(i=>i.value===d.cat);
        if (chip) { chip.checked = true; chip.closest('.chip')?.classList.add('on'); }
      }
      if (d.diff) {
        var r = $('#diff-' + d.diff);
        if (r){ r.checked = true; updateReadout(d.diff); }
      }
      if (typeof d.goal === 'string' && goalEl)   goalEl.value = d.goal;
      if (typeof d.reward === 'string' && rewardEl) rewardEl.value = d.reward;
    } else {
      // 세션에 reward만 남아있을 수 있음
      var sr = (sessionStorage.getItem(K_REWARD) || '').trim();
      if (sr && rewardEl) rewardEl.value = sr;
    }
  }catch(_){}
})();

// ==========================
// Category chips
// ==========================
catField?.addEventListener('click', (e)=>{
  var label = e.target.closest('.chip');
  if(!label) return;
  var input = label.querySelector('input[type="radio"]');
  if(!input) return;
  input.checked = true;
  $$('#catField .chip').forEach(c=> c.classList.remove('on'));
  label.classList.add('on');
  save();
});

// ==========================
// Stars (accessibility)
// ==========================
(function initStars(){
  var radios = [...$$('#starsGroup input[name="difficulty"]')];
  var labels = [...$$('#starsGroup label[for]')];

  function setDifficulty(v){ updateReadout(v); save(); }

  radios.forEach(r=>{
    r.addEventListener('change', ()=> setDifficulty(r.value));
  });

  labels.forEach(l=>{
    l.addEventListener('click', ()=>{
      var id = l.getAttribute('for');
      var el = $('#' + id);
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
        var prev = [...radios].reverse().find(x=> +x.value < +r.value);
        if(prev){ prev.checked = true; prev.dispatchEvent(new Event('change', {bubbles:true})); prev.focus(); }
      }
      if(e.key==='ArrowRight' || e.key==='ArrowUp'){
        e.preventDefault();
        var next = [...radios].find(x=> +x.value > +r.value);
        if(next){ next.checked = true; next.dispatchEvent(new Event('change', {bubbles:true})); next.focus(); }
      }
    });
  });

  setDifficulty(($('input[name="difficulty"]:checked')||{}).value || 0);
})();

// ==========================
// Inputs save
// ==========================
goalEl?.addEventListener('input', save);
rewardEl?.addEventListener('input', save);

// ==========================
// CTA → timer
// ==========================
(function bindCTA(){
  const go = (ev)=>{
    try{ ev.preventDefault(); ev.stopPropagation(); }catch(_){}
    const goal   = (goalEl?.value||'').trim();
    const reward = (rewardEl?.value||'').trim();
    try{
      sessionStorage.setItem(NS + '.goal', goal);
      sessionStorage.setItem(K_REWARD, reward);
    }catch(_){}
    const qs = new URLSearchParams({ goal, reward, v:String(Date.now()) });
    const target = `timer.html?${qs.toString()}`;
    try { window.location.assign(target); }
    catch { window.location.href = target; }
  };
  if (nextBtn){
    ['click','touchend','pointerup'].forEach(evt =>
      nextBtn.addEventListener(evt, go, { passive:false })
    );
  }
})();
