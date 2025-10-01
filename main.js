// =========================
// Farmer Harvest — 
// =========================

// ---- Config & helpers ----
const WIDTH = 900, HEIGHT = 540;
const TILE = 30;
const GAME_LEN = 60;                // seconds
const GOAL = 60;                    // target points (since crops now vary)

const State = Object.freeze({ MENU: "MENU", PLAYING: "PLAYING", PAUSED: "PAUSED", GAME_OVER: "GAME_OVER", WIN: "WIN" });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (min, max) => Math.random() * (max - min) + min;

// ---- Base Entity ----
class Entity {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
  update(dt, game) { }
  draw(ctx) { }
}

// ---- Farmer (player) ----
class Farmer extends Entity {
  constructor(x, y) {
    super(x, y, 34, 34);
    this.baseSpeed = 260;
    this.speed = this.baseSpeed;
    this.vx = 0; this.vy = 0;
    this.color = "#8b5a2b";
    this.iframes = 0; // invulnerability after crow hit
  }
  handleInput(input) {
    const L = input.keys.has("ArrowLeft"), R = input.keys.has("ArrowRight");
    const U = input.keys.has("ArrowUp"), D = input.keys.has("ArrowDown");
    this.vx = (R - L) * this.speed;
    this.vy = (D - U) * this.speed;
  }
  update(dt, game) {
    this.iframes = Math.max(0, this.iframes - dt);
    // try movement
    const oldX = this.x, oldY = this.y;
    this.x = clamp(this.x + this.vx * dt, 0, WIDTH - this.w);
    this.y = clamp(this.y + this.vy * dt, 0, HEIGHT - this.h);
    // block through static obstacles (scarecrows)
    const hitObs = game.staticObstacles.some(o => aabb(this, o));
    if (hitObs) { this.x = oldX; this.y = oldY; }
  }
  draw(ctx) {
    ctx.fillStyle = this.iframes > 0 ? "#f59e0b" : this.color; // flash when hit
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = "#c28e0e";
    ctx.fillRect(this.x + 4, this.y - 6, this.w - 8, 8);        // hat brim
    ctx.fillRect(this.x + 10, this.y - 18, this.w - 20, 12);    // hat top
  }
}

// ---- Crop (collectible with points) ----
class Crop extends Entity {
  /**
   * type: 'wheat'(1), 'pumpkin'(3), 'golden'(5)
   */
  constructor(x, y, type = "wheat") {
    super(x, y, 20, 26);
    this.type = type;
    this.points = type === "wheat" ? 1 : type === "pumpkin" ? 3 : 5;
    this.sway = Math.random() * Math.PI * 2;
  }
  update(dt) { this.sway += dt * 2; }
  draw(ctx) {
    const { x, y, w, h } = this;
    // stem
    ctx.strokeStyle = "#2f7d32";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h);
    ctx.quadraticCurveTo(x + w / 2 + Math.sin(this.sway) * 3, y + h / 2, x + w / 2, y);
    ctx.stroke();
    // head/fruit by type
    if (this.type === "wheat") ctx.fillStyle = "#facc15";
    else if (this.type === "pumpkin") ctx.fillStyle = "#f97316";
    else ctx.fillStyle = "#fde68a"; // golden apple
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- Static Scarecrow (obstacle) ----
class Scarecrow extends Entity {
  constructor(x, y) { super(x, y, 26, 46); }
  draw(ctx) {
    const { x, y, w, h } = this;
    ctx.fillStyle = "#9b7653";
    ctx.fillRect(x + w / 2 - 3, y, 6, h); // pole
    ctx.fillStyle = "#c28e0e";
    ctx.beginPath(); ctx.arc(x + w / 2, y + 10, 10, 0, Math.PI * 2); ctx.fill(); // head
    ctx.strokeStyle = "#6b4f2a"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + w, y + 18); ctx.stroke(); // arms
  }
}

// ---- Moving Crow (harmful obstacle) ----
class Crow extends Entity {
  constructor(x, y) {
    super(x, y, 22, 16);
    this.vx = rnd(-80, 80);
    this.vy = rnd(-60, 60);
    this.cooldown = 0; // to avoid multi-hits per second
  }
  update(dt, game) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    // wander & bounce
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < 0 || this.x + this.w > WIDTH) { this.vx *= -1; this.x = clamp(this.x, 0, WIDTH - this.w); }
    if (this.y < 0 || this.y + this.h > HEIGHT) { this.vy *= -1; this.y = clamp(this.y, 0, HEIGHT - this.h); }

    // collide with player
    if (aabb(this, game.player) && this.cooldown <= 0 && game.player.iframes <= 0) {
      // penalty: lose time & a bit of score
      game.timeLeft = Math.max(0, game.timeLeft - 3);
      game.score = Math.max(0, game.score - 2);
      game.syncUI();
      // brief invulnerability
      game.player.iframes = 1.0;
      this.cooldown = 0.8;
      // nudge crow away
      this.vx = rnd(-120, 120); this.vy = rnd(-90, 90);
    }
  }
  draw(ctx) {
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = "#111827";
    ctx.fillRect(this.x + 3, this.y + 3, 4, 4);
  }
}

