export function Producto() {
  return (
    <div className="p-4">
      <button className="h-5 w-5 outline-none" onClick={del}><TrashIcon /></button>
      <Button size="icon" onClick={edit}><PencilIcon /></Button>
      <div onClick={() => open()} className="card text-[11px] bg-[#3a3a3a] mt-[7px]">Abrir</div>
      <input type="email" id="email" />
      <input type="checkbox" name="newsletter" defaultChecked />
      <img src="/a.png" alt="" width={10} height={10} />
      <button className="h-9 px-3 focus-visible:ring-2">Ok</button>
    </div>
  );
}
