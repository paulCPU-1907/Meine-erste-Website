class Animal {
  constructor(id, def, canvasWidth, canvasHeight) {
    this.id = id;
    this.type = def.type;
    this.label = def.label;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.dropChance = def.dropChance;
    this.meatRange = def.meatRange;
    this.meatValue = def.meatValue;
    this.colorA = def.colorA;
    this.colorB = def.colorB;
    this.size = def.size;
    this.weight = def.weight;
    this.dead = false;

    this.width = def.size[0];
    this.height = def.size[1];
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.speed = (Math.random() * (def.speed[1] - def.speed[0]) + def.speed[0]) * this.direction;

    const baseY = canvasHeight * 0.55;
    const rangeY = canvasHeight * 0.35 - this.height;
    this.y = baseY + Math.max(0, Math.random() * rangeY);
    this.x = this.direction > 0 ? -this.width - 20 : canvasWidth + 20;
  }

  update(dt) {
    this.x += this.speed * dt;
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  isOut(canvasWidth) {
    return this.x + this.width < -60 || this.x > canvasWidth + 60;
  }

  applyDamage(dmg) {
    const dealt = Math.min(this.hp, dmg);
    this.hp -= dealt;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    return dealt;
  }

  draw(ctx) {
    ctx.save();
    if (this.direction < 0) {
      ctx.translate(this.x + this.width * 0.5, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(this.x + this.width * 0.5), 0);
    }

    ctx.fillStyle = this.colorA;
    ctx.fillRect(this.x + 2, this.y + 10, this.width * 0.74, this.height * 0.58);
    ctx.fillRect(this.x + this.width * 0.58, this.y + 5, this.width * 0.27, this.height * 0.4);
    ctx.fillStyle = this.colorB;
    ctx.fillRect(this.x + this.width * 0.1, this.y + 14, this.width * 0.18, this.height * 0.2);
    ctx.fillRect(this.x + this.width * 0.32, this.y + 20, this.width * 0.14, this.height * 0.18);
    ctx.fillRect(this.x + this.width * 0.62, this.y + 14, this.width * 0.08, this.height * 0.12);

    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(this.x + this.width * 0.14, this.y + this.height * 0.72, 5, 10);
    ctx.fillRect(this.x + this.width * 0.34, this.y + this.height * 0.72, 5, 10);
    if (this.width > 90) {
      ctx.fillRect(this.x + this.width * 0.54, this.y + this.height * 0.72, 5, 10);
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "11px Segoe UI";
    ctx.fillText(this.label, this.x + 5, this.y + 11);
    ctx.restore();

    const barY = this.y - 12;
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(this.x, barY, this.width, 6);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(this.x, barY, this.width * (this.hp / this.maxHp), 6);
  }
}

class Trap {
  constructor(id, def, x, y) {
    this.id = id;
    this.type = def.type;
    this.label = def.label;
    this.damage = def.damage;
    this.maxDurability = def.durability;
    this.durability = def.durability;
    this.color = def.color;
    this.x = x;
    this.y = y;
    this.width = 34;
    this.height = 22;
    this.cooldown = 0;
  }

  update(dt) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
  }

  canTrigger() {
    return this.cooldown <= 0 && this.durability > 0;
  }

  intersects(animal) {
    return (
      animal.x < this.x + this.width &&
      animal.x + animal.width > this.x &&
      animal.y < this.y + this.height &&
      animal.y + animal.height > this.y
    );
  }

  applyToAnimal(animal) {
    const dealt = animal.applyDamage(this.damage);
    this.durability -= dealt;
    this.cooldown = 0.25;
    return dealt;
  }

  isBroken() {
    return this.durability <= 0;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#0f172a";
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(this.x + 4 + i * 6, this.y - 8, 3, 10);
    }

    const ratio = Math.max(0, this.durability / this.maxDurability);
    ctx.fillStyle = "#111827";
    ctx.fillRect(this.x, this.y + this.height + 3, this.width, 4);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(this.x, this.y + this.height + 3, this.width * ratio, 4);
  }
}

class Inventory {
  constructor(animalDefs) {
    this.animalDefs = animalDefs;
    this.store = Object.fromEntries(animalDefs.map((def) => [def.type, 0]));
  }

