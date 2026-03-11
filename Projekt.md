# Projekt

## Name
2D-Jagdspiel

## Ziel
Sauberes 2D-Jagdspiel: Tiere jagen, Fleisch sammeln/verkaufen, Geld verdienen, Ausruestung verbessern.

## Features
- Fester Spielbereich rechts (Canvas) + scrollbare Sidebar links
- HUD oben im Spielfeld (Geld, Waffe, Schaden, Munition, freie Faehigkeiten, Level, XP)
- Zielvisier im Vordergrund
- Schiessen per Klick
- Rote HP-Leisten ueber allen Gegnern
- Fehlschuss zeigt rotes `Miss` als Floating-Text
- Kill zeigt gruenes `Kill` als Floating-Text

## Gegner-System
- Bodengegner mit Stufen (Tier 1 bis Tier 6):
  - Huhn, Schwein/Ziege, Schaf, Kuh/Esel, Pferd/Hirsch/Stier, Bison
- Luftgegner:
  - Vogel (fliegend, 1 HP, haeufiger Spawn)
- Sehr seltener Boss:
  - Drache (sehr hohe HP, hohe Belohnung)
- Spezialvarianten:
  - Goldene Tiere (selten)
  - Diamantene Tiere (sehr selten)
- Spezialvarianten geben Bonus-Geld und Bonus-XP

## Spawn/Progression
- Dynamische Spawnrate basierend auf Killtempo, Gegneranzahl und Spielerlevel
- Wahrscheinlichkeitsbasiertes Spawn-System:
  - Schwache Gegner haeufig, starke seltener, Boss extrem selten
- Level-Regeln:
  - Level 1-4: normale Tierpalette
  - Ab Level 5: Tiere unter Tierstufe 3 stark reduziert
  - Ab Level 10: Tiere unter Tierstufe 3 erscheinen nicht mehr
- XP-System:
  - Gegner geben XP
  - Level-Up mit steigender XP-Schwelle
  - XP-Balken + Levelanzeige im HUD

## Waffen & Munition
- Waffen:
  - Standardwaffe
  - Jagdgewehr
  - Jagdgewehr Pro
  - Jagdgewehr Ultra
  - Jagdgewehr Viper
  - Jagdgewehr Titan
- Waffenpreise im Button:
  - `LOCK <Preis>` bei zu wenig Geld
  - `Kaufen <Preis>` bei genug Geld
  - `Gekauft` nach Kauf
- Munitionsarten:
  - Munition Klein (normal)
  - Munition Bombe (Radius/AoE)
  - Munition Mehrfachschuss (mehrere Ziele mit 1 Schuss)
- HUD-Munition:
  - `N` immer sichtbar
  - `B`/`M` nur sichtbar wenn Bestand > 0

## Notfallwaffe
- Automatische Steinschleuder:
  - Aktiv bei 0 Gesamtmunition und Geld < 30
  - Schaden: 0.5
  - Unendliche Munition
  - Nicht kaufbar, nicht manuell waehlbar
  - Deaktiviert automatisch bei Geld >= 30 oder verfuegbarer Munition

## Fallen
- Fallen kaufbar und platzierbar:
  - Normal, Stachel, Diamant
- Haltbarkeit sinkt nur um tatsaechlich verursachten Schaden
- Gesperrte Platzierungen klar markiert:
  - `LOCK ...`
- Vulkan/Titan-Platzierung aktuell sichtbar gesperrt

## Lager/Verkauf
- Lagerbereich als Hover-Panel
- Buttontext einheitlich `VERKAUFEN`
- Verkauf verkauft gesamtes Lager
- Verkaufsstatus: `FLEISCH VERKAUFT: +... GELD.`

## UI/UX
- Hover-Panels schliessen nach Aktionen sauber
- Hover-Lock-Bug beim Scrollen behoben (unlock bei mouseenter/mousemove/wheel/focus)
- Waffen-/Munitionskarten ausgerichtet und gut klickbar
- Tiernamen nicht gespiegelt bei Rechts-nach-Links-Bewegung
- Hitbox fuer Fluggegner verbessert, damit Treffer korrekt erkannt werden

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
