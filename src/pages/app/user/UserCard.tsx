import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cardApi } from "@/modules/cards/services/cardApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import TransactionCard from "@/components/app/TransactionCard";
import AppBar from "@/components/app/AppBar";

export default function UserCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Array<{ id: string; card_number: string; balance: number }>>([]);
  const [cardTransactions, setCardTransactions] = useState<AppTransaction[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const run = async () => {
      try {
        const cardsRes = await cardApi.list({ user: user.id, per_page: 20 });
        setCards(cardsRes.results.map((c) => ({ id: c.id, card_number: c.card_number, balance: toNumber(c.balance, 0) })));
        const allTx: AppTransaction[] = [];
        for (const card of cardsRes.results) {
          const txRes = await transactionApi.list({ card: card.id, per_page: 10 });
          allTx.push(...txRes.results.map(transactionToAppTransaction));
        }
        allTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setCardTransactions(allTx.slice(0, 20));
      } catch {
        setCards([]);
        setCardTransactions([]);
      }
    };
    run();
  }, [user?.id]);

  return (
    <div className="min-h-screen pb-24">
      <AppBar title="My Card" />
      <div className="px-5 pt-4">
        <h2 className="text-lg font-bold mb-4">My Card</h2>
        {cards.length > 0 ? (
          <div className="space-y-4">
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="gradient-primary rounded-2xl p-5 min-w-[280px] snap-center text-primary-foreground shadow-lg"
                >
                  <CreditCard size={24} className="mb-4 opacity-80" />
                  <p className="text-sm opacity-80">Card number</p>
                  <p className="font-mono text-lg font-bold tracking-wider">{card.card_number}</p>
                  <p className="mt-4 text-sm opacity-80">Balance</p>
                  <p className="text-xl font-bold">Rs. {card.balance.toLocaleString()}</p>
                </motion.div>
              ))}
            </div>
            <Button
              className="w-full h-12 rounded-xl font-semibold"
              onClick={() => navigate("/app/user/card/topup")}
            >
              <Plus size={18} className="mr-2" /> Topup
            </Button>
          </div>
        ) : (
          <div className="app-surface rounded-2xl p-8 border border-border text-center">
            <CreditCard size={48} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No cards linked yet</p>
          </div>
        )}
        <div className="mt-6">
          <h3 className="font-bold text-sm mb-3">Card transaction history</h3>
          <div className="space-y-2">
            {cardTransactions.map((t) => (
              <TransactionCard key={t.id} transaction={t} />
            ))}
            {cardTransactions.length === 0 && cards.length > 0 && (
              <p className="text-sm text-muted-foreground py-4">No card transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
