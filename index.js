import fetch from 'node-fetch';
import emailjs from 'emailjs-com';

const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const EMAILJS_SERVICE = process.env.EMAILJS_SERVICE;
const EMAILJS_TEMPLATE = process.env.EMAILJS_TEMPLATE;
const EMAILJS_USER = process.env.EMAILJS_USER;

console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_KEY:", SUPABASE_KEY?.substring(0, 10));

const fetchAllTools = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/formularze?select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      }
    });

    const data = await response.json();
    console.log("🔎 WSZYSTKIE DANE Z SUPABASE:", data);

    if (!Array.isArray(data)) {
      console.log("❌ BŁĄD: Supabase nie zwróciło tablicy");
      return [];
    }

    if (data.length === 0) {
      console.log("⚠️ Supabase działa, ale nie ma żadnych danych w tabeli `formularze`.");
    }

    return data;
  } catch (err) {
    console.error("❌ Błąd połączenia z Supabase:", err);
    return [];
  }
};

const main = async () => {
  const allData = await fetchAllTools();
  console.log(`📦 Liczba rekordów: ${allData.length}`);
};

main();

