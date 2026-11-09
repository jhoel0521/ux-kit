export const A = (p) => (<div>
  <img {...p} width={1} height={1} />
  <button {...p}><Icon /></button>
  <button><TrashIcon title="Delete" /></button>
  <input {...p} />
  <button aria-label="Close" className="h-5 w-5"><X /></button>
</div>);
