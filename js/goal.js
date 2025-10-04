// ==========================
// Keys
// ==========================
var NS = 'thisdive';
var K_P2_CURRENT    = NS + '.p2:current';  // emotion 페이지 현재 상태(JSON: {value, at})
var K_P3_LASTSOURCE = NS + '.p3:lastSource'; // 마지막에 goal이 참고한 'emotion value'(문자열)
var K_G_DATA        = NS + '.g:data';      // goal 스냅샷
var K_REWARD        = NS + '.reward';      // timer 공유

function $(s, r){ return (r||document).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }

var catField = $('#catField');
var readout  = $('#readout');
var goalEl   = $('#goalInput');
var rewardEl = $('#rewardInput');

var form     = $('#goalForm');
var qGoal    = $('#qGoal');
var qReward  = $('#qReward');
var qV       = $('#qV');

var diffText = {0:'목표의 난이도를 선택하세요.', 1:'아주 쉽게', 2:'쉽게', 3:'적당하게', 4:'약간 어렵게', 5:'도전!'};

// --------------------------
// emotion value helpers
// --------------------------
function getEmotionValue(){
  try{
    var json = localStorage.getItem(K_P2_CURRENT);
    if(!json) return '';
    var data = JSON.parse(json);
    return (data && data.value) ? String(data.value) : '';
  }catch(e){ return ''; }
}
function getLastSourceValue(){
  try{ return localStorage.getItem(K_P3_LASTSOURCE) || ''; }catch(e){ return ''; }
}
function setLastSourceValue(v){
  try{ localStorage.setItem(K_P3_LASTSOURCE, v||''); }catch(e){}
}

// --------------------------
// 초기: emotion 변경 시 리셋
// --------------------------
(function(){
  var curVal  = getEmotionValue();     // 현재 선택된 감정(문자열)
  var lastVal = getLastSourceValue();  // goal이 마지막으로 본 감정(문자열)

  if (curVal !== lastVal) {
    // 저장값/세션 보상 제거 + UI 초기화
    try{ localStorage.removeItem(K_G_DATA); }catch(_){}
    try{ sessionStorage.removeItem(K_REWARD); }catch(_){}
    try{
      $$('#catField .chip').forEach(function(c){
        c.classList.remove('on');
        var r = c.querySelector('input[type="radio"]');
        if (r) r.checked = false;
      });
      $$('input[name="difficulty"]').forEach(function(r){ r.checked = false; });
      if (goalEl) goalEl.value = '';
      if (rewardEl) rewardEl.value = '';
    }catch(_){}
  }
  setLastSourceValue(curVal);
  updateReadout(0);
})();

function updateReadout(v){
  if (readout) readout.textContent = diffText[Number(v)||0];
}
function currentDiff(){
  var sel = $('input[name="difficulty"]:checked');
  return sel ? Number(sel.value) : 0;
}
function save(){
  var cat    = (catField && catField.querySelector('input:checked')) ? catField.querySelector('input:checked').value : '';
  var diff   = currentDiff();
  var goal   = goalEl ? (goalEl.value || '') : '';
  var reward = rewardEl ? (rewardEl.value || '') : '';
  var data   = {cat:cat, diff:diff, goal:goal, reward:reward, at: Date.now()};
  try{
    localStorage.setItem(K_G_DATA, JSON.stringify(data));
    sessionStorage.setItem(NS + '.goal', goal);
    sessionStorage.setItem(NS + '.cat',  cat);
    sessionStorage.setItem(K_REWARD, reward);
  }catch(_){}
}

// --------------------------
// 복원
// --------------------------
(function restore(){
  try{
    var raw = localStorage.getItem(K_G_DATA);
    if (raw){
      var d = JSON.parse(raw);
      if (d && d.cat){
        var chipInput = $('#catField input[value="'+ d.cat +'"]');
        if (chipInput){
          chipInput.checked = true;
          var label = chipInput.closest('.chip');
          if (label) label.classList.add('on');
        }
      }
      if (d && d.diff){
        var r = $('#diff-' + d.diff);
        if (r){ r.checked = true; updateReadout(d.diff); }
      }
      if (goalEl)   goalEl.value   = (d && typeof d.goal === 'string')   ? d.goal   : '';
      if (rewardEl) rewardEl.value = (d && typeof d.reward === 'string') ? d.reward : '';
    } else {
      // 세션에 reward만 남아있을 수 있어서 폴백
      var sr = '';
      try{ sr = (sessionStorage.getItem(K_REWARD) || '').trim(); }catch(_){}
      if (sr && rewardEl) rewardEl.value = sr;
    }
  }catch(_){}
})();

// --------------------------
// 이벤트: 칩/별점/입력
// --------------------------
if (catField){
  catField.addEventListener('click', function(e){
    var label = e.target.closest('.chip');
    if(!label) return;
    var input = label.querySelector('input[type="radio"]');
    if(!input) return;
    input.checked = true;
    $$('#catField .chip').forEach(function(c){ c.classList.remove('on'); });
    label.classList.add('on');
    save();
  });
}

$$('#starsGroup input').forEach(function(radio){
  radio.addEventListener('change', function(){
    updateReadout(radio.value);
    save();
  });
});

if (goalEl)   goalEl.addEventListener('input', save);
if (rewardEl) rewardEl.addEventListener('input', save);

// --------------------------
// ✅ CTA: form submit(폴백 강함)
//   - JS가 죽어도 submit은 동작
//   - 여기서는 preventDefault 사용하지 않음
// --------------------------
if (form){
  form.addEventListener('submit', function(){
    var goal   = goalEl   ? (goalEl.value   || '').trim() : '';
    var reward = rewardEl ? (rewardEl.value || '').trim() : '';
    if (qGoal)   qGoal.value   = goal;
    if (qReward) qReward.value = reward;
    if (qV)      qV.value      = String(Date.now());
    try{
      sessionStorage.setItem(NS + '.goal', goal);
      sessionStorage.setItem(K_REWARD, reward);
    }catch(_){}
    // 여기서 return; (기본 제출 그대로 진행)
  });
}
