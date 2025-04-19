import fetch from 'node-fetch';
import emailjs from 'emailjs-com';

// Debug – sprawdź, czy Render widzi klucz
const SUPABASE_KEY = process.env.SUPABASE_KEY;
console.log("SUPABASE_KEY:", SUPABASE_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL;
const EMAILJS_SERVICE = process.env.EMAILJS_SERVICE;
const EMAILJS_TEMPLATE = process.env.EMAILJS_TEMPLATE;
const EMAILJS_USER = process.env.EMAILJS_USER;

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

  const today = new Date();

  return data.filter(item => {
    if (!item.Data) return false;
    const [day, month, year] = item.Data.split('-');
    const toolDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const diffTime = toolDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays === 90;
  });
};

const sendEmails = async (tools) => {
  for (const tool of tools) {
    const templateParams1 = {
      to_email: tool["Email Technik 1"],
      to_email_2: tool["Email Technik 2"],
      message: `Hej (6434), twoje ${tool.Nazwa} ${tool.VT} wychodzi z daty za 90 dni. Stockkeeper poinformowany.`
    };

    const templateParams2 = {
      to_email: tool["Email Stockkeeper"],
      message: `Hej tu van (6434), nasz ${tool.Nazwa} ${tool.VT} wychodzi z daty za 90 dni. Zamów nam nowe narzędzie. Dziękujemy.`
    };

    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams1, EMAILJS_USER);
    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams2, EMAILJS_USER);
  }
};

const main = async () => {
  const toolsToNotify = await fetchExpiringTools();
  if (toolsToNotify.length > 0) {
    await sendEmails(toolsToNotify);
    console.log("📧 Maile wysłane.");
  } else {
    console.log("✅ Brak narzędzi do przypomnienia.");
  }
};

main();


