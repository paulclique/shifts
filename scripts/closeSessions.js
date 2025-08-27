import fetch from "node-fetch";
import { DateTime } from "luxon";
import dotenv from "dotenv";
dotenv.config();

const API_URL = process.env.API_URL;

// Récupère toutes les sessions actives
async function getActiveSessions() {
  const query = `
    query {
  sessions(
    pagination: { start: 0, limit: -1 }
    filters: { end: { null: true } }
  ) {
    data {
      id
    }
  }
}
  `;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  return data.data.sessions.data;
}

// Calcule minuit heure de Paris du jour courant
function getParisMidnightISO() {
  const midnightParis = DateTime.now()
    .setZone("Europe/Paris")
    .startOf("day"); // 00:00:00 Europe/Paris
  return midnightParis.toUTC().toISO(); // conversion en UTC pour la DB
}

// Clôture une session
async function closeSession(sessionId) {
  const mutation = `
    mutation CloseSession($id: ID!, $end: DateTime!) {
      updateSession(id: $id, data: { end: $end }) {
        data {
          id
          attributes {
            end
          }
        }
      }
    }
  `;

  const variables = {
    id: sessionId,
    end: getParisMidnightISO(),
  };

  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: mutation, variables }),
  });
}

// Fonction principale
async function closeAllActiveSessions() {
  const sessions = await getActiveSessions();
  console.log(`📌 ${sessions.length} sessions actives à clore...`);

  for (const s of sessions) {
    await closeSession(s.id);
    console.log(`✅ Session ${s.id} clôturée à 00h00 Europe/Paris.`);
  }
}

closeAllActiveSessions().catch(console.error);
