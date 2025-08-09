(async () => {
  const $ = (sel) => document.querySelector(sel);
  const words = await fetch('words.json').then(r=>r.json());

  const QUESTION_COUNT = 10;
  let pool = [...words];
  // shuffle
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  pool = pool.slice(0, QUESTION_COUNT);

  let idx = 0, score = 0, answered = false;

  const wrongKey = 'word_wrong_list';
  const wrongList = JSON.parse(localStorage.getItem(wrongKey) || '[]');

  function renderWrong(){
    const ul = $('#wrongList'); ul.innerHTML = '';
    wrongList.forEach(w => {
      const li = document.createElement('li');
      li.textContent = `${w.word} - ${w.meaning_ko}`;
      ul.appendChild(li);
    });
  }
  renderWrong();

  $('#clearWrong').addEventListener('click', ()=>{
    if(confirm('오답노트를 비울까요?')){
      localStorage.removeItem(wrongKey);
      wrongList.length = 0;
      renderWrong();
    }
  });

  function nextQuestion(){
    answered = false;
    $('#result').textContent = '';
    $('#next').disabled = true;
    const q = pool[idx];
    $('#qno').textContent = `${idx+1} / ${QUESTION_COUNT}`;
    $('#question').textContent = `단어 뜻은?  “${q.word}”`;
    const choices = makeChoices(q);
    const box = $('#choices'); box.innerHTML='';
    choices.forEach((c,i)=>{
      const id = `c${i}`;
      const label = document.createElement('label');
      label.innerHTML = `<input type="radio" name="choice" value="${c.meaning_ko}" id="${id}"> <span>${c.meaning_ko}</span>`;
      box.appendChild(label);
    });
  }

  function makeChoices(correct){
    const others = words.filter(w => w.word !== correct.word);
    // pick 3 wrong
    for(let i=others.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [others[i],others[j]]=[others[j],others[i]]; }
    const picks = [correct, ...others.slice(0,3)];
    // shuffle
    for(let i=picks.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [picks[i],picks[j]]=[picks[j],picks[i]]; }
    return picks;
  }

  $('#submit').addEventListener('click', ()=>{
    if(answered) return;
    const sel = document.querySelector('input[name="choice"]:checked');
    if(!sel){ alert('보기를 선택하세요.'); return; }
    answered = true;
    const q = pool[idx];
    if(sel.value === q.meaning_ko){
      score++;
      $('#result').textContent = `정답! 현재 점수: ${score}/${QUESTION_COUNT}`;
    } else {
      $('#result').textContent = `오답! 정답: ${q.meaning_ko}`;
      wrongList.push(q);
      localStorage.setItem(wrongKey, JSON.stringify(wrongList));
      renderWrong();
    }
    $('#next').disabled = false;
  });

  $('#next').addEventListener('click', ()=>{
    idx++;
    if(idx >= QUESTION_COUNT){
      $('#question').textContent = `끝! 최종 점수: ${score}/${QUESTION_COUNT}`;
      $('#choices').innerHTML=''; $('#submit').disabled = true; $('#next').disabled = true;
      return;
    }
    nextQuestion();
  });

  nextQuestion();
})();