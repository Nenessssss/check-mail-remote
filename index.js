import fetch from 'node-fetch';

// Klucze z Render → ustawione w "Environment"
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const EMAILJS_SERVICE = process.env.EMAILJS_SERVICE;
const EMAILJS_TEMPLATE = process.env.EMAILJS_TEMPLATE;
const EMAILJS_USER = process.env.EMAILJS_USER;

// TEST: wypisz URL i KEY skrócone
console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_KEY (first 10 chars):", SUPABASE_KEY?.slice(0, 10));

// ✅ Funkcja wysyłająca e-mail przez EmailJS API
const sendEmail = async (templateParams) => {
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE,
        template_id: EMAILJS_TEMPLATE,
        user_id: EMAILJS_USER,
        template_params: templateParams
      })
    });

    const result = await response.text();
    console.log("✅ Wysłano e-mail:", result);
  } catch (error) {
    console.error("❌ Błąd przy wysyłce e-maila:", error);
  }
};

// 📥 Pobierz dane z Supabase z tabeli `formularze`
const fetchExpiringTools = async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/formularze?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    }
  });

  const data = await response.json();
  console.log("ODEBRANE DANE:", data);

  const today = new Date();
  const toolsToNotify = data.filter(item => {
    if (!item.date) return false;
    const [day, month, year] = item.date.split('-');
    const toolDate = new Date(`${year}-${month}-${day}`);
    const diffTime = toolDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 90;
  });

  return toolsToNotify;
};

// 📧 Wyślij e-maile do Techników i Stockkeepera
const sendEmails = async (tools) => {
  for (const tool of tools) {
    const category = tool.category || "6434";

    const templateParams1 = {
      to_email: tool.tech1,
      to_email_2: tool.tech2,
      message: `Hej (${category}), twoje ${tool.name} ${tool.vt} wychodzi z daty za 90 dni. Stockkeeper poinformowany.`
    };

    const templateParams2 = {
      to_email: tool.stockkeeper,
      message: `Hej tu van (${category}), nasz ${tool.name} ${tool.vt} wychodzi z daty za 90 dni. Zamów nam nowe narzędzie. Dziękujemy.`
    };

    await sendEmail(templateParams1);
    await sendEmail(templateParams2);
  }
};

// 🧠 Główna funkcja
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


