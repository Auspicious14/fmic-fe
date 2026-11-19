import Link from "next/link";
import styles from "./landing.module.css";
import { AuthLinks } from "./AuthLinks";

const STEPS = [
  {
    title: "Speak",
    body: "Hold the mic and say it the way you'd tell your apprentice: who bought what, and for how much.",
  },
  {
    title: "Check",
    body: "Ledga shows what it heard. Tap ✅ if it's right, or fix the name or price before it's saved.",
  },
  {
    title: "Send",
    body: "Your customer gets a receipt on WhatsApp, with a button to pay what they owe.",
  },
];

const ENTRIES = [
  {
    title: "Talks like you do",
    body: "Mix Pidgin, Yoruba and English in one sentence. Ledga still catches the name, the item and the amount.",
  },
  {
    title: "No more “I no owe you”",
    body: "Every credit sale gets a dated receipt on both phones, so the record settles the argument.",
  },
  {
    title: "Part payments add up",
    body: "When a customer pays half, just say so. Ledga takes it off and tells you what is left.",
  },
  {
    title: "Paid from the receipt",
    body: "Customers pay by card, transfer or USSD through Flutterwave, and their debt clears by itself.",
  },
  {
    title: "On WhatsApp too",
    body: "Link your number and send voice notes to Ledga in the chat app you already use all day.",
  },
];

/** Bars of the voice-note waveform (heights in px). */
const WAVE = [8, 14, 22, 12, 26, 18, 10, 24, 16, 28, 12, 20, 9, 17, 23, 11, 15, 7];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Ledga home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ledga-logo.svg" alt="Ledga" width={148} height={36} />
        </Link>
        <AuthLinks variant="header" />
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroText}>
          <h1 id="hero-title" className={styles.title}>
            Talk am.
            <br />
            Ledga go write am.
          </h1>
          <p className={styles.lede}>
            Record credit sales with a voice note in Pidgin, Yoruba or English.
            Ledga keeps your debt book and sends your customer a receipt they
            can pay from.
          </p>
          <AuthLinks variant="hero" />
          <p className={styles.note}>Free for traders. Works in your phone&apos;s browser.</p>
        </div>

        <figure className={styles.demo} aria-label="A voice note becoming a receipt">
          <div className={styles.voiceNote}>
            <span className={styles.play} aria-hidden="true" />
            <span className={styles.wave} aria-hidden="true">
              {WAVE.map((h, i) => (
                <span key={i} style={{ height: h, animationDelay: `${i * 70}ms` }} />
              ))}
            </span>
            <span className={styles.duration}>0:06</span>
          </div>

          <p className={styles.transcript}>
            “Mama Tunde collect two granite oil, she go pay Friday.”
          </p>

          <div className={styles.receipt}>
            <div className={styles.receiptHead}>
              <span className={styles.receiptShop}>Iya Bisi Provisions</span>
              <span className={styles.receiptTag}>Credit</span>
            </div>
            <p className={styles.receiptCustomer}>Mama Tunde</p>
            <dl className={styles.receiptLines}>
              <div>
                <dt>Granite oil × 2</dt>
                <dd>₦40,000</dd>
              </div>
              <div className={styles.receiptTotal}>
                <dt>She owes</dt>
                <dd>₦40,000</dd>
              </div>
            </dl>
            <span className={styles.payButton}>Pay ₦40,000 now</span>
          </div>
        </figure>
      </section>

      <section className={styles.steps} aria-labelledby="steps-title">
        <h2 id="steps-title" className={styles.sectionTitle}>
          How it works
        </h2>
        <ol className={styles.stepList}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {i + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.ledger} aria-labelledby="ledger-title">
        <h2 id="ledger-title" className={styles.sectionTitleDark}>
          Made for how you sell
        </h2>
        <ul className={styles.entries}>
          {ENTRIES.map((entry) => (
            <li key={entry.title} className={styles.entry}>
              <h3>{entry.title}</h3>
              <p>{entry.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <h2 id="closing-title" className={styles.closingTitle}>
          Your debt book, in your voice.
        </h2>
        <AuthLinks variant="closing" />
      </section>

      <footer className={styles.footer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ledga-logo-light.svg" alt="Ledga" width={110} height={27} />
        <p>© {new Date().getFullYear()} Ledga. Built in Lagos.</p>
      </footer>
    </div>
  );
}
