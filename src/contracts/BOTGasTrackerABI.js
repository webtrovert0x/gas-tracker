export const BOT_GAS_TRACKER_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'analyzer', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'status', type: 'bool' },
    ],
    name: 'AnalyzerAuthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { indexed: false, internalType: 'bytes32', name: 'reportHash', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'analyzer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'GasAnalysisPublished',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'requester', type: 'address' },
      { indexed: true, internalType: 'address', name: 'target', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'fromBlock', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'toBlock', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'GasAnalysisRequested',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'authorizedAnalyzers',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'requestId', type: 'bytes32' }],
    name: 'getRequest',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
          { internalType: 'address', name: 'requester', type: 'address' },
          { internalType: 'address', name: 'target', type: 'address' },
          { internalType: 'uint256', name: 'fromBlock', type: 'uint256' },
          { internalType: 'uint256', name: 'toBlock', type: 'uint256' },
          { internalType: 'bytes32', name: 'reportHash', type: 'bytes32' },
          { internalType: 'bool', name: 'completed', type: 'bool' },
          { internalType: 'uint256', name: 'requestedAt', type: 'uint256' },
          { internalType: 'uint256', name: 'completedAt', type: 'uint256' },
        ],
        internalType: 'struct BOTGasTracker.GasRequest',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRequestCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getRecentRequests',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
          { internalType: 'address', name: 'requester', type: 'address' },
          { internalType: 'address', name: 'target', type: 'address' },
          { internalType: 'uint256', name: 'fromBlock', type: 'uint256' },
          { internalType: 'uint256', name: 'toBlock', type: 'uint256' },
          { internalType: 'bytes32', name: 'reportHash', type: 'bytes32' },
          { internalType: 'bool', name: 'completed', type: 'bool' },
          { internalType: 'uint256', name: 'requestedAt', type: 'uint256' },
          { internalType: 'uint256', name: 'completedAt', type: 'uint256' },
        ],
        internalType: 'struct BOTGasTracker.GasRequest[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'reportHash', type: 'bytes32' },
    ],
    name: 'publishResult',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'target', type: 'address' },
      { internalType: 'uint256', name: 'fromBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'toBlock', type: 'uint256' },
    ],
    name: 'requestGasAnalysis',
    outputs: [{ internalType: 'bytes32', name: 'requestId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'analyzer', type: 'address' },
      { internalType: 'bool', name: 'status', type: 'bool' },
    ],
    name: 'setAnalyzer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

