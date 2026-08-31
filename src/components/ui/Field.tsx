import type { ReactNode } from 'react';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-semibold text-strong">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-strong/50 bg-bg px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition-colors focus:border-ac ${props.className ?? ''}`}
    />
  );
}

export function SubmitButton({ children, pending }: { children: ReactNode; pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-doc px-4 py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '…' : children}
    </button>
  );
}

export function Fehlermeldung({ text }: { text: string }) {
  return <p className="rounded-xl bg-red/10 px-3.5 py-2.5 text-[13.5px] text-red">{text}</p>;
}
