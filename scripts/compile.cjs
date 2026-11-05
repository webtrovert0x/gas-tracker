const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compile() {
  const contractPath = path.resolve(__dirname, '../contracts/BOTGasTracker.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'BOTGasTracker.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  console.log('Compiling BOTGasTracker.sol...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    output.errors.forEach((err) => {
      console.log(err.formattedMessage);
      if (err.severity === 'error') hasError = true;
    });
    if (hasError) {
      process.exit(1);
    }
  }

  const contract = output.contracts['BOTGasTracker.sol']['BOTGasTracker'];
  const artifactsDir = path.resolve(__dirname, '../artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const artifactData = {
    contractName: 'BOTGasTracker',
    abi: contract.abi,
    bytecode: '0x' + contract.evm.bytecode.object,
  };

  fs.writeFileSync(
    path.join(artifactsDir, 'BOTGasTracker.json'),
    JSON.stringify(artifactData, null, 2)
  );

  console.log('Compilation successful! Artifact saved to artifacts/BOTGasTracker.json');
}

compile();

