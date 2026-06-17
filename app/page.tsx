import { Breadtzel } from "@/components/Breadtzel";
import { CONFIG } from "@/lib/config";

export default function Home() {
  return (
    <Breadtzel
      payment={{
        receivingAddress: CONFIG.receivingAddress ?? null,
        tokenSymbol: CONFIG.tokenSymbol,
        tokenAddress: CONFIG.breadTokenAddress,
        chainName: CONFIG.chainName,
      }}
    />
  );
}
