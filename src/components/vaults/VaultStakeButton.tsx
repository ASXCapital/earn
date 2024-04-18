import React, { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ethers } from "ethers";
import { ASXVaultsABI } from "../../abis/ASXVaultsABI";
import styles from "../../styles/StakingPage.module.css";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";

const VaultStakeButton = ({
  vaultContractAddress,
  amount,
  onUpdate,
  tokenAddress,
}) => {
  // Change component name
  const [statusMessage, setStatusMessage] = useState("Stake"); // Change status message
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [transactionInitiated, setTransactionInitiated] = useState(false);
  const addRecentTransaction = useAddRecentTransaction();

  useEffect(() => {
    setIsButtonDisabled(!amount || amount === "0" || isNaN(amount));
  }, [amount]);

  const { writeContractAsync } = useWriteContract();

  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: transactionHash
      ? `0x${transactionHash.replace(/^0x/, "")}`
      : undefined,
  });

  useEffect(() => {
    if (isSuccess && transactionInitiated) {
      setStatusMessage("Success");
      setTimeout(() => {
        setStatusMessage("Stake");
        setTransactionInitiated(false);
      }, 3000);
      onUpdate();
    } else if (isError && transactionInitiated) {
      setStatusMessage("Error");
      setTimeout(() => {
        setStatusMessage("Stake");
        setTransactionInitiated(false);
      }, 3000);
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate]);

  const handleAction = async () => {
    if (isButtonDisabled || isLoading) return;
    setStatusMessage("Staking"); // Change status message
    setIsButtonDisabled(true);

    try {
      const txResponse = await writeContractAsync({
        abi: ASXVaultsABI, // Change ABI
        address: vaultContractAddress,
        functionName: "stake", // Change function name
        args: [
          tokenAddress,
          amount ? ethers.utils.parseUnits(amount, "ether").toString() : "0",
        ], // Correct arguments
      });
      setTransactionHash(txResponse); // Corrected to use txResponse.hash
      setTransactionInitiated(true);
      addRecentTransaction({
        hash: txResponse, // Corrected to use txResponse.hash
        description: "Vault Deposit ERC20", // Change description
      });
    } catch (error) {
      console.error("Staking error:", error); // Change error message
      setStatusMessage("Error");
      setTimeout(() => {
        setStatusMessage("Stake");
      }, 5000);
      setIsButtonDisabled(false);
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      <button
        className={`${styles.actionButton} ${isButtonDisabled || isLoading ? styles.disabledButton : ""} ${isSuccess && transactionInitiated ? styles.successPulse : isError && transactionInitiated ? styles.errorPulse : ""}`}
        onClick={handleAction}
        disabled={isButtonDisabled || isLoading}
      >
        <div className={styles.buttonContent}>
          <span className={styles.mainText}>
            {isLoading ? "Confirming" : statusMessage}
          </span>
        </div>
      </button>
    </div>
  );
};

export default VaultStakeButton; // Change export name
