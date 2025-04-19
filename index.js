import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const today = new Date();
today.setHours(0, 0, 0, 0);
const targetDate = new Date(today);
targetDate.setDate(today.getDate() + 90);
const targetDateStr = targetDate.toLocaleDateString('pl-PL').split('.').join('-').slice(0, 8);

const { data, error } = await supabase.from('formularze').select('*').eq('mailed', false);
if (error) {
  console.error('❌ Błąd pobierania danych z Supabase:', error);
  process.exit(1);
}

const matching = data.filter(item => item.date === targetDateStr);

if (matching.length === 0) {
  console.log('ℹ️ Brak narzędzi do przypomnienia.');
  process.exit(0);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

for (const tool of matching) {
  const techEmails = [tool.tech1, tool.tech2].filter(Boolean).join(',');
  const messageTech = {
    from: process.env.EMAIL_USER,
    to: techEmails,
    subject: 'Przypomnienie – narzędzie wygasa',
    text: `Hej (${tool.category}), twoje ${tool.name} ${tool.vt} wychodzi z daty za 90 dni. Stockkeeper poinformowany.`,
  };

  const messageStock = {
    from: process.env.EMAIL_USER,
    to: tool.stockkeeper,
    subject: 'Stock – narzędzie do zamówienia',
    text: `Hej tu van (${tool.category}), nasz ${tool.name} ${tool.vt} wychodzi z daty za 90 dni. Zamów nam nowe narzędzie. Dziękujemy.`,
  };

  try {
    await transporter.sendMail(messageTech);
    await transporter.sendMail(messageStock);
    await supabase.from('formularze').update({ mailed: true }).eq('id', tool.id);
    console.log('📧 Maile wysłane dla:', tool.name);
  } catch (err) {
    console.error('❌ Błąd wysyłki dla:', tool.name, err);
  }
}