import { Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface WalletCardProps {
  balance: number;
  toReceive: number;
  toPay: number;
}

const WalletCard = ({ balance, toReceive, toPay }: WalletCardProps) => {
  return (
    <div className="gradient-wallet rounded-2xl p-5 text-primary-foreground">
      <div className="flex items-center gap-2 mb-4">
        <Wallet size={18} />
        <span className="text-sm font-medium opacity-90">Wallet Balance</span>
      </div>
      <p className="text-3xl font-bold mb-6">
        Rs. {balance.toLocaleString()}
      </p>
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <ArrowDownLeft size={14} />
          </div>
          <div>
            <p className="text-[10px] opacity-75">To Receive</p>
            <p className="text-sm font-semibold">Rs. {toReceive.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <ArrowUpRight size={14} />
          </div>
          <div>
            <p className="text-[10px] opacity-75">To Pay</p>
            <p className="text-sm font-semibold">Rs. {toPay.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
