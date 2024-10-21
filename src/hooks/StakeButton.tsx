import React, { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
} from "wagmi";
import { ethers, BigNumber } from "ethers";
import { ERC20ABI } from "../abis/ERC20ABI";
import { ASXStakingABI } from "../abis/ASXStakingABI";
import styles from "../styles/StakingPage.module.css";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";

const StakeButton = ({
  tokenAddress,
  stakingContractAddress,
  amount,
  onUpdate,
  poolChainId,
}) => {
  const [statusMessage, setStatusMessage] = useState("Approve");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [transactionHash, setTransactionHash] = useState("");
  const [transactionInitiated, setTransactionInitiated] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(true);
  const [currentAllowance, setCurrentAllowance] = useState(BigNumber.from(0));

  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const addRecentTransaction = useAddRecentTransaction();

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

  // Fetching the current allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "allowance",
    args: [userAddress, stakingContractAddress],
  });

  // Update the current allowance when the fetched allowance changes
  useEffect(() => {
    if (allowance) {
      setCurrentAllowance(BigNumber.from(allowance.toString()));
    }
  }, [allowance]);

  // Determine if approval is needed based on the current allowance and the amount to be staked
  useEffect(() => {
    const requiredAmount = ethers.utils.parseEther(amount || "0");
    setNeedsApproval(currentAllowance.lt(requiredAmount));
  }, [amount, currentAllowance]);

  // Update statusMessage based on needsApproval and network
  useEffect(() => {
    if (currentChainId !== poolChainId) {
      setStatusMessage("Check Network");
    } else {
      setStatusMessage(needsApproval ? "Approve" : "Stake");
    }
  }, [currentChainId, poolChainId, needsApproval]);

  // Handle transaction status updates
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: transactionHash
      ? `0x${transactionHash.replace(/^0x/, "")}`
      : undefined,
  });

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

  useEffect(() => {
    if (transactionInitiated && transactionHash) {
      if (isLoading) {
        setStatusMessage("Processing");
      } else if (isSuccess) {
        setStatusMessage("Success!");
        setTimeout(() => {
          if (needsApproval) {
            setCurrentAllowance(ethers.constants.MaxUint256);
          }
          setStatusMessage("Stake");
          setTransactionInitiated(false);
          onUpdate();
        }, 2000);
      } else if (isError) {
        setStatusMessage("Error");
        setTimeout(() => {
          setStatusMessage(needsApproval ? "Approve" : "Stake");
          setTransactionInitiated(false);
        }, 2000);
      }
    }
  }, [
    isLoading,
    isSuccess,
    isError,
    transactionInitiated,
    onUpdate,
    transactionHash,
    needsApproval,
  ]);

  // Handle button click to initiate a transaction
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

    // Proceed with staking logic
    try {
      let txResponse;
      if (needsApproval) {
        setStatusMessage("Approving...");
        txResponse = await writeContractAsync({
          abi: ERC20ABI,
          address: tokenAddress,
          functionName: "approve",
          args: [
            stakingContractAddress,
            ethers.constants.MaxUint256.toString(),
          ],
        });
      } else {
        setStatusMessage("Staking...");
        txResponse = await writeContractAsync({
          abi: ASXStakingABI,
          address: stakingContractAddress,
          functionName: "stake",
          args: [ethers.utils.parseEther(amount)],
        });
      }
      setTransactionHash(txResponse);
      setTransactionInitiated(true);
      addRecentTransaction({
        hash: txResponse,
        description: needsApproval ? "Approval" : "Stake",
      });
    } catch (error) {
      console.error("Transaction error:", error);
      setStatusMessage("Error");
      setTimeout(() => setStatusMessage(needsApproval ? "Approve" : "Stake"), 3000);
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
        {isLoading ? "Processing..." : statusMessage}
      </button>
    </div>
  );
};

export default StakeButton;
