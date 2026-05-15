import { Link, useOutletContext } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAppStore } from "../../store/useAppStore";
import { formatMoney } from "../../utils/format";

export const PublicCartPage = () => {
  const { basePath } = useOutletContext() || {};
  const cart = useAppStore((state) => state.cart);
  const update = useAppStore((state) => state.updateCartItem);
  const remove = useAppStore((state) => state.removeCartItem);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <Card className="p-5"><h1 className="text-4xl font-black">Panier</h1><div className="mt-6 space-y-3">{cart.map((item) => <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-white p-3"><img src={item.image} className="h-20 w-20 rounded-2xl object-cover" /><div className="flex-1"><strong>{item.name}</strong><p className="text-sm text-elegant">{formatMoney(item.price)}</p></div><button onClick={() => update(item.id, { qty: Math.max(1, item.qty - 1) })}><Minus size={16} /></button><strong>{item.qty}</strong><button onClick={() => update(item.id, { qty: item.qty + 1 })}><Plus size={16} /></button><button onClick={() => remove(item.id)} className="text-danger"><Trash2 size={16} /></button></div>)}</div></Card>
      <Card className="h-max p-5"><h2 className="text-xl font-black">Resume</h2><div className="mt-5 flex justify-between"><span>Total</span><strong>{formatMoney(total * 1.1)}</strong></div><Link to={`${basePath || ""}/checkout`}><Button className="mt-5 w-full">Checkout</Button></Link></Card>
    </main>
  );
};
