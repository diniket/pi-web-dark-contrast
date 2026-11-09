# Verifica Dark Contrast — aggiornata 2026-11-09 (tema v0.2.0)

## Cosa è cambiato rispetto alla verifica precedente

La prima versione era un plugin di presentazione: corretta graficamente e isolata, ma **non selezionabile** in **Settings → General → Theme**, perché quel selettore mostra solo i temi dichiarati. Su richiesta dell'utente il pacchetto è stato convertito in **tema CSS dichiarativo** e installato.

Conseguenza tecnica da dichiarare: un tema selezionato **sostituisce** la palette globale, quindi per mantenere i plugin (OpenSpec compreso) sui loro colori il tema incorpora una copia **byte-identica** della palette ufficiale *PI WEB Dark* e sovrappone solo regole ristrette ai componenti core.

## Esito

| Verifica | Esito |
|---|---|
| Test statici (`npm test`) | **20/20** |
| Baseline ufficiale intatta | SHA-256 `88b39cf2…7692`, 52 token |
| Isolamento OpenSpec (stili calcolati, 246 elementi) | invariato |
| Token `--pi-*` ereditati dal pannello OpenSpec | 58, invariati |
| Matrice browser 6 viewport | 1792/1380/1381/1024: **22/22**; 390/320: **21/21** + 1 esclusione dichiarata |
| Errori console del pacchetto | 0 |
| Verifica visiva su istanza reale (`cristina`, 8504) | tema applicato, OpenSpec con palette originale |
| Modifiche a OpenSpec | **0** (28 file con hash identico, Git pulito) |
| Configurazione Pi Web | invariata (SHA-256 `fdc228c3…8730` su `pi-hub`) |
| Servizi `pi-web`, `pi-web-sessiond` | attivi, **mai riavviati** |

## Selettore Theme — verificato su UI reale

Con `computer-use-linux` sull'istanza reale di `cristina` (`127.0.0.1:8504`, quella con OpenSpec):

1. **Settings → General → Theme**: l'elenco mostra `PI WEB Dark, PI WEB Light, PI WEB Classic, Paper, Pendant Dark, …, Graphite, Dark Contrast`.
2. Selezione di **Dark Contrast** → **Use in this browser**: il riepilogo passa a *Current: Dark Contrast*.
3. Dopo il reload, il core usa la nuova palette: sidebar `#161B22`, selezione blu con bordo, riga progetto/sessione evidenziata, composer con bordo arrotondato e focus blu.
4. Aprendo la tab **OpenSpec**: barra di avanzamento, pill `Proposal/Design/Specs/Tasks` e tipografia restano **viola/originali**, non ridisegnate.

La stessa verifica è stata ripetuta su `pi-hub` (`127.0.0.1:8504`): `GET api/themes` elenca `dark-contrast:dark-contrast` e il picker la mostra.

Nessuna scelta è stata forzata sul browser personale dell'utente: il tema è stato attivato solo in un profilo Firefox di prova. La scelta resta all'utente.

## Isolamento: metodo

Nell'anteprima isolata il confronto avviene **in memoria**: si rimuovono i fogli Dark Contrast dai root adottati e si adotta la palette ufficiale, poi si confrontano gli stili calcolati del pannello OpenSpec reale (caricato dal pacchetto esistente, senza copiarlo né modificarlo).

- proprietà confrontate: colori di testo/sfondo/bordi, font-size, family, weight, line-height;
- elementi: **246** (vista Proposal espansa);
- token ereditati: **58** dichiarazioni `--pi-*` lette dal pannello.

Esclusione dichiarata: la geometria non è pixel-identica, perché sugli schermi ampi il tema imposta la sidebar a 314px e il pannello strumenti a 35vw (proporzioni vicine al mockup). Il contenuto del plugin mantiene colori, font e nessun overflow orizzontale.

Copertura non esaustiva: sono state osservate le viste elencate nel rapporto, non ogni schermata o funzione di OpenSpec.

## Verifica visiva e responsive

- Screenshot reali con `cristina-desktop` (MCP `@agent-sh/computer-use-linux`): apertura del picker, applicazione del tema, tab OpenSpec con palette originale.
- `browser_execute` (CDP dedicato Pi, porta 9223) per DOM, stili calcolati, console e screenshot di supporto; un bridge HTTP lato CDP ha limitato il traffico alla sola anteprima.
- Matrice dimensioni con ispezione reale di: colori di sidebar/chat, selezione riga, popup nativo, apertura/chiusura eventi, due tool con stati distinti, composer modificabile, placeholder, focus, azione predefinita, scroll, contenimento e overflow.
- Sui viewport mobili è stata aperta la vera vista di navigazione del core prima di interagire con righe e popup.

Stati aggiuntivi verificati in precedenza e ancora validi (nessuna regola interessata dalla conversione a tema): input disabilitato, invio in corso, azione predefinita in streaming, modalità shell, RTL (bordo/angolo logici), forced-colors. Vedi `additional-states.json`.

## File di evidenza

- `desktop-checks.json`, `responsive-checks.json`, `expanded-openspec-checks.json`, `additional-states.json`, `file-integrity.json`
- `before.png` — stessi dati con la sola palette ufficiale PI WEB Dark
- `desktop.png`, `tablet.png`, `mobile.png`, `small-mobile.png` — tema Dark Contrast
- `verification.md` — questo rapporto

## Limiti residui

- Le sessioni della fixture sono **sintetiche**: nessuna inferenza, allegato, shell o terminale eseguito nel collaudo grafico.
- Alcuni selettori del chrome core e dell'integrazione CodeMirror sono sperimentali: **ricollaudare dopo ogni aggiornamento** di Pi Web.
- La baseline ufficiale è una copia statica: se una futura versione aggiungesse nuovi token di palette, i plugin userebbero i valori di fallback finché la copia non viene riallineata.
- Non è stata eseguita una suite funzionale completa di OpenSpec; l'isolamento è verificato su aspetto e token, non su ogni comportamento.
- Nessuna trascrizione preesistente è stata letta o copiata.

## Pulizia

Chiusi solo i processi creati per la prova (anteprima, proxy, tunnel, profili Firefox temporanei, schede CDP). Il browser personale dell'utente non è stato chiuso. I servizi operativi non sono stati riavviati.
