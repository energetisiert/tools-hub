import { redirect } from 'next/navigation';

export default function Home() {
  // Der Hub prueft selbst Session + Freischaltungsstatus und leitet
  // Nicht-Angemeldete zu /login weiter.
  redirect('/hub');
}
