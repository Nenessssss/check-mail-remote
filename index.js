import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

function formatDate(date) {
  const [day, month, year] = date.split('-');
  return new Date(`20${year}`, month - 1, day);
}

function isDateInNDays(targetDate, n) {
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + n);

  return (
    targetDate.getDate() === future.getDate() &&
    targetDate.getMonth() === future.getMonth() &&
    targetDate.getFullYear() === future.getFullYear()
  );
}

async function sendEmails(form) {
  const { name, vt, tech1, tech2, stockkeeper, category } = form;

  const subject = '🔧 Narzędzie wychodzi z daty';
  const messageToTechs = `Hej (${category}), twoje (${name} + ${vt}) wychodzi z daty za 90 dni. Stockkeeper poinformowany.`;
  const messageToStock = `Hej tu van (${category}), nasz (${name} + ${vt}) wychodzi z daty za 90 dni. Zamów nam nowe narzędzie. Dziękujemy.`;

  const mails = [];

  if (tech1) {
    mails.push(transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: tech1,
      subject,
      text: messageToTechs
    }));
  }

  if (tech2) {
    mails.push(transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: tech2,
      subject,
      text: messageToTechs
    }));
  }

  if (stockkeeper) {
    mails.push(transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: stockkeeper,
      subject,
      text: messageToStock
    }));
  }

  await Promise.all(mails);
  console.log(`📧 Maile wysłane dla: ${name}`);
}

async function main() {
  const { data, error } = await supabase.from('formularze').select('*');
  if (error) {
    console.error('❌ Błąd pobierania:', error);
    return;
  }

  const itemsToSend = data.filter(row => {
    if (!row.date || row.mailed) return false;

    const parsedDate = formatDate(row.date);
    return isDateInNDays(parsedDate, 90);
  });

  for (const item of itemsToSend) {
    try {
      await sendEmails(item);
      await supabase
        .from('formularze')
        .update({ mailed: true })
        .eq('id', item.id);
    } catch (e) {
      console.error(`❌ Błąd wysyłki maila dla ${item.name}`, e.message);
    }
  }

  if (itemsToSend.length === 0) {
    console.log('✅ Brak narzędzi do przypomnienia.');
  }
}

main();
