class Animal {
  constructor(id, def, canvasWidth, canvasHeight, variant = "normal") {
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
    this.tier = def.tier || 1;
    this.role = def.role || "ground";
    this.variant = variant;
    this.dead = false;

    this.width = def.size[0];
    this.height = def.size[1];
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.speed = (Math.random() * (def.speed[1] - def.speed[0]) + def.speed[0]) * this.direction;

    let baseY = canvasHeight * 0.55;
    let rangeY = canvasHeight * 0.35 - this.height;
    if (this.role === "air") {
      baseY = canvasHeight * 0.16;
      rangeY = canvasHeight * 0.28 - this.height;
    } else if (this.role === "bossAir") {
      baseY = canvasHeight * 0.08;
      rangeY = canvasHeight * 0.22 - this.height;
    }
    this.y = baseY + Math.max(0, Math.random() * rangeY);
    this.baseY = this.y;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobAmplitude = this.role === "air" ? 8 : this.role === "bossAir" ? 12 : 0;
    this.bobSpeed = this.role === "air" ? 3.2 : this.role === "bossAir" ? 1.9 : 0;
    this.x = this.direction > 0 ? -this.width - 20 : canvasWidth + 20;
  }

  update(dt) {
    this.x += this.speed * dt;
    if (this.bobAmplitude > 0) {
      this.bobPhase += dt * this.bobSpeed;
      this.y = this.baseY + Math.sin(this.bobPhase) * this.bobAmplitude;
    }
  }

