export function Clean({ onDelete }) {
  return (
    <main>
      <button aria-label="Delete" className="min-h-11 min-w-11 focus-visible:ring-2" onClick={onDelete}><TrashIcon /></button>
      <button aria-label="Close" className="h-5 w-5 min-h-[44px] min-w-[44px]"><X /></button>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" autoComplete="email" />
      <img src="/a.png" alt="Logo" width={10} height={10} />
    </main>
  );
}
