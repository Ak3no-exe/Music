# INSTALLER MUSICBOX — SANS PC

## 1. Créer le dépôt GitHub

Depuis ton téléphone :
- crée un dépôt GitHub ;
- envoie tous les fichiers du projet ;
- garde le dossier `.github/workflows/build-apk.yml`.

## 2. Lancer la compilation

Dans GitHub :
1. ouvre `Actions` ;
2. sélectionne `Build MusicBox APK` ;
3. appuie sur `Run workflow` ;
4. attends la fin du build.

## 3. Récupérer l'APK

Dans l'exécution terminée :
- descends à `Artifacts` ;
- télécharge `MusicBox-APK` ;
- ouvre l'archive ;
- récupère `app-debug.apk`.

## 4. Installer

Ouvre `app-debug.apk` sur ton téléphone. Android peut demander l'autorisation d'installer une application provenant de cette source.

## Important

Le dossier `android/` n'est pas nécessaire dans GitHub au départ : le workflow exécute `npx cap add android` puis `npx cap sync android`.
