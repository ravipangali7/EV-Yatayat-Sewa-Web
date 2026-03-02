import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, PlusCircle } from "lucide-react";
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
        allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setCardTransactions(allTx.slice(0, 20));
      } catch {
        setCards([]);
        setCardTransactions([]);
      }
    };
    run();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppBar title="My Card" />
      <div className="px-5 pt-4 space-y-5">
        {cards.length > 0 ? (
          <div className="space-y-4">
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {cards.map((card) => {
                const last4 = card.card_number.slice(-4);
                const masked = card.card_number.length > 4 ? "•••• •••• •••• " + last4 : card.card_number;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-primary via-primary/80 to-emerald-600 rounded-2xl p-5 min-w-[280px] snap-center text-primary-foreground shadow-xl shadow-primary/20 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <CreditCard size={26} className="opacity-90" />
                      <span className="text-xs font-semibold opacity-80 bg-white/20 px-2 py-1 rounded-lg">NFC</span>
                    </div>
                    <div className="mt-2">
                      <p className="font-mono text-sm tracking-[0.25em] opacity-90">{masked}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 mb-0.5">Balance</p>
                      <p className="text-2xl font-bold">Rs. {card.balance.toLocaleString()}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => navigate("/app/user/card/topup")}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-sm hover:bg-emerald-500/20 transition-colors"
            >
              <PlusCircle size={18} /> Topup Card
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-card/80 backdrop-blur-xl border border-border/50 p-10 text-center shadow-md">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <CreditCard size={28} className="text-muted-foreground" />
            </div>
            <p className="font-semibold mb-1">No cards linked</p>
            <p className="text-sm text-muted-foreground">Your NFC cards will appear here</p>
          </div>
        )}

        {(cards.length > 0 || cardTransactions.length > 0) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Card Transactions</p>
            <div className="space-y-2">
              {cardTransactions.map((t) => (
                <div key={t.id} className="bg-white dark:bg-card/80 rounded-xl p-3 border border-border/50">
                  <TransactionCard transaction={t} />
                </div>
              ))}
              {cardTransactions.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No card transactions yet</p>
              )}
            </div>
          </div>
        )}

        {cards.length === 0 && (
          <Button className="w-full h-12 rounded-xl" onClick={() => navigate("/app/user/card/topup")}>
            <PlusCircle size={18} className="mr-2" /> Topup Card by Number
          </Button>
        )}
      </div>
    </div>
  );
}