  add(type, amount) {
    this.store[type] += amount;
  }

  totalMeat() {
    return Object.values(this.store).reduce((sum, value) => sum + value, 0);
  }

  totalValue() {
    return Object.entries(this.store).reduce((sum, [type, amount]) => {
      const def = this.animalDefs.find((item) => item.type === type);
      return sum + amount * def.meatValue;
    }, 0);
  }

  sellAll() {
    const value = this.totalValue();
    Object.keys(this.store).forEach((key) => {
      this.store[key] = 0;
    });
    return value;
  }
}

class WeaponSystem {
  constructor() {
    this.weapons = {
      standard: { type: "standard", name: "Standardwaffe", damage: 1, cost: 0 },
      rifle: { type: "rifle", name: "Jagdgewehr", damage: 2, cost: 300 },
      riflePro: { type: "riflePro", name: "Jagdgewehr Pro", damage: 5, cost: 950 },
      rifleUltra: { type: "rifleUltra", name: "Jagdgewehr Ultra", damage: 10, cost: 2400 },
    };
    this.owned = new Set(["standard"]);
    this.current = "standard";
    this.ammo = 20;
  }

  damage() {
    return this.weapons[this.current].damage;
  }

  currentName() {
    return this.weapons[this.current].name;
  }

  buy(weaponType, money) {
    if (!this.weapons[weaponType] || this.owned.has(weaponType)) {
      return { ok: false, money, msg: "Waffe bereits vorhanden." };
    }
    const cost = this.weapons[weaponType].cost;
    if (money < cost) {
      return { ok: false, money, msg: "Nicht genug Geld fuer diese Waffe." };
    }
    this.owned.add(weaponType);
    this.current = weaponType;
    return { ok: true, money: money - cost, msg: `${this.weapons[weaponType].name} gekauft.` };
  }

  buyAmmo(money, amount, cost) {
    if (money < cost) {
      return { ok: false, money, msg: "Nicht genug Geld fuer Munition." };
    }
    this.ammo += amount;
    return { ok: true, money: money - cost, msg: `Munition +${amount}.` };
  }

  consumeShot() {
    if (this.ammo <= 0) {
      return false;
    }
    this.ammo -= 1;
    return true;
  }
}

class Spawner {
  constructor(animalDefs) {
    this.animalDefs = animalDefs;
    this.timer = 0;
    this.killPressure = 0;
    this.nextId = 1;
  }

  notifyKill() {
    this.killPressure = Math.min(5, this.killPressure + 0.45);
  }

  update(dt, animalsCount) {
    this.killPressure = Math.max(0, this.killPressure - dt * 0.2);
    const target = 6 + Math.floor(this.killPressure * 2);
    const countFactor = animalsCount < target ? -0.25 : animalsCount > target + 2 ? 0.35 : 0;
    const speedBonus = -this.killPressure * 0.12;
    const spawnInterval = Math.max(0.32, Math.min(1.8, 1.1 + countFactor + speedBonus));

    this.timer += dt;
    if (this.timer < spawnInterval) {
      return null;
    }
    this.timer = 0;

    const type = this.pickType();
    const id = this.nextId;
    this.nextId += 1;
    return { id, type };
  }

  pickType() {
    const total = this.animalDefs.reduce((sum, def) => sum + def.weight, 0);
    let roll = Math.random() * total;
    for (const def of this.animalDefs) {
      roll -= def.weight;
      if (roll <= 0) {
        return def.type;
      }
    }
    return this.animalDefs[0].type;
  }
}

class Shop {
  constructor(weaponSystem, trapDefs) {
    this.weaponSystem = weaponSystem;
    this.trapDefs = trapDefs;
  }

  buyWeapon(type, money) {
    return this.weaponSystem.buy(type, money);
  }

  buyAmmo(money, size) {
    if (size === "small") {
      return this.weaponSystem.buyAmmo(money, 15, 30);
    }
    return this.weaponSystem.buyAmmo(money, 50, 90);
  }

