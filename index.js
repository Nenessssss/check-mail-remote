import fetch from 'node-fetch';
import emailjs from 'emailjs-com';

const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const EMAILJS_SERVICE = process.env.EMAILJS_SERVICE;
const EMAILJS_TEMPLATE = process.env.EMAILJS_TEMPLATE;
const EMAILJS_USER = process.env.EMAILJS_USER;

console.log("SUPABASE_KEY:", SUPABASE_KEY);
console.log("SUPABASE_URL:", SUPABASE_URL);

const fetchExpiringTools = async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/6434?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    }
  });

  const data = await response.json();
  console.log("ODEBRANE DANE:", data);

  if (!Array.isArray(data)) {
    console.log("❌ BŁĄD: Odpowiedź z Supabase nie jest tablicą");
    return [];
  }

  // 🔍 Nie filtrujemy dat – testujemy wszystko
  return data;
};

const sendEmails = async (tools) => {
  for (const tool of tools) {
    const templateParams1 = {
      to_email: tool["Email Technik 1"],
      to_email_2: tool["Email Technik 2"],
      message: `🔍 TEST: Narzędzie ${tool.Nazwa} ${tool.VT} z datą ${tool.Data}. Stockkeeper poinformowany.`
    };

    const templateParams2 = {
      to_email: tool["Email Stockkeeper"],
      message: `🔍 TEST: Stockkeeper – narzędzie ${tool.Nazwa} ${tool.VT} z datą ${tool.Data}.`
    };

    console.log("📤 Wysyłanie maili dla:", tool.Nazwa);
    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams1, EMAILJS_USER);
    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams2, EMAILJS_USER);
  }
};

const main = async () => {
  const toolsToNotify = await fetchExpiringTools();

  if (toolsToNotify.length > 0) {
    await sendEmails(toolsToNotify);
    console.log("📧 Maile TESTOWE wysłane.");
  } else {
    console.log("❌ Brak danych nawet w trybie testowym.");
  }
};

main();

