# MusicBox — Capacitor

Projet mobile MusicBox basé sur Capacitor + Vite.

## Installation

Prérequis :
- Node.js LTS
- Android Studio
- Android SDK

Commandes :

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Puis dans Android Studio : Build > Generate App Bundles or APKs > Generate APKs.

## Fonctionnalités incluses dans ce socle

- Interface mobile responsive avec zones sécurisées Android
- Navigation Accueil / Bibliothèque / Playlists / Profil
- Import multiple de fichiers audio
- Copie locale dans l'espace de données de l'application
- Base IndexedDB locale persistante
- Favoris
- Recherche et tri
- Playlists de base
- Thème clair/sombre/auto
- Couleurs personnalisables
- Profil local
- Export/import JSON des métadonnées
- Lecteur audio local et mini-lecteur

## Important

Ce ZIP constitue un projet Capacitor fonctionnel de base. Pour une version production plus avancée, il faudra ajouter un plugin natif de médiathèque/MediaSession pour les contrôles de lecture Android en arrière-plan, ainsi que l'import de dossiers via un plugin SAF dédié. Les fichiers audio copiés dans l'espace privé de l'application restent toutefois disponibles après fermeture/redémarrage.
