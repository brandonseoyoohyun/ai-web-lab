(async () => {
  const fmt = (d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = new Date();
  document.getElementById('date').textContent = `오늘: ${fmt(today)}`;

  const qs = await fetch('questions.json').then(r=>r.json());
  // pick daily question by date seed
  const seed = Number(fmt(today).replace(/-/g,''));
  const q = qs[seed % qs.length];
  document.getElementById('question').textContent = q;

  const key = 'philo_answers';
  const store = JSON.parse(localStorage.getItem(key) || '{}');
  const ta = document.getElementById('answer');
  ta.value = store[fmt(today)] || '';

  document.getElementById('save').addEventListener('click', ()=>{
    store[fmt(today)] = ta.value;
    localStorage.setItem(key, JSON.stringify(store));
    document.getElementById('status').textContent = '저장되었습니다.';
  });

  document.getElementById('seeHistory').addEventListener('click', ()=>{
    const ul = document.getElementById('history');
    ul.innerHTML = '';
    // show last 7 days
    const dates = Object.keys(store).sort().slice(-7);
    dates.forEach(d => {
      const li = document.createElement('li');
      const short = store[d].length > 60 ? store[d].slice(0,60) + '…' : store[d];
      li.textContent = `${d}: ${short}`;
      ul.appendChild(li);
    });
  });
})();