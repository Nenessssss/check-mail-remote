import fetch from 'node-fetch';
import emailjs from 'emailjs-com';

// Środowiskowe zmienne
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const EMAILJS_SERVICE = process.env.EMAILJS_SERVICE;
const EMAILJS_TEMPLATE = process.env.EMAILJS_TEMPLATE;
const EMAILJS_USER = process.env.EMAILJS_USER;

// TESTOWO – pokaż w logach
console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_KEY (first 10 chars):", SUPABASE_KEY?.substring(0, 10));

const fetchExpiringTools = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/formularze?select=*`, {
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

    const today = new Date();
    const result = data.filter(item => {
      if (item.category !== '6434') return false;
      if (!item.date) return false;

      const [day, month, year] = item.date.split('-');
      if (!day || !month || !year) return false;

      const toolDate = new Date(`${year}-${month}-${day}`);
      const diffTime = toolDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays === 90;
    });

    return result;
  } catch (error) {
    console.error("❌ Błąd pobierania danych:", error);
    return [];
  }
};

const sendEmails = async (tools) => {
  for (const tool of tools) {
    const templateParams1 = {
      to_email: tool["Email Technik 1"],
      to_email_2: tool["Email Technik 2"],
      message: `Hej (6434), twoje ${tool.name} ${tool.vt} wychodzi z daty za 90 dni. Stockkeeper poinformowany.`
    };

    const templateParams2 = {
      to_email: tool["Email Stockkeeper"],
      message: `Hej tu van (6434), nasz ${tool.name} ${tool.vt} wychodzi z daty za 90 dni. Zamów nam nowe narzędzie. Dziękujemy.`
    };

    try {
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams1, EMAILJS_USER);
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams2, EMAILJS_USER);
      console.log(`📧 Wysłano e-maile dla narzędzia: ${tool.name}`);
    } catch (error) {
      console.error(`❌ Błąd wysyłki e-maili dla: ${tool.name}`, error);
    }
  }
};

const main = async () => {
  const toolsToNotify = await fetchExpiringTools();
  if (toolsToNotify.length > 0) {
    await sendEmails(toolsToNotify);
  } else {
    console.log("✅ Brak narzędzi do przypomnienia.");
  }
};

main();


