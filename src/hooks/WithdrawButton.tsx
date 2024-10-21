import React, { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { ethers } from "ethers";
import { ASXStakingABI } from "../abis/ASXStakingABI";
import styles from "../styles/StakingPage.module.css";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";

const WithdrawButton = ({
  stakingContractAddress,
  amount,
  onUpdate,
  poolChainId,
}) => {
  const [statusMessage, setStatusMessage] = useState("Withdraw");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [transactionInitiated, setTransactionInitiated] = useState(false);

  const addRecentTransaction = useAddRecentTransaction();
  const { writeContractAsync } = useWriteContract();

  // State for network checking
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [flashRed, setFlashRed] = useState(false);

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
      const handleChainChanged = (chainIdHex: string) => {
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
    hash: transactionHash
      ? `0x${transactionHash.replace(/^0x/, "")}`
      : undefined,
  });

  useEffect(() => {
    if (transactionInitiated && transactionHash) {
      if (isSuccess) {
        setStatusMessage("Success");
        setTimeout(() => {
          setStatusMessage("Withdraw");
          setTransactionInitiated(false);
        }, 3000);
        onUpdate();
      } else if (isError) {
        setStatusMessage("Error");
        setTimeout(() => {
          setStatusMessage("Withdraw");
          setTransactionInitiated(false);
        }, 3000);
      }
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate]);

  // Update statusMessage based on network
  useEffect(() => {
    if (currentChainId !== poolChainId) {

    } else {
      setStatusMessage("Withdraw");
    }
  }, [currentChainId, poolChainId]);

  // Update isButtonDisabled based on amount, loading state, and network
  useEffect(() => {
    const isDisabled =
      !amount ||
      amount === "0" ||
      isNaN(Number(amount)) ||
      isLoading ||
      currentChainId !== poolChainId;
    setIsButtonDisabled(isDisabled);
  }, [amount, isLoading, currentChainId, poolChainId]);

  const handleAction = async () => {
    if (isLoading) return;

    // Check if user is on the correct network
    if (currentChainId !== poolChainId) {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ethers.utils.hexValue(poolChainId) }],
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

    // Check for valid amount
    if (!amount || amount === "0" || isNaN(Number(amount))) {
      // Flash the button red
      setFlashRed(true);
      setTimeout(() => {
        setFlashRed(false);
      }, 300);
      return;
    }

    // Proceed with withdrawal logic
    try {
      setStatusMessage("Withdrawing");
      const txResponse = await writeContractAsync({
        abi: ASXStakingABI,
        address: stakingContractAddress,
        functionName: "withdraw",
        args: [ethers.utils.parseEther(amount || "0")],
      });
      setTransactionHash(txResponse);
      setTransactionInitiated(true);
      addRecentTransaction({
        hash: txResponse,
        description: "Withdraw",
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      setStatusMessage("Error");
      setTimeout(() => {
        setStatusMessage("Withdraw");
      }, 5000);
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
            {isLoading ? "Confirming" : statusMessage}
          </span>
          <span className={styles.noteInsideButton}>
            (leave blank for max)
          </span>
        </div>
      </button>
    </div>
  );
};

export default WithdrawButton;