  buyTrap(type, money, trapStock) {
    const def = this.trapDefs[type];
    if (money < def.cost) {
      return { ok: false, money, trapStock, msg: "Nicht genug Geld fuer diese Falle." };
    }
    trapStock[type] += 1;
    return { ok: true, money: money - def.cost, trapStock, msg: `${def.label} gekauft.` };
  }
}

class UIManager {
  constructor(game) {
    this.game = game;
    this.el = {
      money: document.getElementById("money"),
      weaponName: document.getElementById("weaponName"),
      damage: document.getElementById("damage"),
      ammo: document.getElementById("ammo"),
      trapsPlaced: document.getElementById("trapsPlaced"),
      meatUnits: document.getElementById("meatUnits"),
      meatValue: document.getElementById("meatValue"),
      inventoryList: document.getElementById("inventoryList"),
      statusText: document.getElementById("statusText"),
      sellButton: document.getElementById("sellButton"),
      buyRifleButton: document.getElementById("buyRifleButton"),
      buyRifleProButton: document.getElementById("buyRifleProButton"),
      buyRifleUltraButton: document.getElementById("buyRifleUltraButton"),
      buyAmmoSmallButton: document.getElementById("buyAmmoSmallButton"),
      buyAmmoLargeButton: document.getElementById("buyAmmoLargeButton"),
      buyTrapNormalButton: document.getElementById("buyTrapNormalButton"),
      buyTrapSpikedButton: document.getElementById("buyTrapSpikedButton"),
      buyTrapDiamondButton: document.getElementById("buyTrapDiamondButton"),
      placeTrapNormalButton: document.getElementById("placeTrapNormalButton"),
      placeTrapSpikedButton: document.getElementById("placeTrapSpikedButton"),
      placeTrapDiamondButton: document.getElementById("placeTrapDiamondButton"),
    };
  }

  setStatus(text) {
    this.el.statusText.textContent = text;
  }

