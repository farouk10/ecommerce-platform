# Comment compiler votre Rapport LaTeX

Le fichier `report.tex` contient tout le code source de votre rapport, y compris les diagrammes. Voici les deux meilleures méthodes pour le transformer en PDF.

## Option 1 : Overleaf (Recommandé & Rapide)

C'est la méthode la plus simple car elle ne nécessite aucune installation.

1. Allez sur [Overleaf.com](https://www.overleaf.com) et connectez-vous.
2. Cliquez sur **"New Project"** > **"Blank Project"**.
3. Donnez un nom (ex: "Rapport PFE").
4. Dans l'éditeur qui s'ouvre, vous verrez un fichier `main.tex`. **Supprimez tout son contenu**.
5. Ouvrez le fichier `report.tex` présent dans ce dossier, copiez TOUT le contenu, et collez-le dans `main.tex` sur Overleaf.
6. Cliquez sur le bouton vert **"Recompile"**.
   - _Note : Les diagrammes (TikZ) et la table des matières seront générés automatiquement._
   - _Astuce : Si la table des matières est vide, cliquez sur Recompile une deuxième fois._

## Option 2 : En local sur votre Mac (Avancé)

Si vous préférez travailler hors ligne, vous devez installer une distribution LaTeX.

1. **Installer MacTeX** (Attention, c'est volumineux : ~4-5 Go) :

   - Téléchargez sur : [https://www.tug.org/mactex/](https://www.tug.org/mactex/)
   - Ou via Homebrew : `brew install --cask mactex`

2. **Utiliser VS Code** :

   - Installez l'extension **"LaTeX Workshop"** dans VS Code.
   - Ouvrez `report.tex`.
   - Une icône "TeX" apparaitra dans la barre latérale gauche. Cliquez dessus puis sur "Build LaTeX project".

3. **Via le Terminal** :
   Une fois MacTeX installé, lancez simplement :
   ```bash
   pdflatex report.tex
   ```
   (Lancez la commande 2 fois pour générer correctement les sommaires).
