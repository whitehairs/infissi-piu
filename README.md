# InfissiPiu — Porting web completo iniziale

Questo repository contiene la versione HTML5/JS del progetto WinForms **InfissiPiu**.
È un porting *best-effort* del comportamento originale: calcoli per tipi TT/TGP, supporto per più ante, disegno su canvas e esportazione risultati (JSON/CSV).

## Struttura
- `index.html` — interfaccia web
- `style.css` — stili
- `script.js` — logica di calcolo, canvas e export

## Come testare localmente
1. Scarica o clona il repository.
2. Apri `index.html` in un browser moderno.
3. Scegli Tipo, Numero Ante, Altezza e Larghezza e clicca **Calcola**.
4. Usa **Esporta JSON/CSV** per salvare i risultati.

## Pubblicazione su GitHub Pages (istruzioni rapide)
Opzione A — branch `gh-pages` (consigliata):
```
git init
git add .
git commit -m "Porting web InfissiPiu"
git branch -M main
git remote add origin <YOUR_GIT_URL>
git push -u origin main
# poi in GitHub repository settings -> Pages -> Source: gh-pages branch (or main/docs)
```
Oppure crea branch gh-pages e spingi lì:
```
git checkout -b gh-pages
git push origin gh-pages
```

Opzione B — cartella `docs/`:
- Sposta i file nella cartella `docs/` sulla branch `main` e abilita GitHub Pages dalla cartella `docs`.

## Note importanti e limiti
- Questo porting è stato automatizzato a partire dal sorgente WinForms; alcune parti del codice originale contenevano molte varianti e conteggi di componenti specifici (es. molte variabili `akXXXXX` e rendering dinamico). Ho applicato regole euristiche per generalizzare il comportamento per N ante. Se vuoi una conversione "line-by-line" completa di ogni singola ramificazione (es. tutti gli `ak` e label esatte come nel WinForms), posso farlo su richiesta usando il sorgente originale per mappare ogni caso esplicitamente.
- Il disegno è implementato con canvas e mostra scala approssimata e dimensioni; può essere raffinato (colori, esportazione immagine, annotazioni dimensioni, unità diverse).

---

# v2.0 Versione cliente (bianco e blu)

Questa versione è stata creata per mostrare i risultati in modo leggibile da clienti o non-tecnici.
Contiene:
- tabella Riepilogo (dati generali)
- tabella Dettaglio per anta (colonne semplici)
- disegno su canvas in scala approssimata
- esportazione JSON/CSV
- funzione Stampa (usa la funzione Stampa del browser per ottenere PDF)

## Note
- I valori di prezzo non sono presenti nel sorgente originale, pertanto questa versione non contiene prezzi o preventivi.
- Se desideri includere prezzi, posso aggiungere campi per costo/unità, moltiplicatori e una sezione "Totale preventivo".

---

# v3.0 Mobile-potrait-optimized (print with canvas image)

This package contains the mobile-optimized version with:
- responsive UI for portrait smartphones
- canvas resizing on window/orientation changes
- print flow that converts the canvas to an <img> (so the render is included in PDF)
- the Log section is hidden in print

---

# v3.1 Mobile-optimized 
This package contains the mobile-optimized version with:
- responsive UI for portrait smartphones
- canvas resizing on window/orientation changes
- print flow that converts the canvas to an <img> (so the render is included in PDF)
- the Log section is hidden in print

Open `index.html` on a mobile device to test, or use browser devtools mobile emulation.