  render() {
    const g = this.game;
    this.el.money.textContent = String(g.money);
    this.el.weaponName.textContent = g.weaponSystem.currentName();
    this.el.damage.textContent = String(g.weaponSystem.damage());
    this.el.ammo.textContent = String(g.weaponSystem.ammo);
    this.el.trapsPlaced.textContent = String(g.traps.length);
    this.el.meatUnits.textContent = String(g.inventory.totalMeat());
    this.el.meatValue.textContent = String(g.inventory.totalValue());

    this.el.inventoryList.innerHTML = "";
    g.animalDefs.forEach((def) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${def.label}</span><strong>${g.inventory.store[def.type]}</strong>`;
      this.el.inventoryList.appendChild(li);
    });

    const owns = g.weaponSystem.owned;
    this.el.buyRifleButton.disabled = owns.has("rifle") || g.money < 300;
    this.el.buyRifleProButton.disabled = owns.has("riflePro") || g.money < 950;
    this.el.buyRifleUltraButton.disabled = owns.has("rifleUltra") || g.money < 2400;
    this.el.buyRifleButton.textContent = owns.has("rifle") ? "Gekauft" : "Kaufen";
    this.el.buyRifleProButton.textContent = owns.has("riflePro") ? "Gekauft" : "Kaufen";
    this.el.buyRifleUltraButton.textContent = owns.has("rifleUltra") ? "Gekauft" : "Kaufen";

    this.el.buyAmmoSmallButton.disabled = g.money < 30;
    this.el.buyAmmoLargeButton.disabled = g.money < 90;
    this.el.buyTrapNormalButton.disabled = g.money < g.trapDefs.normal.cost;
    this.el.buyTrapSpikedButton.disabled = g.money < g.trapDefs.stachel.cost;
    this.el.buyTrapDiamondButton.disabled = g.money < g.trapDefs.diamant.cost;
    this.el.buyTrapNormalButton.textContent = `Kaufen (${g.trapStock.normal})`;
    this.el.buyTrapSpikedButton.textContent = `Kaufen (${g.trapStock.stachel})`;
    this.el.buyTrapDiamondButton.textContent = `Kaufen (${g.trapStock.diamant})`;

    this.el.placeTrapNormalButton.disabled = g.trapStock.normal <= 0;
    this.el.placeTrapSpikedButton.disabled = g.trapStock.stachel <= 0;
    this.el.placeTrapDiamondButton.disabled = g.trapStock.diamant <= 0;
    this.el.placeTrapNormalButton.textContent =
      g.activePlacement === "normal" ? "Klick ins Feld..." : "Normale platzieren";
    this.el.placeTrapSpikedButton.textContent =
      g.activePlacement === "stachel" ? "Klick ins Feld..." : "Stachel platzieren";
    this.el.placeTrapDiamondButton.textContent =
      g.activePlacement === "diamant" ? "Klick ins Feld..." : "Diamant platzieren";
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.gameArea = document.getElementById("gameArea");
    this.crosshair = document.getElementById("crosshair");

    this.animalDefs = [
      { type: "huhn", label: "Huhn", hp: 1, size: [44, 30], speed: [92, 130], dropChance: 0.92, meatRange: [1, 2], meatValue: 8, weight: 22, colorA: "#fef3c7", colorB: "#f97316" },
      { type: "ziege", label: "Ziege", hp: 4, size: [62, 38], speed: [78, 108], dropChance: 0.86, meatRange: [2, 4], meatValue: 14, weight: 14, colorA: "#d6d3d1", colorB: "#78716c" },
      { type: "schwein", label: "Schwein", hp: 5, size: [72, 44], speed: [70, 96], dropChance: 0.84, meatRange: [3, 6], meatValue: 16, weight: 13, colorA: "#f9a8d4", colorB: "#ec4899" },
      { type: "schaf", label: "Schaf", hp: 6, size: [70, 44], speed: [66, 92], dropChance: 0.83, meatRange: [3, 6], meatValue: 17, weight: 11, colorA: "#f8fafc", colorB: "#cbd5e1" },
      { type: "kuh", label: "Kuh", hp: 10, size: [104, 58], speed: [50, 74], dropChance: 0.75, meatRange: [7, 12], meatValue: 32, weight: 10, colorA: "#e2e8f0", colorB: "#0f172a" },
      { type: "esel", label: "Esel", hp: 12, size: [98, 56], speed: [58, 84], dropChance: 0.72, meatRange: [7, 11], meatValue: 34, weight: 8, colorA: "#c4b5fd", colorB: "#5b21b6" },
      { type: "hirsch", label: "Hirsch", hp: 15, size: [106, 58], speed: [62, 92], dropChance: 0.69, meatRange: [8, 13], meatValue: 38, weight: 7, colorA: "#fdba74", colorB: "#9a3412" },
      { type: "stier", label: "Stier", hp: 20, size: [114, 64], speed: [52, 76], dropChance: 0.66, meatRange: [10, 15], meatValue: 43, weight: 6, colorA: "#94a3b8", colorB: "#111827" },
      { type: "pferd", label: "Pferd", hp: 25, size: [120, 66], speed: [58, 82], dropChance: 0.64, meatRange: [12, 18], meatValue: 48, weight: 5, colorA: "#fdba74", colorB: "#7c2d12" },
      { type: "bison", label: "Bison", hp: 35, size: [128, 72], speed: [46, 66], dropChance: 0.6, meatRange: [16, 24], meatValue: 56, weight: 4, colorA: "#78350f", colorB: "#451a03" },
    ];

    this.trapDefs = {
      normal: { type: "normal", label: "Normale Falle", damage: 5, durability: 5, cost: 100, color: "#94a3b8" },
      stachel: { type: "stachel", label: "Falle Stachel", damage: 10, durability: 10, cost: 220, color: "#f97316" },
      diamant: { type: "diamant", label: "Falle Diamant", damage: 20, durability: 20, cost: 600, color: "#06b6d4" },
    };

    this.money = 0;
    this.animals = [];
    this.traps = [];
    this.trapStock = { normal: 0, stachel: 0, diamant: 0 };
    this.activePlacement = null;
    this.particles = [];
    this.lastTime = performance.now();

    this.inventory = new Inventory(this.animalDefs);
    this.weaponSystem = new WeaponSystem();
    this.shop = new Shop(this.weaponSystem, this.trapDefs);
    this.spawner = new Spawner(this.animalDefs);
    this.ui = new UIManager(this);

    this.bindEvents();
    this.resizeCanvas();
    this.ui.render();
    this.ui.setStatus("Klick ins Spielfeld zum Schiessen.");
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resizeCanvas());

    this.gameArea.addEventListener("mousemove", (event) => {
      const rect = this.gameArea.getBoundingClientRect();
      this.crosshair.style.left = `${event.clientX - rect.left}px`;
      this.crosshair.style.top = `${event.clientY - rect.top}px`;
    });

    this.gameArea.addEventListener("click", (event) => {
      const pos = this.toCanvasPos(event);
      if (this.activePlacement) {
        this.placeTrap(pos.x, pos.y);
      } else {
        this.shoot(pos.x, pos.y);
      }
      this.ui.render();
    });

    this.ui.el.sellButton.addEventListener("click", () => {
      const payout = this.inventory.sellAll();
      if (payout <= 0) {
        this.ui.setStatus("Kein Fleisch im Lager.");
        return;
      }
      this.money += payout;
      this.ui.setStatus(`Fleisch verkauft: +${payout} Geld.`);
      this.ui.render();
    });

    this.ui.el.buyAmmoSmallButton.addEventListener("click", () => this.buyAmmo("small"));
    this.ui.el.buyAmmoLargeButton.addEventListener("click", () => this.buyAmmo("large"));

    this.ui.el.buyRifleButton.addEventListener("click", () => this.buyWeapon("rifle"));
    this.ui.el.buyRifleProButton.addEventListener("click", () => this.buyWeapon("riflePro"));
    this.ui.el.buyRifleUltraButton.addEventListener("click", () => this.buyWeapon("rifleUltra"));

    this.ui.el.buyTrapNormalButton.addEventListener("click", () => this.buyTrap("normal"));
    this.ui.el.buyTrapSpikedButton.addEventListener("click", () => this.buyTrap("stachel"));
    this.ui.el.buyTrapDiamondButton.addEventListener("click", () => this.buyTrap("diamant"));

    this.ui.el.placeTrapNormalButton.addEventListener("click", () => this.togglePlacement("normal"));
    this.ui.el.placeTrapSpikedButton.addEventListener("click", () => this.togglePlacement("stachel"));
    this.ui.el.placeTrapDiamondButton.addEventListener("click", () => this.togglePlacement("diamant"));
  }

  resizeCanvas() {
    const rect = this.gameArea.getBoundingClientRect();
    this.canvas.width = Math.max(700, Math.floor(rect.width));
    this.canvas.height = Math.max(430, Math.floor(rect.height));
  }

  toCanvasPos(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height,
    };
  }

  buyAmmo(size) {
    const result = this.shop.buyAmmo(this.money, size);
    this.money = result.money;
    this.ui.setStatus(result.msg);
    this.ui.render();
  }

  buyWeapon(type) {
    const result = this.shop.buyWeapon(type, this.money);
    this.money = result.money;
    this.ui.setStatus(result.msg);
    this.ui.render();
  }

  buyTrap(type) {
    const result = this.shop.buyTrap(type, this.money, this.trapStock);
    this.money = result.money;
    this.ui.setStatus(result.msg);
    this.ui.render();
  }

  togglePlacement(type) {
    if (this.trapStock[type] <= 0) {
      this.ui.setStatus(`Keine ${this.trapDefs[type].label} verfuegbar.`);
      return;
    }
    this.activePlacement = this.activePlacement === type ? null : type;
    this.ui.setStatus(
      this.activePlacement ? `${this.trapDefs[type].label} platzieren: Klick ins Spielfeld.` : "Platzierung abgebrochen.",
    );
    this.ui.render();
  }

  placeTrap(x, y) {
    if (!this.activePlacement || this.trapStock[this.activePlacement] <= 0) {
      this.activePlacement = null;
      this.ui.setStatus("Falle nicht verfuegbar.");
      return;
    }
    const trapDef = this.trapDefs[this.activePlacement];
    const id = `${this.activePlacement}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const groundY = Math.max(this.canvas.height * 0.56, Math.min(y, this.canvas.height - 40));
    this.traps.push(new Trap(id, trapDef, x - 17, groundY));
    this.trapStock[this.activePlacement] -= 1;
    this.activePlacement = null;
    this.ui.setStatus("Falle platziert.");
  }

  shoot(x, y) {
    if (!this.weaponSystem.consumeShot()) {
      this.ui.setStatus("Keine Munition. Kaufe neue Munition im Shop.");
      return;
    }

    for (let i = this.animals.length - 1; i >= 0; i -= 1) {
      const animal = this.animals[i];
      if (animal.dead || !animal.contains(x, y)) {
        continue;
      }
      const dealt = animal.applyDamage(this.weaponSystem.damage());
      this.spawnParticles(x, y, "#f87171", 8);
      if (animal.dead) {
        this.handleAnimalDeath(animal, "Schuss");
      } else {
        this.ui.setStatus(`${animal.label} getroffen: ${animal.hp} HP uebrig.`);
      }
      return;
    }
    this.ui.setStatus("Schuss daneben.");
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x,
        y,
        vx: Math.random() * 180 - 90,
        vy: Math.random() * -130 - 30,
        life: 0.65,
        color,
      });
    }
  }

  handleAnimalDeath(animal, source) {
    this.spawner.notifyKill();
    if (Math.random() <= animal.dropChance) {
      const min = animal.meatRange[0];
      const max = animal.meatRange[1];
      const amount = Math.floor(Math.random() * (max - min + 1)) + min;
      this.inventory.add(animal.type, amount);
      this.ui.setStatus(`${animal.label} erlegt (${source}): +${amount} Fleisch.`);
    } else {
      this.ui.setStatus(`${animal.label} erlegt (${source}): kein Fleisch.`);
    }
    this.spawnParticles(animal.x + animal.width / 2, animal.y + animal.height / 2, "#dc2626", 12);
  }

  spawnAnimal(type) {
    const def = this.animalDefs.find((item) => item.type === type);
    const id = `animal-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.animals.push(new Animal(id, def, this.canvas.width, this.canvas.height));
  }

  updateSpawner(dt) {
    const spawnData = this.spawner.update(dt, this.animals.length);
    if (spawnData) {
      this.spawnAnimal(spawnData.type);
    }
  }

  updateTraps(dt) {
    for (const trap of this.traps) {
      trap.update(dt);
      if (!trap.canTrigger()) {
        continue;
      }

      for (const animal of this.animals) {
        if (animal.dead || !trap.intersects(animal)) {
          continue;
        }
        const dealt = trap.applyToAnimal(animal);
        this.spawnParticles(animal.x + animal.width * 0.5, animal.y + animal.height * 0.5, "#fb7185", 6);
        if (animal.dead) {
          this.handleAnimalDeath(animal, trap.label);
        }
        if (trap.isBroken()) {
          this.ui.setStatus(`${trap.label} ist kaputt gegangen.`);
        }
        if (dealt > 0) {
          break;
        }
      }
    }

    this.traps = this.traps.filter((trap) => !trap.isBroken());
  }

  updateAnimals(dt) {
    this.animals.forEach((animal) => animal.update(dt));
    this.animals = this.animals.filter((animal) => !animal.dead && !animal.isOut(this.canvas.width));
  }

  updateParticles(dt) {
    this.particles.forEach((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
    });
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  drawBackground() {
    const ctx = this.ctx;
    const horizon = this.canvas.height * 0.55;
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(40, 36, 120, 24);
    ctx.fillRect(220, 58, 88, 20);
    ctx.fillRect(540, 42, 140, 22);
    ctx.fillStyle = "rgba(34, 197, 94, 0.24)";
    ctx.fillRect(0, horizon, this.canvas.width, this.canvas.height - horizon);
  }

  drawParticles() {
    for (const p of this.particles) {
      this.ctx.globalAlpha = Math.max(0, p.life / 0.65);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, 4, 4);
    }
    this.ctx.globalAlpha = 1;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.traps.forEach((trap) => trap.draw(this.ctx));
    this.animals.forEach((animal) => animal.draw(this.ctx));
    this.drawParticles();
  }

  loop(time) {
    const dt = Math.min(0.033, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.updateSpawner(dt);
    this.updateTraps(dt);
    this.updateAnimals(dt);
    this.updateParticles(dt);
    this.draw();
    this.ui.render();
    requestAnimationFrame((t) => this.loop(t));
  }
}

new Game();
