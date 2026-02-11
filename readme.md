# OpenLayers Map Project – Schnellstart

Dieses Projekt zeigt eine interaktive OpenLayers-Karte mit:

- Verschiedene Kartenquellen: Bing Maps (Satellit), OSM, CartoDB
- Geolocation (eigene Position anzeigen)
- Zeichnen von Punkten, Linien, Polygonen und Kreisen
- Features speichern, laden, löschen oder als GeoJSON herunterladen
- Übersichtskarte, Vollbild-, Maßstabs- und Zoom-Steuerung

---

## Schnell starten

1. Repository klonen:

```bash
git clone https://github.com/neslihanyilmaz/openlayers.git
cd openlayers

2. Abhängigkeiten installieren
npm install

3. Entwicklungsserver starten:
npm start

Tipps bei Problemen
Node.js >= 20 und npm installiert?
Bei Fehlern node_modules und package-lock.json löschen und neu installieren:
rm -rf node_modules package-lock.json
npm install
npm start
.DS_Store stören manchmal (Mac):
find . -name ".DS_Store" -delete