  contains(x, y) {
    const hitPadding = this.role === "air" ? 8 : this.role === "bossAir" ? 12 : 0;
    return (
      x >= this.x - hitPadding &&
      x <= this.x + this.width + hitPadding &&
      y >= this.y - hitPadding &&
      y <= this.y + this.height + hitPadding
    );
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

    ctx.restore();

    ctx.fillStyle = "#0f172a";
    ctx.font = "11px Segoe UI";
    ctx.fillText(this.label, this.x + 5, this.y + 11);
    if (this.variant !== "normal") {
      ctx.globalAlpha = this.variant === "diamond" ? 0.38 : 0.3;
      ctx.fillStyle = this.variant === "diamond" ? "#67e8f9" : "#facc15";
      ctx.fillRect(this.x + 1, this.y + 4, this.width * 0.9, this.height * 0.72);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = this.variant === "diamond" ? "rgba(103,232,249,0.95)" : "rgba(250,204,21,0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - 2, this.y + 2, this.width + 4, this.height * 0.78);
    }

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
      rifleViper: { type: "rifleViper", name: "Jagdgewehr Viper", damage: 14, cost: 5200 },
      rifleTitan: { type: "rifleTitan", name: "Jagdgewehr Titan", damage: 20, cost: 9800 },
    };
    this.owned = new Set(["standard"]);
    this.current = "standard";
    this.normalAmmo = 20;
    this.bombAmmo = 0;
    this.scatterAmmo = 0;
    this.activeShotType = "normal";
    this.emergencySlingshotActive = false;
  }

  damage() {
    if (this.emergencySlingshotActive) {
      return 0.5;
    }
    return this.weapons[this.current].damage;
  }

  currentName() {
    if (this.emergencySlingshotActive) {
      return "Steinschleuder (Notfall)";
    }
    return this.weapons[this.current].name;
  }

  updateEmergencyState(money) {
    const wasActive = this.emergencySlingshotActive;
    this.emergencySlingshotActive = this.totalAmmo() <= 0 && money < 30;
    return {
      becameActive: !wasActive && this.emergencySlingshotActive,
      becameInactive: wasActive && !this.emergencySlingshotActive,
      active: this.emergencySlingshotActive,
    };
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

  totalAmmo() {
    return this.normalAmmo + this.bombAmmo + this.scatterAmmo;
  }

  ammoLabel() {
    const parts = [`N:${this.normalAmmo}`];
    if (this.bombAmmo > 0) {
      parts.push(`B:${this.bombAmmo}`);
    }
    if (this.scatterAmmo > 0) {
      parts.push(`M:${this.scatterAmmo}`);
    }
    return parts.join(" ");
  }

  activeShotLabel() {
    if (this.emergencySlingshotActive) {
      return "Stein";
    }
    if (this.activeShotType === "bomb") {
      return "Bombe";
    }
    if (this.activeShotType === "scatter") {
      return "Mehrfach";
    }
    return "Normal";
  }

  ensureValidShotType() {
    if (this.activeShotType === "bomb" && this.bombAmmo <= 0) {
      this.activeShotType = "normal";
    }
    if (this.activeShotType === "scatter" && this.scatterAmmo <= 0) {
      this.activeShotType = "normal";
    }
  }

  buyAmmo(money, type) {
    const defs = {
      small: { cost: 30, amount: 15, key: "normalAmmo", label: "Munition Klein +15" },
      bomb: { cost: 140, amount: 4, key: "bombAmmo", label: "Munition Bombe +4" },
      scatter: { cost: 170, amount: 6, key: "scatterAmmo", label: "Mehrfachschuss +6" },
    };
    const def = defs[type];
    if (!def) {
      return { ok: false, money, msg: "Unbekannter Munitionskauf." };
    }
    if (money < def.cost) {
      return { ok: false, money, msg: "Nicht genug Geld fuer diese Munition." };
    }
    this[def.key] += def.amount;
    this.activeShotType = type === "small" ? "normal" : type;
    this.ensureValidShotType();
    return { ok: true, money: money - def.cost, msg: `${def.label} gekauft.` };
  }

  consumeShot() {
    if (this.emergencySlingshotActive) {
      return { ok: true, shotType: "slingshot" };
    }

    this.ensureValidShotType();
    if (this.activeShotType === "bomb") {
      if (this.bombAmmo <= 0) {
        return { ok: false, shotType: "bomb" };
      }
      this.bombAmmo -= 1;
      this.ensureValidShotType();
      return { ok: true, shotType: "bomb" };
    }

    if (this.activeShotType === "scatter") {
      if (this.scatterAmmo <= 0) {
        return { ok: false, shotType: "scatter" };
      }
      this.scatterAmmo -= 1;
      this.ensureValidShotType();
      return { ok: true, shotType: "scatter" };
    }

    if (this.normalAmmo <= 0) {
      return { ok: false, shotType: "normal" };
    }
    this.normalAmmo -= 1;
    return { ok: true, shotType: "normal" };
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
    return this.updateWithLevel(dt, animalsCount, 1);
  }

  updateWithLevel(dt, animalsCount, level) {
    this.killPressure = Math.max(0, this.killPressure - dt * 0.2);
    const levelBoost = Math.max(0, level - 1) * 0.12;
    const target = 6 + Math.floor(this.killPressure * 2) + Math.floor(level / 3);
    const countFactor = animalsCount < target ? -0.25 : animalsCount > target + 2 ? 0.35 : 0;
    const speedBonus = -this.killPressure * 0.12 - levelBoost * 0.28;
    const spawnInterval = Math.max(0.32, Math.min(1.8, 1.1 + countFactor + speedBonus));

    this.timer += dt;
    if (this.timer < spawnInterval) {
      return null;
    }
    this.timer = 0;

    const type = this.pickType(level);
    const id = this.nextId;
    this.nextId += 1;
    return { id, type };
  }

  pickType(level = 1) {
    const weightedDefs = this.animalDefs
      .filter((def) => (def.minPlayerLevel || 1) <= level)
      .map((def) => {
        let scaledWeight = def.weight;

        if (level >= 10 && def.tier < 3) {
          scaledWeight = 0;
        } else if (level >= 5 && def.tier < 3) {
          scaledWeight *= 0.18;
        }

        const highTierBoost = Math.max(0, level - def.tier) * 0.05;
        scaledWeight *= 1 + highTierBoost;

        if (def.role === "air") {
          scaledWeight *= 1.35;
        }

        if (def.role === "bossAir") {
          scaledWeight *= level >= 8 ? 1 : 0;
        }

        return { def, weight: Math.max(0, scaledWeight) };
      })
      .filter((item) => item.weight > 0);

    if (weightedDefs.length === 0) {
      return this.animalDefs[0].type;
    }

    const total = weightedDefs.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of weightedDefs) {
      roll -= item.weight;
      if (roll <= 0) {
        return item.def.type;
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
    return this.weaponSystem.buyAmmo(money, size);
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
      freeAbilities: document.getElementById("freeAbilities"),
      levelLabel: document.getElementById("levelLabel"),
      xpLabel: document.getElementById("xpLabel"),
      xpFill: document.getElementById("xpFill"),
      meatUnits: document.getElementById("meatUnits"),
      meatValue: document.getElementById("meatValue"),
      inventoryList: document.getElementById("inventoryList"),
      statusText: document.getElementById("statusText"),
      sellButton: document.getElementById("sellButton"),
      buyRifleButton: document.getElementById("buyRifleButton"),
      buyRifleProButton: document.getElementById("buyRifleProButton"),
      buyRifleUltraButton: document.getElementById("buyRifleUltraButton"),
      buyRifleViperButton: document.getElementById("buyRifleViperButton"),
      buyRifleTitanButton: document.getElementById("buyRifleTitanButton"),
      buyAmmoSmallButton: document.getElementById("buyAmmoSmallButton"),
      buyAmmoBombButton: document.getElementById("buyAmmoBombButton"),
      buyAmmoScatterButton: document.getElementById("buyAmmoScatterButton"),
      buyTrapNormalButton: document.getElementById("buyTrapNormalButton"),
      buyTrapSpikedButton: document.getElementById("buyTrapSpikedButton"),
      buyTrapDiamondButton: document.getElementById("buyTrapDiamondButton"),
      buyTrapVulkanButton: document.getElementById("buyTrapVulkanButton"),
      buyTrapTitanButton: document.getElementById("buyTrapTitanButton"),
      placeTrapNormalButton: document.getElementById("placeTrapNormalButton"),
      placeTrapSpikedButton: document.getElementById("placeTrapSpikedButton"),
      placeTrapDiamondButton: document.getElementById("placeTrapDiamondButton"),
      placeTrapVulkanButton: document.getElementById("placeTrapVulkanButton"),
      placeTrapTitanButton: document.getElementById("placeTrapTitanButton"),
    };
  }

  setText(key, value) {
    if (this.el[key]) {
      this.el[key].textContent = value;
    }
  }

  setDisabled(key, disabled) {
    if (this.el[key]) {
      this.el[key].disabled = disabled;
    }
  }

  setButtonText(key, value) {
    if (this.el[key]) {
      this.el[key].textContent = value;
    }
  }

  setStatus(text) {
    this.setText("statusText", text);
  }

  render() {
    const g = this.game;
    this.setText("money", String(g.money));
    this.setText("weaponName", g.weaponSystem.currentName());
    this.setText("damage", g.getHudDamageText());
    this.setText("ammo", `${g.weaponSystem.ammoLabel()} | ${g.weaponSystem.activeShotLabel()}`);
    this.setText(
      "freeAbilities",
      String(g.trapStock.normal + g.trapStock.stachel + g.trapStock.diamant + g.trapStock.vulkan + g.trapStock.titan),
    );
    this.setText("levelLabel", `Level ${g.level}`);
    this.setText("xpLabel", `${Math.floor(g.xp)} / ${g.xpToNext} XP`);
    this.setText("meatUnits", String(g.inventory.totalMeat()));
    this.setText("meatValue", String(g.inventory.totalValue()));
    if (this.el.xpFill) {
      const ratio = g.xpToNext > 0 ? Math.max(0, Math.min(1, g.xp / g.xpToNext)) : 0;
      this.el.xpFill.style.width = `${(ratio * 100).toFixed(1)}%`;
    }

    if (this.el.inventoryList) {
      this.el.inventoryList.innerHTML = "";
      g.animalDefs.forEach((def) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${def.label}</span><strong>${g.inventory.store[def.type]}</strong>`;
        this.el.inventoryList.appendChild(li);
      });
    }

    const owns = g.weaponSystem.owned;
    this.setDisabled("buyRifleButton", owns.has("rifle") || g.money < 300);
    this.setDisabled("buyRifleProButton", owns.has("riflePro") || g.money < 950);
    this.setDisabled("buyRifleUltraButton", owns.has("rifleUltra") || g.money < 2400);
    this.setDisabled("buyRifleViperButton", owns.has("rifleViper") || g.money < 5200);
    this.setDisabled("buyRifleTitanButton", owns.has("rifleTitan") || g.money < 9800);
    this.setButtonText("buyRifleButton", owns.has("rifle") ? "Gekauft" : g.money < 300 ? "LOCK 300" : "Kaufen 300");
    this.setButtonText("buyRifleProButton", owns.has("riflePro") ? "Gekauft" : g.money < 950 ? "LOCK 950" : "Kaufen 950");
    this.setButtonText("buyRifleUltraButton", owns.has("rifleUltra") ? "Gekauft" : g.money < 2400 ? "LOCK 2400" : "Kaufen 2400");
    this.setButtonText("buyRifleViperButton", owns.has("rifleViper") ? "Gekauft" : g.money < 5200 ? "LOCK 5200" : "Kaufen 5200");
    this.setButtonText("buyRifleTitanButton", owns.has("rifleTitan") ? "Gekauft" : g.money < 9800 ? "LOCK 9800" : "Kaufen 9800");

    this.setDisabled("buyAmmoSmallButton", g.money < 30);
    this.setDisabled("buyAmmoBombButton", g.money < 140);
    this.setDisabled("buyAmmoScatterButton", g.money < 170);
    this.setButtonText("buyAmmoSmallButton", `Kaufen (${g.weaponSystem.normalAmmo})`);
    this.setButtonText("buyAmmoBombButton", `Kaufen (${g.weaponSystem.bombAmmo})`);
    this.setButtonText("buyAmmoScatterButton", `Kaufen (${g.weaponSystem.scatterAmmo})`);
    this.setDisabled("buyTrapNormalButton", g.money < g.trapDefs.normal.cost);
    this.setDisabled("buyTrapSpikedButton", g.money < g.trapDefs.stachel.cost);
    this.setDisabled("buyTrapDiamondButton", g.money < g.trapDefs.diamant.cost);
    this.setDisabled("buyTrapVulkanButton", g.money < g.trapDefs.vulkan.cost);
    this.setDisabled("buyTrapTitanButton", g.money < g.trapDefs.titan.cost);
    this.setButtonText("buyTrapNormalButton", `Kaufen (${g.trapStock.normal})`);
    this.setButtonText("buyTrapSpikedButton", `Kaufen (${g.trapStock.stachel})`);
    this.setButtonText("buyTrapDiamondButton", `Kaufen (${g.trapStock.diamant})`);
    this.setButtonText("buyTrapVulkanButton", `Kaufen (${g.trapStock.vulkan})`);
    this.setButtonText("buyTrapTitanButton", `Kaufen (${g.trapStock.titan})`);

    this.setDisabled("placeTrapNormalButton", g.trapStock.normal <= 0);
    this.setDisabled("placeTrapSpikedButton", g.trapStock.stachel <= 0);
    this.setDisabled("placeTrapDiamondButton", g.trapStock.diamant <= 0);
    this.setDisabled("placeTrapVulkanButton", g.trapStock.vulkan <= 0);
    this.setDisabled("placeTrapTitanButton", g.trapStock.titan <= 0);
    this.setButtonText(
      "placeTrapNormalButton",
      g.trapStock.normal <= 0
        ? "LOCK Normal"
        : g.activePlacement === "normal"
          ? "Klick ins Feld..."
          : "Normale platzieren",
    );
    this.setButtonText(
      "placeTrapSpikedButton",
      g.trapStock.stachel <= 0
        ? "LOCK Stachel"
        : g.activePlacement === "stachel"
          ? "Klick ins Feld..."
          : "Stachel platzieren",
    );
    this.setButtonText(
      "placeTrapDiamondButton",
      g.trapStock.diamant <= 0
        ? "LOCK Diamant"
        : g.activePlacement === "diamant"
          ? "Klick ins Feld..."
          : "Diamant platzieren",
    );
    this.setButtonText(
      "placeTrapVulkanButton",
      g.trapStock.vulkan <= 0
        ? "LOCK Vulkan"
        : g.activePlacement === "vulkan"
          ? "Klick ins Feld..."
          : "Vulkan platzieren",
    );
    this.setButtonText(
      "placeTrapTitanButton",
      g.trapStock.titan <= 0
        ? "LOCK Titan"
        : g.activePlacement === "titan"
          ? "Klick ins Feld..."
          : "Titan platzieren",
    );
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.gameArea = document.getElementById("gameArea");
    this.crosshair = document.getElementById("crosshair");
    this.sidebar = document.getElementById("sidebar");

    this.animalDefs = [
      { type: "huhn", label: "Huhn", tier: 1, role: "ground", hp: 1, size: [44, 30], speed: [92, 130], dropChance: 0.92, meatRange: [1, 2], meatValue: 8, weight: 22, colorA: "#fef3c7", colorB: "#f97316" },
      { type: "schwein", label: "Schwein", tier: 2, role: "ground", hp: 5, size: [72, 44], speed: [70, 96], dropChance: 0.84, meatRange: [3, 6], meatValue: 16, weight: 13, colorA: "#f9a8d4", colorB: "#ec4899" },
      { type: "ziege", label: "Ziege", tier: 2, role: "ground", hp: 4, size: [62, 38], speed: [78, 108], dropChance: 0.86, meatRange: [2, 4], meatValue: 14, weight: 14, colorA: "#d6d3d1", colorB: "#78716c" },
      { type: "schaf", label: "Schaf", tier: 3, role: "ground", hp: 6, size: [70, 44], speed: [66, 92], dropChance: 0.83, meatRange: [3, 6], meatValue: 17, weight: 11, colorA: "#f8fafc", colorB: "#cbd5e1" },
      { type: "kuh", label: "Kuh", tier: 4, role: "ground", hp: 10, size: [104, 58], speed: [50, 74], dropChance: 0.75, meatRange: [7, 12], meatValue: 32, weight: 10, colorA: "#e2e8f0", colorB: "#0f172a" },
      { type: "esel", label: "Esel", tier: 4, role: "ground", hp: 12, size: [98, 56], speed: [58, 84], dropChance: 0.72, meatRange: [7, 11], meatValue: 34, weight: 8, colorA: "#c4b5fd", colorB: "#5b21b6" },
      { type: "hirsch", label: "Hirsch", tier: 5, role: "ground", hp: 15, size: [106, 58], speed: [62, 92], dropChance: 0.69, meatRange: [8, 13], meatValue: 38, weight: 7, colorA: "#fdba74", colorB: "#9a3412" },
      { type: "pferd", label: "Pferd", tier: 5, role: "ground", hp: 25, size: [120, 66], speed: [58, 82], dropChance: 0.64, meatRange: [12, 18], meatValue: 48, weight: 5, colorA: "#fdba74", colorB: "#7c2d12" },
      { type: "stier", label: "Stier", tier: 5, role: "ground", hp: 20, size: [114, 64], speed: [52, 76], dropChance: 0.66, meatRange: [10, 15], meatValue: 43, weight: 6, colorA: "#94a3b8", colorB: "#111827" },
      { type: "bison", label: "Bison", tier: 6, role: "ground", hp: 35, size: [128, 72], speed: [46, 66], dropChance: 0.6, meatRange: [16, 24], meatValue: 56, weight: 3.2, colorA: "#78350f", colorB: "#451a03" },
      { type: "vogel", label: "Vogel", tier: 4, role: "air", hp: 1, size: [38, 24], speed: [150, 225], dropChance: 0.7, meatRange: [2, 4], meatValue: 26, weight: 5.2, colorA: "#bfdbfe", colorB: "#1d4ed8", minPlayerLevel: 1 },
      { type: "drache", label: "Drache", tier: 8, role: "bossAir", hp: 260, size: [210, 112], speed: [34, 52], dropChance: 1, meatRange: [45, 70], meatValue: 135, weight: 0.03, colorA: "#f97316", colorB: "#7c2d12", minPlayerLevel: 8 },
    ];

    this.trapDefs = {
      normal: { type: "normal", label: "Normale Falle", damage: 5, durability: 5, cost: 100, color: "#94a3b8" },
      stachel: { type: "stachel", label: "Falle Stachel", damage: 10, durability: 10, cost: 220, color: "#f97316" },
      diamant: { type: "diamant", label: "Falle Diamant", damage: 20, durability: 20, cost: 600, color: "#06b6d4" },
      vulkan: { type: "vulkan", label: "Falle Vulkan", damage: 35, durability: 30, cost: 1400, color: "#dc2626" },
      titan: { type: "titan", label: "Falle Titan", damage: 50, durability: 45, cost: 2800, color: "#7c3aed" },
    };

    this.money = 0;
    this.animals = [];
    this.traps = [];
    this.trapStock = { normal: 0, stachel: 0, diamant: 0, vulkan: 0, titan: 0 };
    this.activePlacement = null;
    this.particles = [];
    this.floatingTexts = [];
    this.lastTime = performance.now();
    this.level = 1;
    this.xp = 0;
    this.xpToNext = this.getXpTarget(this.level);
    this.collapsiblePanels = [];
    this.touchPanelsEnabled =
      window.matchMedia("(hover: none), (pointer: coarse)").matches || (navigator.maxTouchPoints || 0) > 0;
    if (this.touchPanelsEnabled) {
      document.body.classList.add("touch-panels");
    }

    this.inventory = new Inventory(this.animalDefs);
    this.weaponSystem = new WeaponSystem();
    this.shop = new Shop(this.weaponSystem, this.trapDefs);
    this.spawner = new Spawner(this.animalDefs);
    this.ui = new UIManager(this);

    this.bindEvents();
    this.resizeCanvas();
    this.centerCrosshair();
    this.spawnInitialAnimals();
    this.syncEmergencyWeapon(false);
    this.ui.render();
    this.ui.setStatus("Klick ins Spielfeld zum Schiessen.");
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resizeCanvas());
    this.collapsiblePanels = Array.from(document.querySelectorAll(".inventory-panel, .shop-column"));
    this.collapsiblePanels.forEach((panel) => {
      const unlock = () => panel.classList.remove("force-close");
      panel.addEventListener("mouseenter", unlock);
      panel.addEventListener("mousemove", unlock);
      panel.addEventListener("wheel", unlock, { passive: true });
      panel.addEventListener("focusin", unlock);
      panel.addEventListener("mouseleave", () => {
        panel.classList.remove("force-close");
      });
    });
    if (this.touchPanelsEnabled) {
      this.bindTouchPanelInteractions();
    }

    this.gameArea.addEventListener("pointermove", (event) => {
      this.updateCrosshairFromClient(event.clientX, event.clientY);
    });

    this.gameArea.addEventListener("pointerenter", (event) => {
      this.updateCrosshairFromClient(event.clientX, event.clientY);
      this.scrollSidebarToTop();
    });

    this.gameArea.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      if (this.touchPanelsEnabled && event.pointerType !== "mouse") {
        this.closeTouchPanels();
      }
      const pos = this.toCanvasPos(event);
      if (this.activePlacement) {
        this.placeTrap(pos.x, pos.y);
      } else {
        this.shoot(pos.x, pos.y);
      }
      this.ui.render();
      if (event.pointerType !== "mouse") {
        event.preventDefault();
      }
    });

    this.ui.el.sellButton?.addEventListener("click", () => {
      const payout = this.inventory.sellAll();
      if (payout <= 0) {
        this.ui.setStatus("Kein Fleisch im Lager.");
        this.closeHoverPanels();
        return;
      }
      this.money += payout;
      this.syncEmergencyWeapon(false);
      this.ui.setStatus(`FLEISCH VERKAUFT: +${payout} GELD.`);
      this.closeHoverPanels();
      this.ui.render();
    });

    this.ui.el.buyAmmoSmallButton?.addEventListener("click", () => this.buyAmmo("small"));
    this.ui.el.buyAmmoBombButton?.addEventListener("click", () => this.buyAmmo("bomb"));
    this.ui.el.buyAmmoScatterButton?.addEventListener("click", () => this.buyAmmo("scatter"));

    this.ui.el.buyRifleButton?.addEventListener("click", () => this.buyWeapon("rifle"));
    this.ui.el.buyRifleProButton?.addEventListener("click", () => this.buyWeapon("riflePro"));
    this.ui.el.buyRifleUltraButton?.addEventListener("click", () => this.buyWeapon("rifleUltra"));
    this.ui.el.buyRifleViperButton?.addEventListener("click", () => this.buyWeapon("rifleViper"));
    this.ui.el.buyRifleTitanButton?.addEventListener("click", () => this.buyWeapon("rifleTitan"));

    this.ui.el.buyTrapNormalButton?.addEventListener("click", () => this.buyTrap("normal"));
    this.ui.el.buyTrapSpikedButton?.addEventListener("click", () => this.buyTrap("stachel"));
    this.ui.el.buyTrapDiamondButton?.addEventListener("click", () => this.buyTrap("diamant"));
    this.ui.el.buyTrapVulkanButton?.addEventListener("click", () => this.buyTrap("vulkan"));
    this.ui.el.buyTrapTitanButton?.addEventListener("click", () => this.buyTrap("titan"));

    this.ui.el.placeTrapNormalButton?.addEventListener("click", () => this.togglePlacement("normal"));
    this.ui.el.placeTrapSpikedButton?.addEventListener("click", () => this.togglePlacement("stachel"));
    this.ui.el.placeTrapDiamondButton?.addEventListener("click", () => this.togglePlacement("diamant"));
    this.ui.el.placeTrapVulkanButton?.addEventListener("click", () => this.togglePlacement("vulkan"));
    this.ui.el.placeTrapTitanButton?.addEventListener("click", () => this.togglePlacement("titan"));
  }

  bindTouchPanelInteractions() {
    this.collapsiblePanels.forEach((panel) => {
      panel.addEventListener("click", (event) => {
        if (event.target.closest("button, a, input, select, textarea, label")) {
          return;
        }
        this.collapsiblePanels.forEach((item) => item.classList.remove("force-close"));
        const isOpen = panel.classList.contains("touch-open");
        this.closeTouchPanels();
        if (!isOpen) {
          panel.classList.add("touch-open");
        }
      });
    });

    document.addEventListener("click", (event) => {
      const clickedPanel = event.target.closest(".inventory-panel, .shop-column");
      if (!clickedPanel) {
        this.closeTouchPanels();
      }
    });
  }

  closeTouchPanels() {
    this.collapsiblePanels.forEach((panel) => panel.classList.remove("touch-open"));
  }

  resizeCanvas() {
    const rect = this.gameArea.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    this.canvas.width = Math.max(280, Math.floor(rect.width));
    this.canvas.height = Math.max(220, Math.floor(rect.height));
    this.centerCrosshair();
  }

  updateCrosshairFromClient(clientX, clientY) {
    if (!this.crosshair || !this.gameArea) {
      return;
    }
    const rect = this.gameArea.getBoundingClientRect();
    this.crosshair.style.left = `${clientX - rect.left}px`;
    this.crosshair.style.top = `${clientY - rect.top}px`;
  }

  centerCrosshair() {
    if (!this.crosshair || !this.gameArea) {
      return;
    }
    const rect = this.gameArea.getBoundingClientRect();
    this.crosshair.style.left = `${rect.width / 2}px`;
    this.crosshair.style.top = `${rect.height / 2}px`;
  }

  scrollSidebarToTop() {
    if (!this.sidebar) {
      return;
    }
    this.sidebar.scrollTo({ top: 0, behavior: "smooth" });
  }

  spawnInitialAnimals() {
    const starterCount = 3;
    for (let i = 0; i < starterCount; i += 1) {
      const type = this.spawner.pickType(this.level);
      this.spawnAnimal(type);
    }
    this.spawnAnimal("vogel");
  }

  closeHoverPanels() {
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    if (this.touchPanelsEnabled) {
      this.closeTouchPanels();
    }
    this.collapsiblePanels.forEach((panel) => {
      if (panel.classList.contains("shop-column")) {
        panel.classList.add("force-close");
      }
    });
  }

  getXpTarget(level) {
    return Math.floor(120 + (level - 1) * 45 + Math.pow(level - 1, 1.35) * 18);
  }

  getAnimalXp(animal) {
    return Math.max(2, Math.round(animal.maxHp * 1.4 + animal.meatValue * 0.18));
  }

  rollAnimalVariant(animalDef) {
    if (animalDef?.role === "bossAir") {
      return "normal";
    }
    const roll = Math.random();
    if (roll < 0.0032) {
      return "diamond";
    }
    if (roll < 0.0185) {
      return "gold";
    }
    return "normal";
  }

  getVariantRewards(variant) {
    if (variant === "gold") {
      return { moneyBonus: 45 + Math.floor(Math.random() * 31), xpBonus: 22, label: "Gold" };
    }
    if (variant === "diamond") {
      return { moneyBonus: 130 + Math.floor(Math.random() * 61), xpBonus: 56, label: "Diamant" };
    }
    return { moneyBonus: 0, xpBonus: 0, label: "" };
  }

  getHudDamageText() {
    const baseDamage = this.weaponSystem.damage();
    if (this.weaponSystem.emergencySlingshotActive) {
      return "0.5";
    }
    if (this.weaponSystem.activeShotType === "bomb") {
      return `${(baseDamage * 1.45).toFixed(1)} AoE`;
    }
    if (this.weaponSystem.activeShotType === "scatter") {
      return `${(baseDamage * 0.85).toFixed(1)} x3`;
    }
    return `${baseDamage}`;
  }

  syncEmergencyWeapon(showStatus) {
    const state = this.weaponSystem.updateEmergencyState(this.money);
    if (showStatus && state.becameActive) {
      this.ui.setStatus("Notfall aktiv: Steinschleuder bereit (unendliche Munition).");
    }
    if (showStatus && state.becameInactive) {
      this.ui.setStatus("Steinschleuder deaktiviert.");
    }
    return state;
  }

  grantXp(amount) {
    if (amount <= 0) {
      return { leveledUp: false, levelsGained: 0 };
    }
    this.xp += amount;
    let levelsGained = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = this.getXpTarget(this.level);
      levelsGained += 1;
    }
    return { leveledUp: levelsGained > 0, levelsGained };
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
    this.syncEmergencyWeapon(false);
    this.ui.setStatus(result.msg);
    this.closeHoverPanels();
    this.ui.render();
  }

  buyWeapon(type) {
    const result = this.shop.buyWeapon(type, this.money);
    this.money = result.money;
    this.syncEmergencyWeapon(false);
    this.ui.setStatus(result.msg);
    this.closeHoverPanels();
    this.ui.render();
  }

  buyTrap(type) {
    const result = this.shop.buyTrap(type, this.money, this.trapStock);
    this.money = result.money;
    this.syncEmergencyWeapon(false);
    this.ui.setStatus(result.msg);
    this.closeHoverPanels();
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
    this.closeHoverPanels();
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
    let emergencyState = this.syncEmergencyWeapon(false);
    const shot = this.weaponSystem.consumeShot();
    if (!shot.ok) {
      this.ui.setStatus("Keine Munition. Kaufe neue Munition im Shop.");
      return;
    }
    emergencyState = this.syncEmergencyWeapon(false);
    const baseDamage = this.weaponSystem.damage();
    let hits = 0;

    if (shot.shotType === "bomb") {
      hits = this.applyBombShot(x, y, baseDamage);
    } else if (shot.shotType === "scatter") {
      hits = this.applyScatterShot(x, y, baseDamage);
    } else {
      hits = this.applySingleShot(x, y, baseDamage, emergencyState.active ? "Steinschleuder" : "Schuss");
    }

    if (hits <= 0) {
      this.spawnFloatingText(x, y, "Miss", "#ef4444");
      this.ui.setStatus(
        emergencyState.active ? "Steinschleuder aktiv: Miss." : shot.shotType === "bomb" ? "Bombenschuss verfehlt." : "Miss.",
      );
    }
  }

  applySingleShot(x, y, damage, source) {
    for (let i = this.animals.length - 1; i >= 0; i -= 1) {
      const animal = this.animals[i];
      if (animal.dead || !animal.contains(x, y)) {
        continue;
      }
      animal.applyDamage(damage);
      this.spawnParticles(x, y, "#f87171", 8);
      if (animal.dead) {
        this.handleAnimalDeath(animal, source);
      } else {
        this.ui.setStatus(`${animal.label} getroffen: ${animal.hp} HP uebrig.`);
      }
      return 1;
    }
    return 0;
  }

  applyBombShot(x, y, baseDamage) {
    const radius = 88;
    const damage = baseDamage * 1.45;
    let hits = 0;
    this.spawnParticles(x, y, "#f59e0b", 26);
    this.spawnParticles(x, y, "#ef4444", 16);

    for (const animal of this.animals) {
      if (animal.dead) {
        continue;
      }
      const cx = animal.x + animal.width * 0.5;
      const cy = animal.y + animal.height * 0.5;
      const dist = Math.hypot(cx - x, cy - y);
      if (dist > radius) {
        continue;
      }
      animal.applyDamage(damage);
      hits += 1;
      if (animal.dead) {
        this.handleAnimalDeath(animal, "Bombe");
      }
    }
    if (hits > 0) {
      this.ui.setStatus(`Bombe detoniert: ${hits} Treffer.`);
    }
    return hits;
  }

  applyScatterShot(x, y, baseDamage) {
    const radius = 108;
    const maxTargets = 3;
    const damage = baseDamage * 0.85;
    const candidates = [];

    for (const animal of this.animals) {
      if (animal.dead) {
        continue;
      }
      const cx = animal.x + animal.width * 0.5;
      const cy = animal.y + animal.height * 0.5;
      const dist = Math.hypot(cx - x, cy - y);
      if (dist <= radius) {
        candidates.push({ animal, dist, cx, cy });
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);
    const targets = candidates.slice(0, maxTargets);
    let hits = 0;
    for (const target of targets) {
      target.animal.applyDamage(damage);
      this.spawnParticles(target.cx, target.cy, "#93c5fd", 6);
      hits += 1;
      if (target.animal.dead) {
        this.handleAnimalDeath(target.animal, "Mehrfachschuss");
      }
    }
    if (hits > 0) {
      this.ui.setStatus(`Mehrfachschuss: ${hits} Treffer.`);
    }
    return hits;
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

  spawnFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 0.7,
      vy: -34 - Math.random() * 22,
    });
  }

  handleAnimalDeath(animal, source) {
    this.spawner.notifyKill();
    const variantRewards = this.getVariantRewards(animal.variant);
    const gainedXp = this.getAnimalXp(animal) + variantRewards.xpBonus;
    let status = "";
    if (Math.random() <= animal.dropChance) {
      const min = animal.meatRange[0];
      const max = animal.meatRange[1];
      const amount = Math.floor(Math.random() * (max - min + 1)) + min;
      this.inventory.add(animal.type, amount);
      status = `${animal.label} erlegt (${source}): +${amount} Fleisch. +${gainedXp} XP.`;
    } else {
      status = `${animal.label} erlegt (${source}): kein Fleisch. +${gainedXp} XP.`;
    }
    if (variantRewards.moneyBonus > 0) {
      this.money += variantRewards.moneyBonus;
      status += ` ${variantRewards.label}-Bonus: +${variantRewards.moneyBonus} Geld.`;
    }
    const levelUpdate = this.grantXp(gainedXp);
    if (levelUpdate.leveledUp) {
      status += ` Levelaufstieg: Level ${this.level}.`;
    }
    this.ui.setStatus(status);
    this.spawnFloatingText(animal.x + animal.width / 2, animal.y - 8, "Kill", "#22c55e");
    this.spawnParticles(animal.x + animal.width / 2, animal.y + animal.height / 2, "#dc2626", 12);
  }

  spawnAnimal(type) {
    const def = this.animalDefs.find((item) => item.type === type);
    const variant = this.rollAnimalVariant(def);
    const id = `animal-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.animals.push(new Animal(id, def, this.canvas.width, this.canvas.height, variant));
  }

  updateSpawner(dt) {
    const spawnData = this.spawner.updateWithLevel(dt, this.animals.length, this.level);
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

  updateFloatingTexts(dt) {
    this.floatingTexts.forEach((item) => {
      item.life -= dt;
      item.y += item.vy * dt;
    });
    this.floatingTexts = this.floatingTexts.filter((item) => item.life > 0);
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

  drawFloatingTexts() {
    for (const item of this.floatingTexts) {
      this.ctx.globalAlpha = Math.max(0, item.life / 0.7);
      this.ctx.fillStyle = item.color;
      this.ctx.font = "bold 24px Segoe UI";
      this.ctx.fillText(item.text, item.x + 6, item.y - 8);
    }
    this.ctx.globalAlpha = 1;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.traps.forEach((trap) => trap.draw(this.ctx));
    this.animals.forEach((animal) => animal.draw(this.ctx));
    this.drawParticles();
    this.drawFloatingTexts();
  }

  loop(time) {
    const dt = Math.min(0.033, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.syncEmergencyWeapon(false);
    this.updateSpawner(dt);
    this.updateTraps(dt);
    this.updateAnimals(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.draw();
    this.ui.render();
    requestAnimationFrame((t) => this.loop(t));
  }
}

new Game();
