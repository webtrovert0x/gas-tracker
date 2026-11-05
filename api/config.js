export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  // Allow client to fetch server-side configuration safely
  res.status(200).json({
    reownId: process.env.REOWN_ID || '',
    rpcUrl: process.env.RPC_URL || 'https://rpc.bohr.life',
    chainId: Number(process.env.CHAIN_ID) || 968,
    contractAddress: process.env.BOT_GAS_TRACKER_ADDRESS || '0x85d1352195c58b1c9583156a7f5d3140f4a70d56',
  });
}