// ---- PowerUps ----
class PowerUp extends Entity {
  /**
   * type: 'speed' (boost speed) or 'scythe' (harvest aura)
   */
  constructor(x, y, type = "speed") {
    super(x, y, 18, 18);
    this.type = type;
    this.spin = Math.random() * Math.PI * 2;
  }
  update(dt) { this.spin += dt * 4; }
  draw(ctx) {
    const r = this.w / 2;
    ctx.save();
    ctx.translate(this.x + r, this.y + r);
    ctx.rotate(this.spin);
    if (this.type === "speed") {
      ctx.fillStyle = "#60a5fa";
      ctx.fillRect(-r, -r, this.w, this.h);
    } else {
      ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}

// ---- Input (uses .bind to control `this`) ----
class Input {
  constructor(game) {
    this.game = game;
    this.keys = new Set();
    this._onKeyDown = this.onKeyDown.bind(this); // bind #1
    this._onKeyUp   = this.onKeyUp.bind(this);   // bind #2
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  // Q1b: We bind handler methods so that inside onKeyDown/onKeyUp, `this` is the Input instance
  // (and from there we can reach `game`). If we used inline arrow functions with addEventListener,
  // we couldn't remove them later because we'd lose the exact same function reference.
  // Also, without .bind(this), the browser would call the handler with `this` = the event target.

  onKeyDown(e) {
    if (e.key === "p" || e.key === "P") this.game.togglePause();
    this.keys.add(e.key);
  }
  onKeyUp(e) { this.keys.delete(e.key); }
  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }
}

// ---- Game ----
class Game {
  constructor(canvas) {
    if (!canvas) {
      console.error("Canvas #game not found. Check index.html IDs.");
      return;
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.state = State.MENU;

    // world
    this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
    this.crops = [];
    this.staticObstacles = [];
    this.crows = [];
    this.powerups = [];

    // timing
    this.lastTime = 0;
    this.timeLeft = GAME_LEN;
    this._accumCrop = 0;
    this._accumCrow = 0;
    this._accumPower = 0;

    // dynamic difficulty bases
    this.spawnEveryBase = 0.9;       // crop spawn base (seconds)
    this.crowEveryBase  = 6.0;       // crow spawn base (seconds)
    this.powerEveryBase = 8.0;       // powerup spawn base (seconds)

    // score & goal
    this.score = 0;
    this.goal = GOAL;
    this.level = 1;

    // power-up state
    this.activePower = null;         // 'speed' | 'scythe' | null
    this.powerTime = 0;              // seconds remaining
    this.scytheRadius = 0;

    // input & resize
    this.input = new Input(this);
    this._onResize = this.onResize.bind(this);
    window.addEventListener("resize", this._onResize);

    // Q1b: .bind(this) ensures `this` inside onResize refers to the Game instance.
    // Storing `_onResize` gives us a stable reference so removeEventListener works correctly.

    // UI
    const get = id => document.getElementById(id) || console.error(`#${id} not found`);
    this.ui = {
      score: get("score"),
      time: get("time"),
      goal: get("goal"),
      status: get("status"),
      start: get("btnStart"),
      reset: get("btnReset"),
      power: get("powerup"),
      level: get("level"),
    };
    if (this.ui.goal) this.ui.goal.textContent = String(this.goal);

    // Q1a: Using arrow functions for UI callbacks is ideal here—arrows don't create their own `this`,
    // they use the surrounding lexical `this`, and we don't need to remove these handlers by identity.
    if (this.ui.start) this.ui.start.addEventListener("click", () => this.start());
    if (this.ui.reset) this.ui.reset.addEventListener("click", () => this.reset());

    // RAF loop as arrow function → lexical `this`
    // Q1c (RAF): requestAnimationFrame normally calls the callback with `this = window` (or undefined).
    // Defining `tick` as an arrow function makes it capture the lexical `this` (the Game instance),
    // so inside `tick` we can safely access game fields like state/time/entities.
    this.tick = (ts) => {
      const dt = Math.min((ts - this.lastTime) / 1000, 0.033); // ~30ms cap
      this.lastTime = ts;
      this.update(dt);
      this.render();
      requestAnimationFrame(this.tick);
    };

    // place a couple of scarecrows
    this.staticObstacles.push(new Scarecrow(200, 220), new Scarecrow(650, 160));
  }

  onResize() { /* fixed canvas size for simplicity */ }

  start() {
    if (this.state === State.MENU || this.state === State.GAME_OVER || this.state === State.WIN) {
      this.reset();
      this.state = State.PLAYING;
      if (this.ui.status) this.ui.status.textContent = "Playing…";
      requestAnimationFrame(this.tick);
    } else if (this.state === State.PAUSED) {
      this.state = State.PLAYING;
      if (this.ui.status) this.ui.status.textContent = "Playing…";
    }
  }

  reset() {
    this.state = State.MENU;
    this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
    this.crops.length = 0;
    this.staticObstacles = [new Scarecrow(200, 220), new Scarecrow(650, 160)];
    this.crows.length = 0;
    this.powerups.length = 0;
    this.score = 0;
    this.timeLeft = GAME_LEN;
    this.level = 1;
    this.activePower = null;
    this.powerTime = 0;
    this.scytheRadius = 0;
    this._accumCrop = 0;
    this._accumCrow = 0;
    this._accumPower = 0;
    this.lastTime = performance.now();
    this.syncUI();
    if (this.ui.status) this.ui.status.textContent = "Menu";
  }

  togglePause() {
    if (this.state === State.PLAYING) {
      this.state = State.PAUSED;
      if (this.ui.status) this.ui.status.textContent = "Paused";
    } else if (this.state === State.PAUSED) {
      this.state = State.PLAYING;
      if (this.ui.status) this.ui.status.textContent = "Playing…";
    }
  }

  // difficulty factor grows from 0 → 1 as time passes
  getDifficulty() {
    const elapsed = GAME_LEN - this.timeLeft;
    return clamp(elapsed / GAME_LEN, 0, 1);
  }

  syncUI() {
    if (this.ui.score) this.ui.score.textContent = String(this.score);
    if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
    if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
    if (this.ui.power) this.ui.power.textContent = this.activePower
      ? `${this.activePower} (${Math.ceil(this.powerTime)}s)`
      : "—";
    if (this.ui.level) this.ui.level.textContent = String(this.level);
  }

  spawnCrop() {
    // choose type with weighted probability
    const r = Math.random();
    const type = r < 0.6 ? "wheat" : r < 0.9 ? "pumpkin" : "golden";
    const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
    const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
    this.crops.push(new Crop(gx, gy, type));
  }

  spawnCrow() {
    const x = Math.random() < 0.5 ? -20 : WIDTH + 20;
    const y = rnd(40, HEIGHT - 40);
    const c = new Crow(x, y);
    // aim generally toward field center
    const cx = WIDTH / 2 - c.x, cy = HEIGHT / 2 - c.y, len = Math.hypot(cx, cy) || 1;
    const speed = rnd(70, 120) + this.getDifficulty() * 60;
    c.vx = (cx / len) * speed + rnd(-40, 40);
    c.vy = (cy / len) * speed + rnd(-30, 30);
    this.crows.push(c);
  }

  spawnPowerUp() {
    const type = Math.random() < 0.5 ? "speed" : "scythe";
    const x = rnd(40, WIDTH - 40), y = rnd(40, HEIGHT - 40);
    this.powerups.push(new PowerUp(x, y, type));
  }

  applyPowerUp(type) {
    if (type === "speed") {
      this.activePower = "speed";
      this.powerTime = 6;
      this.player.speed = this.player.baseSpeed * 1.7;
      this.scytheRadius = 0;
    } else {
      this.activePower = "scythe";
      this.powerTime = 6;
      this.player.speed = this.player.baseSpeed;
      this.scytheRadius = 100; // auto-collect radius
    }
    this.syncUI();
  }

  updatePowerUpTimers(dt) {
    if (!this.activePower) return;
    this.powerTime -= dt;
    if (this.powerTime <= 0) {
      this.activePower = null;
      this.player.speed = this.player.baseSpeed;
      this.scytheRadius = 0;
    }
  }

  update(dt) {
    if (this.state !== State.PLAYING) return;

    // countdown
    this.timeLeft = clamp(this.timeLeft - dt, 0, GAME_LEN);
    if (this.timeLeft <= 0) {
      this.state = (this.score >= this.goal) ? State.WIN : State.GAME_OVER;
      if (this.ui.status) this.ui.status.textContent = (this.state === State.WIN) ? "You Win!" : "Game Over";
      this.syncUI();
      return;
    }

    // difficulty curve (0..1)
    const D = this.getDifficulty();

    // Dynamic spawn intervals
    const cropEvery  = lerp(this.spawnEveryBase, 0.25, D);   // faster spawns over time
    const crowEvery  = lerp(this.crowEveryBase,  2.2,  D);
    const powerEvery = lerp(this.powerEveryBase, 4.0,  D);

    // player
    this.player.handleInput(this.input);
    // Q1c (method reference): We call `this.player.update(dt, this)` as a method on `player`,
    // so inside Farmer.update, `this` correctly refers to the Farmer instance (not the Game).
    this.player.update(dt, this);

    // spawn crops
    this._accumCrop += dt;
    while (this._accumCrop >= cropEvery) {
      this._accumCrop -= cropEvery;
      this.spawnCrop();
    }

    // spawn crows
    this._accumCrow += dt;
    while (this._accumCrow >= crowEvery) {
      this._accumCrow -= crowEvery;
      // limit crows a bit, but allow more with difficulty
      const maxCrows = Math.floor(1 + D * 4);
      if (this.crows.length < maxCrows) this.spawnCrow();
    }

    // spawn powerups
    this._accumPower += dt;
    while (this._accumPower >= powerEvery) {
      this._accumPower -= powerEvery;
      if (this.powerups.length < 2) this.spawnPowerUp();
    }

    // collect crops normally
    const collected = this.crops.filter(c => aabb(this.player, c));   // arrow #1
    if (collected.length) {
      collected.forEach(c => c.dead = true);                          // arrow #2
      this.score += collected.reduce((sum, c) => sum + c.points, 0);
      if (this.ui.score) this.ui.score.textContent = String(this.score);
      if (this.score >= this.goal) {
        this.state = State.WIN;
        if (this.ui.status) this.ui.status.textContent = "You Win!";
      }
    }

    // scythe aura auto-collect
    if (this.activePower === "scythe" && this.scytheRadius > 0) {
      const px = this.player.x + this.player.w / 2, py = this.player.y + this.player.h / 2;
      this.crops.forEach(c => {
        const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
        const d = Math.hypot(px - cx, py - cy);
        if (d <= this.scytheRadius) { c.dead = true; this.score += c.points; }
      });
    }

    // apply power-up pickups
    this.powerups.forEach(p => {
      if (aabb(p, this.player)) {
        p.dead = true;
        this.applyPowerUp(p.type);
      }
    });

    // update lists
    this.crops.forEach(c => c.update(dt, this));                       // arrow #3
    this.crows.forEach(c => c.update(dt, this));                       // arrow #4
    this.powerups.forEach(p => p.update(dt, this));                    // arrow #5

    // prune dead
    this.crops     = this.crops.filter(c => !c.dead);                  // arrow #6
    this.powerups  = this.powerups.filter(p => !p.dead);               // arrow #7

    // level display (simple: 1 + difficulty tiers)
    this.level = 1 + Math.floor(D * 4);

    // power-up timers
    this.updatePowerUpTimers(dt);

    // timer UI
    this.syncUI();
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // field background (grid)
    ctx.fillStyle = "#dff0d5";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = "#c7e0bd";
    ctx.lineWidth = 1;
    for (let y = TILE; y < HEIGHT; y += TILE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
    }
    for (let x = TILE; x < WIDTH; x += TILE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
    }

    // draw crops, powerups, crows, static obstacles, farmer
    this.crops.forEach(c => c.draw(ctx));          // arrow usage OK
    this.powerups.forEach(p => p.draw(ctx));
    this.crows.forEach(c => c.draw(ctx));
    this.staticObstacles.forEach(o => o.draw(ctx));
    this.player.draw(ctx);

    // scythe aura visual
    if (this.activePower === "scythe" && this.scytheRadius > 0) {
      const px = this.player.x + this.player.w / 2, py = this.player.y + this.player.h / 2;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, this.scytheRadius, 0, Math.PI * 2); ctx.stroke();
    }

    // state labels
    ctx.fillStyle = "#333";
    ctx.font = "16px system-ui, sans-serif";
    if (this.state === State.MENU) {
      ctx.fillText("Press Start to play", 20, 28);
    } else if (this.state === State.PAUSED) {
      ctx.fillText("Paused (press P to resume)", 20, 28);
    } else if (this.state === State.GAME_OVER) {
      ctx.fillText("Time up! Press Reset to return to Menu", 20, 28);
    } else if (this.state === State.WIN) {
      ctx.fillText("Harvest complete! Press Reset for another round", 20, 28);
    }
  }

  dispose() {
    this.input.dispose();
    window.removeEventListener("resize", this._onResize);
  }
}

// ---- Boot ----
const canvas = document.getElementById("game");
const game = new Game(canvas);
// Click "Start" in the UI to begin.
