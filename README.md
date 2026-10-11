# Mappa politica del Plumbus — Atlas

Versione atlas-4: stile editoriale avorio (come la prima versione pubblicata), testi più grandi e leggibili, guida agli assi sotto il grafico. Schede: Mappa 3D, Profili, Statistiche, Confronto.

## Pubblicazione su un repository vuoto
1. Estrai lo ZIP sul computer. NON caricare lo ZIP come singolo file.
2. Carica tutto il contenuto estratto nella radice del repository:
   index.html, cartelle css/, js/, data/, vendor/, README.md, THIRD_PARTY.md e .nojekyll.
3. Controlla l'anteprima del caricamento: deve esserci vendor/three.min.js,
   non three.min.js nella radice. Usa GitHub Desktop se il browser appiattisce le cartelle.
4. In Settings > Pages, seleziona Deploy from a branch, main, / (root) e Save.
5. Apri l'indirizzo indicato da GitHub nella pagina Pages.

Non serve npm, compilazione, backend o un tema Jekyll. Le librerie del 3D sono incluse.
Il file .nojekyll è nascosto su alcuni sistemi: se manca, crealo con quel nome su GitHub.

## Struttura
- index.html: struttura e navigazione.
- css/atlas.css: stile generale, Profili, Statistiche e Confronto.
- css/atlas-map.css: stile isolato della Mappa 3D.
- js/atlas-core.js: dati, validazione e calcoli comuni.
- js/atlas-scene.js: scena Three.js, camera, etichette e gesti.
- js/atlas-app.js: avvio, schede, selezione condivisa e controlli.
- js/atlas-profiles.js: schede descrittive, 12 barre, ricerca.
- js/atlas-stats.js: grafici SVG/HTML e download dei dati CSV.
- js/atlas-compare.js: confronti e classifica delle distanze.
- data/people.json: unica fonte dei dati (11 partecipanti, 10 schede complete).
- vendor/: Three.js r128 e OrbitControls della stessa versione.

## Prova sul computer
Non aprire index.html con doppio clic: fetch del JSON richiede un server HTTP.
Se Python è installato, nella cartella estratta esegui:

    python -m http.server 8000

Poi apri http://localhost:8000 nel browser. In alternativa pubblica su GitHub Pages.

## Come leggere e usare
- Mappa: trascina per ruotare; due dita per zoomare sul telefono.
- Seleziona una sfera oppure un nome nell'elenco.
- Le tre viste piane nascondono l'asse escluso; sono prospettive della scena Three.js.
- Il colore predefinito indica Economia: rosso = Socialismo, blu = Capitalismo.
  Puoi scegliere Autorità o Valori sociali. La saturazione raggiunge il massimo a ±7:
  non rappresenta un risultato aggiuntivo del test e non implica un'appartenenza di partito.
- Apri “Personalizza la mappa e i gesti” per nomi, griglia, proiezioni, affinità,
  rotazione lenta e blocco del grafico. Il blocco permette lo scorrimento verticale.
- Profili: cerca un nome, leggi le 12 barre, trova la persona sulla mappa o confrontala.
- Statistiche: grafici descrittivi e dati grezzi scaricabili in CSV con tutte le 12 categorie.
- Confronto: indici geometrici, NON percentuali di accordo politico o affinità personale.

## Aggiornare i dati
Modifica data/people.json. Mantieni ID univoci (lettere, numeri, trattino o underscore),
coordinate X/Y/Z tra -10 e +10, valori dei 12 assi tra -100 e +100.
Non attribuire categorie mancanti: Safet non ha una scheda completa.
Le coordinate sono stime dagli screenshot, non valori ufficiali del test.
Il restyling non modifica il file dati della precedente versione.
Le associazioni delle schede ai nomi e le discrepanze già note vanno ancora controllate
con gli screenshot originali: questo lavoro non costituisce una nuova validazione dei dati.

## Controlli eseguiti e limiti
- Sintassi JavaScript e parsing dei due fogli CSS.
- Struttura HTML, ID univoci e presenza delle risorse locali collegate.
- Validazione dati; generazione delle sezioni Profili, Statistiche e Confronto con DOM simulato.
- Nessun NaN o undefined nei risultati HTML generati; scheda mancante di Safet gestita.
- I file dati e le librerie sono conservati senza modifiche.
Non sono stati eseguiti rendering WebGL reale, prove visive, Safari/iPhone o test touch.
Non si garantisce quindi l'assenza di sovrapposizioni grafiche su ogni dispositivo.
Il suffisso ?v=atlas-2026-01 sui CSS/JS evita di riusare i vecchi file in cache.

## Privacy
Nomi, note e risultati sono leggibili nel sito e in un repository pubblico.
Chiedi il consenso degli interessati prima di pubblicare.
noindex non protegge i dati né limita l'accesso: è soltanto un'indicazione ai motori di ricerca.
Nessun analytics, nessun servizio IA, nessun invio dei risultati a server esterni.

## Cosa cambia nella versione atlas-4
- Stile avorio con titoli in serif, schede morbide e pulsanti a pillola.
- Testi più grandi (nessuna scritta sotto i 12 px) e barre dei 12 assi con i poli sempre scritti.
- Sotto il grafico c'è la guida ai tre assi, con le stesse scale di colore dei punti.
- Istogrammi delle statistiche con etichette che non si sovrappongono.
- Se un file di stile o di script è mancante o di una versione diversa, in basso compare un riquadro rosso con l'elenco dei file da ricaricare.
