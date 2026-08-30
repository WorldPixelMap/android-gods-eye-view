# 🌍 Data Sources, Licenses & Attribution

God's Eye View fuses diverse real-time geospatial intelligence, satellite telemetry, aviation/maritime tracking, environmental sensors, and 3D terrain feeds.

This document outlines the authoritative data sources, upstream providers, licensing terms, and attribution notices for all live and static feeds utilized in the application.

---

## 📡 Live Telemetry & API Feeds

| Layer / Feature | Source & Provider | Access & Cost | Upstream Terms & Licensing | Description |
|---|---|---|---|---|
| **3D Photorealistic Globe & Terrain** | [Google Maps Platform](https://developers.google.com/maps/documentation/tile/3d-tiles) | API Key Required (Free tier available) | [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms) | High-fidelity 3D meshes and photogrammetry covering global metropolitan centers and landscapes. Attribution overlay (`#cesium-credits`) is preserved on-screen per ToS. |
| **2D Base Maps & Vectors** | [OpenStreetMap (OSM)](https://www.openstreetmap.org/) / [CartoDB](https://carto.com/) | 100% Free / Open | [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/) / CC-BY-SA 2.0 | Global base map vector styling, place boundaries, highway grids, and municipal features. |
| **Live Flight Tracking (ADS-B)** | [OpenSky Network](https://opensky-network.org/) / [adsb.lol](https://adsb.lol/) | 100% Free (Anonymous & Authenticated modes) | [OpenSky Terms of Use](https://opensky-network.org/about/terms-of-use) / Community Open Data | Real-time global aircraft state vectors, callsigns, barometric altitude, velocity, and transponder telemetry. |
| **Live Marine & Maritime (AIS)** | [AISStream.io](https://aisstream.io/) | API Key Required (Free Developer Tier) | [AISStream Terms of Service](https://aisstream.io/terms) | Real-time global vessel positions, MMSI, ship names, heading, and navigation status via WebSocket. |
| **Satellite Orbits & Spacecraft** | [CelesTrak](https://celestrak.org/) / [Space-Track](https://www.space-track.org/) | 100% Free / Public Access | Public Domain & CelesTrak Access Policy | Two-Line Element sets (TLEs), orbital ephemerides, and SGP4 propagation for ISS, Starlink, GPS, and weather satellites. |
| **Space Missions & Rocket Launches** | [Launch Library 2](https://thespacedevs.com/llapi) (The Space Devs) | 100% Free | [The Space Devs API Policy](https://thespacedevs.com/) | Global spaceport coordinates, launch countdowns, mission objectives, and launch vehicle profiles. |
| **Live Global Weather & Cloud Cover** | [Open-Meteo API](https://open-meteo.com/) | 100% Free (Non-commercial & Open) | [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) | High-resolution atmospheric forecast models, temperature, cloud coverage fractions, wind vectors, and precipitation. |
| **Global Earthquakes & Seismic** | [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) | 100% Free / Public Domain | [USGS Data Policy](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits) (U.S. Government Work) | Real-time seismic event notifications, Richter magnitudes, hypocenter depth, and shakemap telemetry. |
| **Active Wildfires & Thermal** | [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (VIIRS / MODIS) | 100% Free / Public Domain | [NASA Data Policy](https://earthdata.nasa.gov/earth-observation-data/data-use-policy) (CC0 / U.S. Public Domain) | Satellite thermal anomaly detection identifying active wildfire perimeters and heat intensities. |
| **Worldwide Live Internet Radio** | [Radio-Browser.info](https://www.radio-browser.info/) | 100% Free Community API | [Public Domain / CC0 Community Catalog](https://www.radio-browser.info/) | 30,000+ geo-located international audio broadcast streams. |
| **Live Traffic Simulation** | Internal Vector Engine + [OSM Overpass API](https://overpass-api.de/) | 100% Free | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) | Dynamic, speed-calibrated road network flow simulation over OpenStreetMap highway networks. |
| **Live City CCTV Streams** | [Transport for London (TfL JamCams)](https://api.tfl.gov.uk/) | 100% Free Open Data | [Open Government Licence (OGL v3.0)](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) | 890+ street & intersection photographic snapshot feeds across Greater London. |
| **Live City CCTV Streams** | [California DOT (Caltrans D4)](https://cwwp2.dot.ca.gov/) | 100% Free Open Data | State of California Public Records | 740+ highway and intersection photographic feeds across San Francisco & Bay Area. |
| **Live City CCTV Streams** | [City of Austin Mobility Open Data](https://data.austintexas.gov/) | 100% Free Open Data | City of Austin Open Data Portal | Real-time photographic intersection cameras across Austin, TX. |

---

## 🗄️ Bundled Local Datasets

The static datasets bundled under [`src/data/local_data/`](file:///c:/xampp/htdocs/src/data/local_data/) are included for offline/local intelligence visualization:

- **TeleGeography Submarine Cable Map:**
  - *Path:* `src/data/local_data/telegeography_submarine_cables/`
  - *License:* [Creative Commons Attribution-NonCommercial-ShareAlike 3.0 (CC BY-NC-SA 3.0)](https://creativecommons.org/licenses/by-nc-sa/3.0/)
  - *Restrictions:* **Non-commercial only.** Commercial distribution or integration requires separate licensing from TeleGeography.
- **Datacenters & Dams GeoJSON:**
  - *Path:* `src/data/local_data/`
  - *License:* [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/)
  - *Source:* Extracted from OpenStreetMap / Open Infrastructure Map.
- **Natural Earth Boundaries & Geometries:**
  - *License:* Public Domain ([Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/)).

---

## ✈️ 3D Model Visual Assets

Third-party 3D models stored under [`public/models/`](file:///c:/xampp/htdocs/public/models/) are licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/):

| Model File | Work & Original Creator | Source & License | Modifications |
|---|---|---|---|
| `airplane.glb` | “boeing 747” by [zairiq-123](https://sketchfab.com/zairiq-123) | Sketchfab (CC BY 4.0) | Geometry & material optimization, coordinate orientation vertex-baked. |
| `jet.glb` | “Private Jet” by [Nick the Name](https://sketchfab.com/Nick_The_Name) | Sketchfab (CC BY 4.0) | Optimized glTF binary, scale and origin centered. |
| `ship.glb` | “Low Poly Cargo Ship” by [Javier_Fernandez](https://sketchfab.com/Javier.Fernandez) | Sketchfab (CC BY 4.0) | Optimized glTF binary for vessel layer. |
| `bell206.glb` | “Bell 206 JetRanger” by [terran4627](https://sketchfab.com/terran4627) | Sketchfab (CC BY 4.0) | WebP texture compression, vertex-baked meter scale. |
| `c172.glb` | “Cessna 172” by [e737](https://sketchfab.com/e0057537) | Sketchfab (CC BY 4.0) | Simplified materials, Y-up convention applied. |
| `citation2.glb` | “1990 Cessna Citation” by [BlenderCommunityHead](https://sketchfab.com/aboodgoudagad) | Sketchfab (CC BY 4.0) | WebP texture compression, vertex-baked meter scale. |
| `mq9.glb` | “MQ-9” by [IProZenoN](https://sketchfab.com/IProZenoN) | Sketchfab (CC BY 4.0) | Simplified materials, real-world metric dimensions. |
| `b789.glb` | “Boeing 787-9” by [Nobilis 2](https://sketchfab.com/nobilishornet2) | Sketchfab (CC BY 4.0) | Texture optimization and origin centered. |
| `atr72.glb` | “ATR 72 - 600” by [Oyan3D](https://sketchfab.com/oyan3D) | Sketchfab (CC BY 4.0) | Abstracted PBR factors, metric orientation vertex-baked. |

*Full modification notices and links are detailed in [`public/models/README.md`](file:///c:/xampp/htdocs/public/models/README.md).*

---

## ⚖️ General Compliance & Ethical Boundaries

1. **Attribution Requirement:**
   - Any deployment of this application must preserve all in-app attribution badges, including Cesium Ion, Google Maps Platform credits, OpenStreetMap notices, and data provider marks.
2. **Non-Personal Data Policy:**
   - All layers represent public systems, infrastructure, vehicles, natural events, and public cameras. No private tracking, individual facial recognition, or named-person queries are supported.
3. **Operational Disclaimer:**
   - This software provides exploratory visualizations of public feeds. Data is subject to upstream delays and inaccuracies. **Do not use for flight navigation, maritime steering, emergency dispatch, or safety-critical operations.**
