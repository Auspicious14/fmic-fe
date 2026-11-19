"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import styles from "./landing.module.css";

/**
 * Sign-up / log-in links. A trader who is already logged in on this phone
 * sees one button straight into their book instead.
 */
export function AuthLinks({ variant }: { variant: "header" | "hero" | "closing" }) {
  // Server render and first paint assume "logged out"; the browser value
  // takes over after hydration without a mismatch.
  const loggedIn = useSyncExternalStore(subscribe, readLoggedIn, () => false);

  if (loggedIn) {
    return (
      <div className={styles[`links_${variant}`]}>
        <Link href="/dashboard" className={styles.primaryButton}>
          Open your book
        </Link>
      </div>
    );
  }

  if (variant === "header") {
    return (
      <nav className={styles.links_header} aria-label="Account">
        <Link href="/login" className={styles.textLink}>
          Log in
        </Link>
        <Link href="/register" className={styles.smallButton}>
          Start free
        </Link>
      </nav>
    );
  }

  return (
    <div className={styles[`links_${variant}`]}>
      <Link href="/register" className={styles.primaryButton}>
        Start your debt book
      </Link>
      {variant === "hero" && (
        <Link href="/login" className={styles.secondaryButton}>
          Log in
        </Link>
      )}
    </div>
  );
}

function readLoggedIn(): boolean {
  try {
    const token = localStorage.getItem("fmic_token");
    return Boolean(token && token !== "undefined");
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
