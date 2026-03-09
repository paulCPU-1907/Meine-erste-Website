# Projekt

## Name
2D-Jagdspiel

## Ziel
Sauberes 2D-Jagdspiel: Tiere jagen, Fleisch sammeln/verkaufen, Geld verdienen, Ausruestung verbessern.

## Features
- 10 Tierarten im Hintergrund mit HP-System und roter Lebensleiste
- Zielvisier und Schiessen im Vordergrund
- Munitionssystem (nicht unendlich, jeder Schuss verbraucht 1)
- Fleisch-Drops je Tierart (Chance, Menge, Wert)
- Verkauf des gesamten Lagerfleischs per Button
- Geldsystem fuer Upgrades
- Shop in getrennten Bereichen fuer Waffen, Munition und Fallen
- Waffen: Standard, Jagdgewehr, Jagdgewehr Pro, Jagdgewehr Ultra
- Fallen: normal, stachel, diamant (mehrfach kaufbar und platzierbar)
- Fallen mit echter Haltbarkeit je nach tatsaechlich verursachtem Schaden
- Dynamisches Spawn-System mit Anpassung an Tierzahl und Killtempo

## Technik
- HTML
- CSS
- JavaScript (Canvas 2D)
- Klassenstruktur:
  - `Animal`
  - `WeaponSystem`
  - `Trap`
  - `Inventory`
  - `Shop`
  - `Spawner`
  - `UIManager`
  - `Game`
