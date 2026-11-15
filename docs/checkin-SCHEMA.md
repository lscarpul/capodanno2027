# Porta Capodanno 2027 · database

App: https://claude.ai/artifact/XnPzCUTGCnjYQyiW6HjhKr (sorgente: `porta.html` in questa cartella)

## Dove stanno i dati adesso
Nel database integrato dell'artifact. Lo leggono e scrivono solo il proprietario e chi viene invitato come **Editor** dal menu Condividi (es. chi sta alla porta). Gli altri non vedono la lista.

## Collezioni

### `bookings/{code}` — una prenotazione (stesso formato che produce il sito)
| campo | tipo | esempio |
|---|---|---|
| code | string | `C27-7KQ4` (4 caratteri A-Z/2-9, senza 0/O/1/I) |
| createdAt | ISO string | `2026-11-15T02:40:00Z` |
| release | string | `Prima release` / `Seconda release` |
| unitPrice | number | 30 / 50 |
| amount | number | unitPrice × ospiti |
| causale | string | `CAPODANNO27 C27-7KQ4 Rossi` |
| status | `pending_payment` \| `paid` | |
| paidAt | ISO string \| null | quando l'organizzatore ha confermato |
| payer | { instagram, email?, trn? } | |
| guests | [{ ticketId, firstName, lastName }] | ticketId `C27-7KQ4-01` |

### `checkins/{ticketId}` — un ingresso
`{ ticketId, code, at (ISO), name }`. Esiste = QR già usato. "Annulla ingresso" lo cancella.

Il QR contiene solo il `ticketId`. La porta lo cerca nel DB: entra solo se la prenotazione è `paid` e non c'è già un check-in.

## Passare a un database esterno (quando serve)
Il sito oggi non può scrivere direttamente nel DB dell'artifact: le prenotazioni arrivano incollando il JSON ("Incolla dal sito") o a mano. Per automatizzare, la scelta più semplice è **Supabase** (gratis per questi numeri):

```sql
create table bookings (
  code text primary key,
  created_at timestamptz default now(),
  release text not null,
  unit_price int not null,
  amount int not null,
  causale text not null,
  status text not null default 'pending_payment' check (status in ('pending_payment','paid')),
  paid_at timestamptz,
  payer jsonb not null default '{}'
);
create table guests (
  ticket_id text primary key,
  code text references bookings(code) on delete cascade,
  first_name text not null,
  last_name text not null
);
create table checkins (
  ticket_id text primary key references guests(ticket_id),
  at timestamptz default now()
);
```
`checkins.ticket_id` come chiave primaria garantisce che lo stesso QR non entri due volte anche con due telefoni alla porta. Il sito fa POST su `bookings` + `guests`; nell'app basta sostituire `dbStore()` con le chiamate Supabase (stesse funzioni: getBooking, setBooking, getCheckin, setCheckin…).
