// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BOTGasTracker
 * @notice On-chain gas analytics coordinator for BOT Chain Testnet.
 * Allows users to register contracts and block ranges for in-depth gas audits,
 * and enables authorized analyzers to publish verifiable report hashes.
 */
contract BOTGasTracker {
    struct GasRequest {
        bytes32 requestId;
        address requester;
        address target;
        uint256 fromBlock;
        uint256 toBlock;
        bytes32 reportHash;
        bool completed;
        uint256 requestedAt;
        uint256 completedAt;
    }

    address public owner;
    uint256 private nonce;

    // Mapping from requestId to GasRequest details
    mapping(bytes32 => GasRequest) public requests;
    bytes32[] public requestIds;

    // Authorized analyzer addresses permitted to publish analysis report hashes
    mapping(address => bool) public authorizedAnalyzers;

    // Events
    event GasAnalysisRequested(
        bytes32 indexed requestId,
        address indexed requester,
        address indexed target,
        uint256 fromBlock,
        uint256 toBlock,
        uint256 timestamp
    );

    event GasAnalysisPublished(
        bytes32 indexed requestId,
        bytes32 reportHash,
        address indexed analyzer,
        uint256 timestamp
    );

    event AnalyzerAuthorized(address indexed analyzer, bool status);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "BOTGasTracker: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedAnalyzers[msg.sender],
            "BOTGasTracker: caller is not an authorized analyzer"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAnalyzers[msg.sender] = true;
        emit AnalyzerAuthorized(msg.sender, true);
    }

    /**
     * @notice Authorize or revoke an analyzer address.
     */
    function setAnalyzer(address analyzer, bool status) external onlyOwner {
        require(analyzer != address(0), "BOTGasTracker: invalid analyzer address");
        authorizedAnalyzers[analyzer] = status;
        emit AnalyzerAuthorized(analyzer, status);
    }

    /**
     * @notice Transfer contract ownership.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "BOTGasTracker: zero address not allowed");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Submits a request for gas analysis on a target contract across a block range.
     * @param target Target contract address to inspect.
     * @param fromBlock Start block number.
     * @param toBlock End block number.
     * @return requestId Unique hash identifying this analysis request.
     */
    function requestGasAnalysis(
        address target,
        uint256 fromBlock,
        uint256 toBlock
    ) external returns (bytes32 requestId) {
        require(target != address(0), "BOTGasTracker: target cannot be zero address");
        require(toBlock >= fromBlock, "BOTGasTracker: toBlock must be >= fromBlock");

        nonce++;
        requestId = keccak256(
            abi.encodePacked(
                block.chainid,
                msg.sender,
                target,
                fromBlock,
                toBlock,
                block.timestamp,
                nonce
            )
        );

        requests[requestId] = GasRequest({
            requestId: requestId,
            requester: msg.sender,
            target: target,
            fromBlock: fromBlock,
            toBlock: toBlock,
            reportHash: bytes32(0),
            completed: false,
            requestedAt: block.timestamp,
            completedAt: 0
        });

        requestIds.push(requestId);

        emit GasAnalysisRequested(
            requestId,
            msg.sender,
            target,
            fromBlock,
            toBlock,
            block.timestamp
        );

        return requestId;
    }

    /**
     * @notice Retrieve details of a gas analysis request.
     * @param requestId The unique request hash.
     */
    function getRequest(bytes32 requestId) external view returns (GasRequest memory) {
        require(requests[requestId].requester != address(0), "BOTGasTracker: request not found");
        return requests[requestId];
    }

    /**
     * @notice Publish report result hash for an existing request.
     * Only authorized analyzers or owner can call.
     * @param requestId The request hash being fulfilled.
     * @param reportHash Cryptographic or IPFS hash of the completed gas report.
     */
    function publishResult(
        bytes32 requestId,
        bytes32 reportHash
    ) external onlyAuthorized {
        GasRequest storage req = requests[requestId];
        require(req.requester != address(0), "BOTGasTracker: request not found");
        require(!req.completed, "BOTGasTracker: request already completed");
        require(reportHash != bytes32(0), "BOTGasTracker: invalid report hash");

        req.reportHash = reportHash;
        req.completed = true;
        req.completedAt = block.timestamp;

        emit GasAnalysisPublished(requestId, reportHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Get total number of registered requests.
     */
    function getRequestCount() external view returns (uint256) {
        return requestIds.length;
    }

    /**
     * @notice Retrieve recent requests with pagination.
     */
    function getRecentRequests(uint256 offset, uint256 limit) external view returns (GasRequest[] memory) {
        uint256 total = requestIds.length;
        if (offset >= total) {
            return new GasRequest[](0);
        }

        uint256 count = limit;
        if (offset + limit > total) {
            count = total - offset;
        }

        GasRequest[] memory result = new GasRequest[](count);
        for (uint256 i = 0; i < count; i++) {
            // Newest first
            bytes32 reqId = requestIds[total - 1 - (offset + i)];
            result[i] = requests[reqId];
        }
        return result;
    }
}

