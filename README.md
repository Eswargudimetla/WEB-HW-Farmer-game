# Farmer Harvest Game – Web Technologies Homework 2 (Fall 2025)

This project extends the base **Farmer Harvest** JavaScript mini-game with modern ES6 features, new gameplay mechanics, modular code structure, and advanced graduate-level tasks. It was developed as part of **Homework 2** for Web Technologies, due Oct 3rd, 2025.

---

## Q1. Language Features

- **Arrow Functions**  
  All anonymous callbacks were converted to arrow functions (e.g., requestAnimationFrame loop, array filtering).  
  Comments explain how arrow functions preserve lexical `this` and avoid context loss.

- **`.bind(this)` Usage**  
  Two key areas use `.bind(this)`:
  1. Keyboard event listeners in the `Input` class.  
  2. Window resize callback in `Game.js`.  
  `.bind(this)` was required to remove listeners later and ensure cleanup.

- **`this` Explanations**  
  Added code comments describing how `this` is bound in:  
  - requestAnimationFrame loop  
  - Event listeners  
  - Method references

---

## Q2. New Gameplay Features

Implemented **all four** requested mechanics:
1. **Different Crop Types**  
   - Wheat = 1 point  
   - Pumpkin = 3 points  
   - Golden Apple = 5 points  

2. **Difficulty Curve**  
   - Spawn rates speed up over time.  
   - Timer tightens as difficulty increases.  

3. **Power-Ups**  
   - Speed boost temporarily increases farmer speed.  
   - Scythe power auto-collects crops within a radius.  

4. **Moving Obstacles (Crows)**  
   - Crows fly across the field.  
   - Colliding with them reduces time or score.

---

## Q3. Refactoring & Code Quality

- Refactored into ES6 modules:  
  - `Game.js`  
  - `Farmer.js`  
  - `Crop.js`  
  - `Obstacle.js`  
  - `PowerUp.js`  
  - `utils.js`

- Used `import/export` to organize logic.  
- Added **JSDoc comments** for each class and major method.  
- Improved readability, maintainability, and separation of concerns.  
- **150-word explanation** included in the report.

---

## Q4. Written Reflection

- **(a) Arrow function required**  
  Example: `this.tick` requestAnimationFrame loop, where lexical `this` ensures `update()` and `render()` work properly.

- **(b) `.bind(this)` more appropriate**  
  Example: Keyboard input event handlers. `.bind(this)` allows removal of listeners (`dispose()`), unlike anonymous arrow functions.

- **(c) One more week improvement**  
  Proposed feature: Multiplayer/competitive mode, either local (two farmers) or online (WebSocket sync). Adds replayability and challenge.

Full 150-word answers are included in the PDF reflection file.

---

## Graduate Student Tasks

### G1. Level System
- Implemented 3 levels.  
- Each level increases crop spawn rate, adds more obstacles, or reduces time.  
- Advancing requires meeting the level’s goal.  

### G2. Animation & Sprites
- Replaced farmer square with animated **4×4 sprite sheet**.  
- Rows = directions (Down/Left/Right/Up).  
- Columns = walking frames.  
- Code cycles frames while moving for smooth animation.  
- Idle stance shows first frame of last facing direction.  

### G3. Configurable Difficulty
- Added external `config.json`.  
- Contains per-level values (time, goal, spawn rates, obstacles).  
- Game loads JSON on start and normalizes values.  
- Makes difficulty **data-driven and flexible**.

---

## Assets

- `sprites/farmer.png` – 4×4 farmer sprite sheet.  
- `config.json` – Difficulty configuration.  
- Diagrams included:  
  - Sprite sheet layout (rows = directions, cols = frames).  


---

## New Features

1. **Multiple Crop Types**
   - Wheat = 1 point
   - Pumpkin = 3 points
   - Golden Apple = 5 points

2. **Dynamic Difficulty Curve**
   - Crop spawn rates increase as time passes.
   - Higher levels reduce available time and add more obstacles.

3. **Power-Ups**
   - Speed Boost: temporarily increases farmer speed.
   - Scythe: auto-collects crops within a radius around the farmer.

4. **Moving Obstacles**
   - Crows fly across the field.
   - Colliding with a crow reduces score or time.

5. **Level System (Graduate Task)**
   - Three levels with progressively harder conditions.
   - Winning a level advances to the next configuration.

6. **Farmer Sprite Animation (Graduate Task)**
   - The farmer is rendered with a 4×4 sprite sheet.
   - Rows = facing direction, Columns = walking frames.
   - Smooth walking animation plays when moving.

7. **Configurable Difficulty (Graduate Task)**
   - External `config.json` defines time limits, goals, spawn rates, and obstacles.
   - The game loads and applies settings dynamically.

---

## How to Run the Game

1. Ensure all files are present:
   - `index.html`, `style.css`, `src/` modules, `sprites/farmer.png`, `config.json`.
2. Start a local server (required for `fetch` to load JSON):
   ```bash
   python -m http.server 8000
