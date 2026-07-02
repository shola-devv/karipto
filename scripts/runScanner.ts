import "dotenv/config";
import { runDepositScan } from "../lib/wallet/deposits";

const INTERVAL_MS = 20_000;

async function loop() {
  try {
    const result = await runDepositScan();
    console.log(
      `[scanner] scanned ${result.scannedFrom}-${result.scannedTo}, chain head ${result.latest}`
    );
  } catch (err) {
    console.error("[scanner] error:", err);
  } finally {
    setTimeout(loop, INTERVAL_MS);
  }
}

loop();
