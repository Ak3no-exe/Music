# Architecture MusicBox

```text
MusicBox UI (HTML/CSS/JS)
        |
        +-- IndexedDB : fichiers audio + bibliothèque
        |
        +-- Player HTMLAudioElement
        |      +-- Media Session Android/WebView
        |
        +-- Playlists / Favoris / Dossiers
        |
        +-- Préférences : thème / accent / profil
        |
        +-- Capacitor Android
               |
               +-- future SAF / sélection native de dossiers
               +-- future Foreground Media Service / Media3
```

## Stockage

Les fichiers audio importés sont copiés dans IndexedDB de l'application afin de rester disponibles après fermeture de l'application.

## Intégration native future

`android-native/` contient le point de départ pour ajouter des bridges Capacitor natifs :
- Android Storage Access Framework (SAF)
- Media3 / MediaSession
- Foreground Service pour lecture en arrière-plan
- notifications et contrôles du lecteur
