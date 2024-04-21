import React, { useState, useEffect } from "react";
import { Container, ListGroup } from "react-bootstrap";
import Image from "next/image";

const rpcUrls = [
  {
    url: "https://bsc.rpc.blxrbdn.com",
    name: "Bloxroute",
    link: "https://docs.bloxroute.com/introduction/protect-rpcs",
  },
  {
    url: "https://bnb-bscnews.rpc.blxrbdn.com/",
    name: "Bloxroute x BSCN",
    link: "https://docs.bloxroute.com/introduction/protect-rpcs",
  },
  {
    url: "https://bsc.meowrpc.com",
    name: "Meow RPC",
    link: "https://meowrpc.com/",
  },
  {
    url: "https://bsc.blockpi.network/v1/rpc/public",
    name: "Blockpi",
    link: "https://blockpi.io/",
  },
  {
    url: "https://practical-methodical-gadget.bsc.quiknode.pro/",
    name: "ASX RPC (via Merkle - rate limited)",
    link: "https://merkle.network/",
  },
];

const addNetworkToMetaMask = async (rpcUrl, name) => {
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x38", // BSC network chainId is 56 in decimal
          chainName: name,
          nativeCurrency: {
            name: "BNB",
            symbol: "BNB",
            decimals: 18,
          },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: ["https://bscscan.com"],
        },
      ],
    });
  } catch (error) {
    console.error("Error adding network to MetaMask:", error);
  }
};

const checkRpcSpeed = async (url) => {
  const requestBody = {
    jsonrpc: "2.0",
    method: "eth_blockNumber",
    params: [],
    id: 1,
  };

  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    if (data.result) {
      const end = performance.now();
      return Math.round(end - start); // Round to nearest integer
    }
    return "No response";
  } catch (error) {
    return "Error";
  }
};

const RpcPingTest = () => {
  const [speeds, setSpeeds] = useState({});

  useEffect(() => {
    const testRpcSpeeds = async () => {
      const results = {};
      for (const rpc of rpcUrls) {
        const speed = await checkRpcSpeed(rpc.url);
        results[rpc.url] = speed;
      }
      setSpeeds(results);
    };

    testRpcSpeeds();
  }, []);

  const getLedColor = (speed) => {
    if (speed === "Error" || speed === "No response") {
      return "grey";
    } else if (speed < 200) {
      return "green";
    } else if (speed >= 200 && speed < 800) {
      return "orange";
    } else {
      return "red";
    }
  };

  return (
    <Container>
      <ListGroup className="mt-1">
        {rpcUrls.map((rpc) => (
          <ListGroup.Item
            key={rpc.url}
            style={{
              fontSize: ".8rem",
              fontWeight: "regular",
              display: "flex",
              alignItems: "center",
              background: "rgba(1, 1, 1, 0.1)",
              color: "white",
              cursor: "pointer",
              transition: "transform 0.3s ease-in-out",
            }}
            onClick={() => addNetworkToMetaMask(rpc.url, rpc.name)}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.01)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Image
              src="/logos/metamask.webp"
              alt="MetaMask logo"
              width={24}
              height={24}
              style={{ marginRight: "10px" }}
            />
            <strong style={{ marginRight: "5px" }}>
              <a
                href={rpc.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {rpc.name}
              </a>
            </strong>
            <span style={{ marginLeft: "auto", marginRight: "10px" }}>
              {speeds[rpc.url]} ms
            </span>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: getLedColor(speeds[rpc.url]),
                marginRight: "10px",
              }}
            ></div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Container>
  );
};

export default RpcPingTest;
