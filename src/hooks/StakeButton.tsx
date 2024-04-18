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
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: transactionHash
      ? `0x${transactionHash.replace(/^0x/, "")}`
      : undefined,
  });

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
    setIsButtonDisabled(
      !amount || amount === "0" || isNaN(amount) || isLoading,
    );
    setStatusMessage(needsApproval ? "Approve" : "Stake");
  }, [amount, currentAllowance, isLoading, needsApproval]);

  // Handle transaction status updates
  useEffect(() => {
    if (transactionInitiated && transactionHash) {
      if (isLoading) {
        setStatusMessage("Processing");
      } else if (isSuccess) {
        setStatusMessage("Success!");
        setTimeout(() => {
          // Update the allowance to reflect the approved amount
          // Assuming the approval sets the allowance to MaxUint256
          if (needsApproval) {
            setCurrentAllowance(ethers.constants.MaxUint256);
          }
          setStatusMessage("Stake");
          setTransactionInitiated(false);
          onUpdate(); // Trigger any additional update logic
        }, 2000); // Show "Success!" for 2 seconds before updating
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
    if (isButtonDisabled || isLoading) return;

    try {
      let txResponse;
      if (needsApproval) {
        setStatusMessage("Approving..");
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
        setStatusMessage("Staking..");
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
      setTimeout(
        () => setStatusMessage(needsApproval ? "Approve" : "Stake"),
        3000,
      );
      setTransactionInitiated(false);
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      <button
        className={`${styles.actionButton} ${isButtonDisabled || isLoading ? styles.disabledButton : ""} ${isSuccess && transactionInitiated ? styles.successPulse : isError && transactionInitiated ? styles.errorPulse : ""}`}
        onClick={handleAction}
        disabled={isButtonDisabled || isLoading}
      >
        {isLoading ? "Processing..." : statusMessage}
      </button>
    </div>
  );
};

export default StakeButton;
