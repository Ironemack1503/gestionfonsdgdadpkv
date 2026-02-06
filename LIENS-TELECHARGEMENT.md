# LIENS DE TELECHARGEMENT DIRECTS

## PostgreSQL 16 pour Windows (Recommande)
Lien direct: https://sbp.enterprisedb.com/getfile.jsp?fileid=1258893

OU version 15:
https://sbp.enterprisedb.com/getfile.jsp?fileid=1258893

## Nginx pour Windows (Stable)
Lien direct: https://nginx.org/download/nginx-1.24.0.zip

---

# INSTRUCTIONS D'INSTALLATION

## PostgreSQL (15-20 minutes)

1. Lancez l'installateur .exe telecharge
2. Cliquez "Next" jusqu'a "Select Components"
3. Cochez ces composants:
   [X] PostgreSQL Server
   [X] pgAdmin 4
   [X] Command Line Tools
   [ ] Stack Builder (optionnel)

4. Installation Directory: C:\Program Files\PostgreSQL\16 (par defaut)
5. Data Directory: C:\Program Files\PostgreSQL\16\data (par defaut)

6. PORT: 5432 (NE PAS CHANGER!)

7. MOT DE PASSE SUPERUSER:
   IMPORTANT: Choisissez un mot de passe fort et NOTEZ-LE!
   Suggestion: GestionFonds2026!
   
   NOTEZ-LE ICI: ___________________________

8. Locale: [Default locale] (par defaut)

9. Cliquez "Next" puis "Install"

10. Decochez "Stack Builder" a la fin et cliquez "Finish"

## Nginx (5 minutes)

1. Extrayez le fichier nginx-1.24.0.zip
2. Renommez le dossier en "nginx"
3. Deplacez ce dossier vers C:\
   Resultat final: C:\nginx\nginx.exe

---

# VERIFICATION

Apres installation, ouvrez PowerShell et testez:

```powershell
# Tester PostgreSQL
psql --version

# Tester Nginx
cd C:\nginx
.\nginx.exe -v
```

Une fois les deux installes, revenez ici et dites "c'est installe"!
