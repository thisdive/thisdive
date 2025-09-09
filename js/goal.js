/* =========================
   네임스페이스 & 키
   ========================= */
const NS = 'thisdive';
// page2(감정) 현재, page3(question) 데이터
const K_P2_CURRENT = `${NS}.p2:current`;
const K_Q_DATA     = `${NS}.q:data`;
// page4(goal) 전용: 직전에 참고했던 p2, q 스냅샷
const K_P4_LASTP2  = `${NS}.p4:lastP2`;
const K_P4_LASTQ   = `${NS}.p4:lastQ`;
// goal 입력 스냅샷
const K_G_DATA     = `${NS}.g:data`;
// 세션 보강용
const K_SELECTED   = `${NS}.selectedEmotion`;

/* =========================
   QR 재인식(#reset) → 전체 초기화
   ========================= */
(function resetIfHash(){
  try{
    if (location.hash.replace('#','') === 'reset') {
      sessionStorage.clear();
      localStorage.removeItem(K_P2_CURRENT);
      localStorage.removeItem(K_Q_DATA);
      localStorage.removeItem(K_P4_LASTP2);
      localStorage.removeItem(K_P4_LASTQ);
      localStorage.removeItem(K_G_DATA);
    }
  }catch(e){}
})();

/* =========================
   요소
   ========================= */
const backBtn  = document.getElementById('backBtn');
const catField = document.getElementById('catField');
const readout  = document.getElementById('readout');
const goalEl   = document.getElementById('goalInput');
const startBtn = document.getElementById('startBtn');
const starsWrap= document.getElementById('starsGroup');

/* 난이도별 권장 시간/라벨 */
const minuteMap = {1:10, 2:15, 3:25, 4:40, 5:50};
const diffText  = {0:'미정', 1:'가볍게', 2:'쉬움', 3:'보통', 4:'집중', 5:'도전'};

/* =========================
   진입 시 스냅샷 비교
   - emotion 변경(p2)만 초기화 트리거
   - question 변경은 기록만 갱신
   ========================= */
(function compareSnapshotsOnEnter(){
  try{
    const curP2 = localStorage.getItem(K_P2_CURRENT) || '';
    const lastP2= localStorage.getItem(K_P4_LASTP2)  || '';
    if (curP2 !== lastP2) {
      localStorage.removeItem(K_G_DATA); // 감정 바뀌면 목표 초기화
    }
    localStorage.setItem(K_P4_LASTP2, curP2);

    const curQ = localStorage.getItem(K_Q_DATA) || '';
    localStorage.setItem(K_P4_LASTQ, curQ);
  }catch(e){}
})();

/* =========================
   복원
   ========================= */
(function restore(){
  updateReadout(0);
  try{
    const raw = localStorage.getItem(K_G_DATA);
    if(!raw) return;
    const d = JSON.parse(raw);

    // 카테고리
    if (d.cat) {
      const chip = [...catField.querySelectorAll('label.chip input')]
        .find(i=>i.value===d.cat);
      if (chip) { chip.checked = true; chip.closest('.chip')?.classList.add('on'); }
    }
    // 난이도
    if (d.diff) {
      const r = document.getElementById('d'+d.diff);
      if (r){ r.checked = true; paintStars(d.diff); updateReadout(d.diff); }
    }
    // 목표
    if (typeof d.goal === 'string') goalEl.value = d.goal;
  }catch(e){}
})();

/* =========================
   카테고리 선택
   ========================= */
catField.addEventListener('click', (e)=>{
  const label = e.target.closest('.chip');
  if(!label) return;
  const input = label.querySelector('input[type="radio"]');
  if(!input) return;
  input.checked = true;
  catField.querySelectorAll('.chip').forEach(c=> c.classList.remove('on'));
  label.classList.add('on');
  save();
});

/* =========================
   별점
   ========================= */
starsWrap.addEventListener('click', (e)=>{
  const star = e.target.closest('.star');
  if(!star) return;
  const val = Number(star.dataset.val);
  const r = document.getElementById('d'+val);
  if (r){ r.checked = true; }
  paintStars(val);
  updateReadout(val);
  save();
});

function paintStars(val){
  [...starsWrap.querySelectorAll('.star')].forEach(s=>{
    s.style.color = (Number(s.dataset.val) <= Number(val)) ? 'var(--star-on)' : 'var(--star-off)';
  });
}
function updateReadout(v){
  const val = Number(v)||0;
  const extra = minuteMap[val] ? ` · ${minuteMap[val]}분` : '';
  readout.textContent = `${diffText[val]} (${val}/5)${extra}`;
}

/* =========================
   저장
   ========================= */
function save(){
  const cat  = (catField.querySelector('input:checked')||{}).value || '';
  const diff = Number((document.querySelector('input[name="diff"]:checked')||{}).value||0);
  const goal = goalEl.value || '';
  const data = {cat, diff, goal, at: Date.now()};
  try{ localStorage.setItem(K_G_DATA, JSON.stringify(data)); }catch(e){}
}
goalEl.addEventListener('input', save);

/* =========================
   CTA → timer.html
   ========================= */
startBtn.addEventListener('click', ()=>{
  const cat  = (catField.querySelector('input:checked')||{}).value || '';
  const goal = (goalEl.value||'').trim();

  // 감정 세션 보강(없을 때만)
  try{
    if (!sessionStorage.getItem(K_SELECTED)) {
      const p2raw = localStorage.getItem(K_P2_CURRENT);
      if (p2raw) {
        const obj = JSON.parse(p2raw);
        if (obj && obj.value) sessionStorage.setItem(K_SELECTED, obj.value);
      }
    }
    sessionStorage.setItem(`${NS}.goal`, goal);
    sessionStorage.setItem(`${NS}.cat`,  cat);
  }catch(e){}

  // 실제 파일명이 timer2.html이라면 아래를 'timer2.html'로 변경
  location.href = `timer.html?goal=${encodeURIComponent(goal)}&v=${Date.now()}`;
});

/* =========================
   뒤로가기
   ========================= */
backBtn.addEventListener('click', ()=>{
  if (document.referrer){ history.back(); return; }
  // 실제 파일명이 question2.html이라면 아래를 'question2.html'로 변경
  location.href = 'question.html?v=' + Date.now();
});
