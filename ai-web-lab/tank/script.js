(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const pauseBtn = document.getElementById('pauseBtn');

  const W = canvas.width, H = canvas.height;

  const state = {
    paused: false,
    score: 0,
    lives: 3,
    keys: {},
    bullets: [],
    enemies: [],
    walls: [
      {x: 200, y: 120, w: 80, h: 20},
      {x: 420, y: 280, w: 140, h: 20},
      {x: 650, y: 180, w: 20, h: 120}
    ],
    tank: { x: 80, y: H/2, w: 28, h: 20, dir: 0, speed: 2.2, cooldown: 0 }
  };

  function aabb(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnEnemy(){
    const y = 40 + Math.random() * (H-80);
    state.enemies.push({ x: W-40, y, w: 22, h: 18, vx: -(1.2 + Math.random()*1.4) });
  }

  let last = 0;
  function loop(t){
    if(!last) last = t;
    const dt = Math.min(32, t-last); // ms cap
    last = t;
    if(!state.paused){
      update(dt/16.7);
      draw();
    }
    requestAnimationFrame(loop);
  }

  function update(dt){
    // spawn enemies
    if(Math.random() < 0.02) spawnEnemy();

    // input
    const tank = state.tank;
    const v = tank.speed * dt;
    if(state.keys['ArrowLeft'] || state.keys['a']) tank.x -= v;
    if(state.keys['ArrowRight']|| state.keys['d']) tank.x += v;
    if(state.keys['ArrowUp']   || state.keys['w']) tank.y -= v;
    if(state.keys['ArrowDown'] || state.keys['s']) tank.y += v;

    // keep in bounds
    tank.x = Math.max(0, Math.min(W - tank.w, tank.x));
    tank.y = Math.max(0, Math.min(H - tank.h, tank.y));

    // collide with walls
    for(const w of state.walls){
      if(aabb(tank, w)){
        // simple push-out
        const dx1 = w.x + w.w - tank.x;
        const dx2 = tank.x + tank.w - w.x;
        const dy1 = w.y + w.h - tank.y;
        const dy2 = tank.y + tank.h - w.y;
        const min = Math.min(dx1, dx2, dy1, dy2);
        if(min === dx1) tank.x = w.x + w.w;
        else if(min === dx2) tank.x = w.x - tank.w;
        else if(min === dy1) tank.y = w.y + w.h;
        else tank.y = w.y - tank.h;
      }
    }

    // fire
    if(state.keys[' ']) tryFire();
    if(tank.cooldown>0) tank.cooldown -= dt;

    // bullets
    for(const b of state.bullets){ b.x += 6*dt; }
    state.bullets = state.bullets.filter(b => b.x < W);

    // enemies
    for(const e of state.enemies){ e.x += e.vx*dt; }
    // bullet-enemy hit
    for(const b of state.bullets){
      for(const e of state.enemies){
        if(aabb(b,e)){ e.dead = true; b.dead = true; state.score += 10; scoreEl.textContent = state.score; }
      }
    }
    state.bullets = state.bullets.filter(b => !b.dead);
    state.enemies = state.enemies.filter(e => !e.dead && e.x > -40);

    // enemy-tank hit
    for(const e of state.enemies){
      if(aabb(e, state.tank)){
        e.dead = true;
        state.lives -= 1; livesEl.textContent = state.lives;
        if(state.lives <= 0){
          reset();
          return;
        }
      }
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // background grid
    ctx.fillStyle = '#0b1130';
    ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = '#1e2959';
    for(let x=0;x<W;x+=20){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=20){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // walls
    ctx.fillStyle = '#3a4a88';
    for(const w of state.walls){ ctx.fillRect(w.x,w.y,w.w,w.h); }

    // tank
    const t = state.tank;
    ctx.fillStyle = '#6ee7ff';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = '#b8f3ff';
    ctx.fillRect(t.x + t.w - 6, t.y + t.h/2 - 2, 12, 4); // barrel

    // bullets
    ctx.fillStyle = '#ffd166';
    for(const b of state.bullets){
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // enemies
    ctx.fillStyle = '#ff6b6b';
    for(const e of state.enemies){
      ctx.fillRect(e.x, e.y, e.w, e.h);
    }
  }

  function tryFire(){
    const tank = state.tank;
    if(tank.cooldown > 0) return;
    state.bullets.push({ x: tank.x + tank.w, y: tank.y + tank.h/2 - 2, w: 8, h: 4 });
    tank.cooldown = 8; // frames
  }

  function reset(){
    state.score = 0; scoreEl.textContent = '0';
    state.lives = 3; livesEl.textContent = '3';
    state.enemies = []; state.bullets = [];
    state.tank.x = 80; state.tank.y = H/2;
  }

  // input
  window.addEventListener('keydown', (e)=>{
    if(e.key === 'p' || e.key === 'P'){ state.paused = !state.paused; return; }
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
    state.keys[e.key] = true;
  }, {passive:false});
  window.addEventListener('keyup', (e)=>{ state.keys[e.key] = false; });

  // touch controls
  const bind = (id, down, up) => {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', e=>{ e.preventDefault(); state.keys[down] = true; }, {passive:false});
    el.addEventListener('touchend', e=>{ e.preventDefault(); state.keys[down] = false; }, {passive:false});
  };
  bind('left','ArrowLeft');
  bind('right','ArrowRight');
  bind('up','ArrowUp');
  document.getElementById('fire').addEventListener('touchstart', e=>{ e.preventDefault(); state.keys[' '] = true; tryFire(); }, {passive:false});
  document.getElementById('fire').addEventListener('touchend', e=>{ e.preventDefault(); state.keys[' '] = false; }, {passive:false});

  pauseBtn.addEventListener('click', ()=> state.paused = !state.paused);

  requestAnimationFrame(loop);
})();