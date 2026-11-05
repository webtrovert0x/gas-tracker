import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { botChainTestnet } from '../src/config/botchain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function deploy() {
  console.log('==============================================');
  console.log('       BOTGasTracker Deployment Engine        ');
  console.log('==============================================');
  console.log('Target Network: BOT Chain Testnet (Chain ID 968)');
  console.log('RPC Endpoint:  ', process.env.RPC_URL || 'https://rpc.bohr.life');

  const rawKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : '';
  const cleanKey = rawKey.startsWith('0x') ? rawKey.slice(2) : rawKey;

  if (!cleanKey || cleanKey.length !== 64) {
    console.log('\n[INFO] PRIVATE_KEY is not configured or invalid in .env!');
    console.log('Please open .env and provide your 64-character private key:');
    console.log('----------------------------------------------------');
    console.log('PRIVATE_KEY=0xYourPrivateKeyHere');
    console.log('REOWN_ID=YourReownProjectIdHere');
    console.log('----------------------------------------------------');
    console.log('Then run "npm run deploy" to deploy BOTGasTracker.sol to BOT Chain Testnet.\n');
    process.exit(0);
  }

  const formattedKey = `0x${cleanKey}`;
  const account = privateKeyToAccount(formattedKey);
  console.log('Deployer Address:', account.address);

  const artifactPath = path.resolve(__dirname, '../artifacts/BOTGasTracker.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('\n[ERROR] Artifact not found! Run "npm run compile" first.\n');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const rpcUrl = process.env.RPC_URL || 'https://rpc.bohr.life';
  const publicClient = createPublicClient({
    chain: botChainTestnet,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: botChainTestnet,
    transport: http(rpcUrl),
  });

  console.log('\nChecking deployer BOT balance on BOT Chain Testnet...');
  const balance = await publicClient.getBalance({ address: account.address });
  const balanceBOT = Number(balance) / 1e18;
  console.log('Deployer Balance:', balanceBOT, 'BOT');

  if (balance === 0n) {
    console.warn('\n[WARNING] Deployer balance is 0 BOT! Deployment will likely fail without gas.');
    console.warn('Please fund your address with testnet BOT from the faucet before proceeding.');
  }

  console.log('\nBroadcasting deployment transaction for BOTGasTracker.sol...');
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  console.log('Deployment Transaction Hash:', hash);
  console.log('Waiting for block confirmation on BOT Chain Testnet...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('\n==============================================');
  console.log(' CONTRACT DEPLOYED SUCCESSFULLY!');
  console.log(' Contract Address:', receipt.contractAddress);
  console.log(' Block Number:    ', receipt.blockNumber.toString());
  console.log(' Gas Consumed:    ', receipt.gasUsed.toString());
  console.log(' Explorer URL:     https://scan.bohr.life/address/' + receipt.contractAddress);
  console.log('==============================================\n');

  // Update .env with deployed address
  const envPath = path.resolve(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('BOT_GAS_TRACKER_ADDRESS=')) {
    envContent = envContent.replace(/BOT_GAS_TRACKER_ADDRESS=.*/, `BOT_GAS_TRACKER_ADDRESS=${receipt.contractAddress}`);
  } else {
    envContent += `\nBOT_GAS_TRACKER_ADDRESS=${receipt.contractAddress}\n`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log('Updated .env with BOT_GAS_TRACKER_ADDRESS=' + receipt.contractAddress);
}

deploy().catch((err) => {
  console.error('\nDeployment failed:', err.message || err);
  process.exit(1);
});
