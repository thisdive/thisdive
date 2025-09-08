/* =========================
   네임스페이스 키
   ========================= */
const NS = 'thisdive';
const K_SELECTED    = `${NS}.selectedEmotion`;
const K_P2_CURRENT  = `${NS}.p2:current`;
const K_P3_LASTSRC  = `${NS}.p3:lastSource`;

/* =========================
   화이트리스트(감정값)
   ========================= */
const EMO_ALLOW = new Set([
  "기뻐요","설레요","감사해요","평온해요",
  "지쳤어요","우울해요","무기력해요","외로워요",
  "짜증나요","화나요","질투나요","부끄러워요",
  "불안해요","긴장돼요","두려워요","부담돼요"
]);

/* =========================
   초기화(직접 접속/이동/QR 재진입/BFCache 복귀)
   ========================= */
(function resetOnEntry(){
  try{
    sessionStorage.removeItem(K_SELECTED);
    localStorage.removeItem(K_P2_CURRENT);
    document.querySelectorAll('input[name="emotion"]').forEach(i => i.checked = false);
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
    disableCTA(true);
  }catch(e){}
})();

window.addEventListener('pageshow', (ev)=>{
  if (ev.persisted) {
    try{
      sessionStorage.removeItem(K_SELECTED);
      localStorage.removeItem(K_P2_CURRENT);
      document.querySelectorAll('input[name="emotion"]').forEach(i => i.checked = false);
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
      disableCTA(true);
    }catch(e){}
  }
});

/* =========================
   이벤트 바인딩
   ========================= */
const chips = document.querySelectorAll('.chip');
const goBtn = document.getElementById('goBtn');

chips.forEach(chip=>{
  chip.addEventListener('click', ()=>{
    const input = chip.querySelector('input[type="radio"]');
    if(!input) return;
    const value = input.value;

    // 화이트리스트 검증
    if (!EMO_ALLOW.has(value)) return;

    input.checked = true;
    document.querySelectorAll('.chip').forEach(c=> c.classList.remove('on'));
    chip.classList.add('on');

    safeSetSession(K_SELECTED, value);
    safeSetLocal(K_P2_CURRENT, JSON.stringify({ value, at: Date.now() }));
    disableCTA(false);
  });
});

function disableCTA(v){ goBtn.disabled = !!v; }

goBtn.addEventListener('click', ()=>{
  const emotion = safeGetSession(K_SELECTED) || '';
  if(!emotion) return;

  // 안전을 위해 2차 검증
  if (!EMO_ALLOW.has(emotion)) return;

  const url = `question.html?emotion=${encodeURIComponent(emotion)}&v=${Date.now()}`;
  location.href = url;
});

function safeSetSession(k,v){ try{ sessionStorage.setItem(k,v); }catch(e){} }
function safeGetSession(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } }
function safeSetLocal(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

const net = document.getElementById('net');
function showNet(msg){
  if(!net) return;
  net.textContent = msg;
  net.hidden = false;
  net.classList.add('show');
  clearTimeout(showNet._t);
  showNet._t = setTimeout(()=> net.classList.remove('show'), 1600);
}
window.addEventListener('offline', ()=> showNet('오프라인입니다. 네트워크를 확인하세요.'));
window.addEventListener('online',  ()=> showNet('온라인에 연결되었습니다.'));
