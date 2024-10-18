export const ASXcoreABI = [
    {
        inputs: [
            { name: "name", internalType: "string", type: "string" },
            { name: "symbol", internalType: "string", type: "string" }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    {
        inputs: [
            { indexed: true, name: "owner", internalType: "address", type: "address" },
            { indexed: true, name: "spender", internalType: "address", type: "address" },
            { indexed: false, name: "value", internalType: "uint256", type: "uint256" }
        ],
        name: "Approval",
        anonymous: false,
        type: "event"
    },
    {
        inputs: [{ indexed: false, name: "account", internalType: "address", type: "address" }],
        name: "Paused",
        anonymous: false,
        type: "event"
    },
    {
        inputs: [
            { indexed: true, name: "role", internalType: "bytes32", type: "bytes32" },
            { indexed: true, name: "previousAdminRole", internalType: "bytes32", type: "bytes32" },
            { indexed: true, name: "newAdminRole", internalType: "bytes32", type: "bytes32" }
        ],
        name: "RoleAdminChanged",
        anonymous: false,
        type: "event"
    },
    {
        inputs: [
            { indexed: true, name: "role", internalType: "bytes32", type: "bytes32" },
            { indexed: true, name: "account", internalType: "address", type: "address" },
            { indexed: true, name: "sender", internalType: "address", type: "address" }
        ],
        name: "RoleGranted",
        anonymous: false,
        type: "event"
    },
    {
        inputs: [
            { indexed: true, name: "role", internalType: "bytes32", type: "bytes32" },
            { indexed: true, name: "account", internalType: "address", type: "address" },
            { indexed: true, name: "sender", internalType: "address", type: "address" }
        ],
        name: "RoleRevoked",
        anonymous: false,
        type: "event"
    },
    {
        inputs: [
            { indexed: true, name: "from", internalType: "address", type: "address" },
            { indexed: true, name: "to", internalType: "address", type: "address" },
            { indexed: false, name: "value", internalType: "uint256", type: "uint256" }
        ],
        name: "Transfer",
        anonymous: false,
        type: "event"
    },
    {
        inputs: [{ indexed: false, name: "account", internalType: "address", type: "address" }],
        name: "Unpaused",
        anonymous: false,
        type: "event"
    },
    {
        outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
        inputs: [],
        name: "DEFAULT_ADMIN_ROLE",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
        inputs: [],
        name: "MINTER_ROLE",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
        inputs: [],
        name: "PAUSER_ROLE",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        inputs: [
            { name: "owner", internalType: "address", type: "address" },
            { name: "spender", internalType: "address", type: "address" }
        ],
        name: "allowance",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        inputs: [
            { name: "spender", internalType: "address", type: "address" },
            { name: "amount", internalType: "uint256", type: "uint256" }
        ],
        name: "approve",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        inputs: [{ name: "account", internalType: "address", type: "address" }],
        name: "balanceOf",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [],
        inputs: [{ name: "amount", internalType: "uint256", type: "uint256" }],
        name: "burn",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [],
        inputs: [
            { name: "account", internalType: "address", type: "address" },
            { name: "amount", internalType: "uint256", type: "uint256" }
        ],
        name: "burnFrom",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "uint8", type: "uint8" }],
        inputs: [],
        name: "decimals",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        inputs: [
            { name: "spender", internalType: "address", type: "address" },
            { name: "subtractedValue", internalType: "uint256", type: "uint256" }
        ],
        name: "decreaseAllowance",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
        inputs: [{ name: "role", internalType: "bytes32", type: "bytes32" }],
        name: "getRoleAdmin",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "address", type: "address" }],
        inputs: [
            { name: "role", internalType: "bytes32", type: "bytes32" },
            { name: "index", internalType: "uint256", type: "uint256" }
        ],
        name: "getRoleMember",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        inputs: [{ name: "role", internalType: "bytes32", type: "bytes32" }],
        name: "getRoleMemberCount",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [],
        inputs: [
            { name: "role", internalType: "bytes32", type: "bytes32" },
            { name: "account", internalType: "address", type: "address" }
        ],
        name: "grantRole",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        inputs: [
            { name: "role", internalType: "bytes32", type: "bytes32" },
            { name: "account", internalType: "address", type: "address" }
        ],
        name: "hasRole",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        inputs: [
            { name: "spender", internalType: "address", type: "address" },
            { name: "addedValue", internalType: "uint256", type: "uint256" }
        ],
        name: "increaseAllowance",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [],
        inputs: [
            { name: "to", internalType: "address", type: "address" },
            { name: "amount", internalType: "uint256", type: "uint256" }
        ],
        name: "mint",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "string", type: "string" }],
        inputs: [],
        name: "name",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [],
        inputs: [],
        name: "pause",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        inputs: [],
        name: "paused",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [],
        inputs: [
            { name: "role", internalType: "bytes32", type: "bytes32" },
            { name: "account", internalType: "address", type: "address" }
        ],
        name: "renounceRole",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [],
        inputs: [
            { name: "role", internalType: "bytes32", type: "bytes32" },
            { name: "account", internalType: "address", type: "address" }
        ],
        name: "revokeRole",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
        name: "supportsInterface",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "string", type: "string" }],
        inputs: [],
        name: "symbol",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        inputs: [],
        name: "totalSupply",
        stateMutability: "view",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        inputs: [
            { name: "to", internalType: "address", type: "address" },
            { name: "amount", internalType: "uint256", type: "uint256" }
        ],
        name: "transfer",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        inputs: [
            { name: "from", internalType: "address", type: "address" },
            { name: "to", internalType: "address", type: "address" },
            { name: "amount", internalType: "uint256", type: "uint256" }
        ],
        name: "transferFrom",
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        outputs: [],
        inputs: [],
        name: "unpause",
        stateMutability: "nonpayable",
        type: "function"
    }
] as const;
