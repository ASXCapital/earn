import React, { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ASXStakingABI } from "../abis/ASXStakingABI";
import styles from "../styles/StakingPage.module.css";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";

const GetRewardButton = ({ stakingContractAddress, onUpdate, poolChainId }) => {
  const [statusMessage, setStatusMessage] = useState("Claim");
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | "">("");
  const [transactionInitiated, setTransactionInitiated] = useState(false);
  const addRecentTransaction = useAddRecentTransaction();
  const { writeContractAsync } = useWriteContract();

  // State for network checking
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [flashRed, setFlashRed] = useState(false);

  // Function to convert decimal to hex string with '0x' prefix
  const toHexString = (num) => "0x" + num.toString(16);

  // Fetch current chain ID using window.ethereum
  useEffect(() => {
    const getChainId = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const chainIdHex = await window.ethereum.request({
            method: "eth_chainId",
          });
          const chainId = parseInt(chainIdHex, 16);
          setCurrentChainId(chainId);
        } catch (error) {
          console.error("Error getting chain ID:", error);
        }
      }
    };

    getChainId();

    // Listen for chain changes
    if (typeof window !== "undefined" && window.ethereum) {
      const handleChainChanged = (chainIdHex) => {
        const chainId = parseInt(chainIdHex, 16);
        setCurrentChainId(chainId);
      };

      window.ethereum.on("chainChanged", handleChainChanged);

      // Cleanup on unmount
      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // Handle transaction status updates
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: transactionHash || undefined,
  });

  useEffect(() => {
    if (transactionInitiated && transactionHash) {
      if (isSuccess) {
        setStatusMessage("Success");
        setTimeout(() => {
          setStatusMessage("Claim");
          setTransactionInitiated(false);
        }, 3000);
        onUpdate();
      } else if (isError) {
        setStatusMessage("Error");
        setTimeout(() => {
          setStatusMessage("Claim");
          setTransactionInitiated(false);
        }, 5000);
      }
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate]);

  // Update statusMessage based on network
  useEffect(() => {
    if (currentChainId !== poolChainId) {
      setStatusMessage("Check network");
    } else {
      setStatusMessage("Claim");
    }
  }, [currentChainId, poolChainId]);

  // Update isButtonDisabled based on loading state and network
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    const isDisabled = isLoading || currentChainId !== poolChainId;
    setIsButtonDisabled(isDisabled);
  }, [isLoading, currentChainId, poolChainId]);

  const handleAction = async () => {
    if (isLoading) return;

    // Check if user is on the correct network
    if (currentChainId !== poolChainId) {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: toHexString(poolChainId) }],
          });
          // Network switch successful
          setCurrentChainId(poolChainId);
          return;
        } catch (switchError) {
          console.error("Error switching network:", switchError);
          // Flash the button red
          setFlashRed(true);
          setTimeout(() => {
            setFlashRed(false);
          }, 300);
          return;
        }
      } else {
        console.error("window.ethereum is not available");
        // Flash the button red
        setFlashRed(true);
        setTimeout(() => {
          setFlashRed(false);
        }, 300);
        return;
      }
    }

    // Proceed with claiming rewards
    try {
      setTransactionInitiated(true);
      setStatusMessage("Claiming...");
      const txResponse = await writeContractAsync({
        abi: ASXStakingABI,
        address: stakingContractAddress,
        functionName: "getReward",
      });
      setTransactionHash(txResponse as `0x${string}`);
      addRecentTransaction({
        hash: txResponse,
        description: "Claim",
      });
    } catch (error) {
      console.error("Reward claim error:", error);
      setStatusMessage("Error");
      setTimeout(() => {
        setStatusMessage("Claim");
      }, 5000);
      setTransactionInitiated(false);
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      <button
        className={`${styles.actionButton} ${isButtonDisabled ? styles.disabledButton : ""
          } ${isSuccess && transactionInitiated
            ? styles.successPulse
            : isError && transactionInitiated
              ? styles.errorPulse
              : ""
          } ${flashRed ? styles.flashRed : ""}`}
        onClick={handleAction}
      >
        <div className={styles.buttonContent}>
          <span className={styles.mainText}>
            {isLoading ? "Confirming..." : statusMessage}
          </span>
        </div>
      </button>
    </div>
  );
};

export default GetRewardButton;
