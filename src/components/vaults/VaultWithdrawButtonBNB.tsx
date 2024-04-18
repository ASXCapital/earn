import React, { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ethers } from "ethers";
import { ASXVaultsABINative } from "../../abis/ASXVaultsABINative";
import styles from "../../styles/StakingPage.module.css";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";

const VaultWithdrawButtonBNB = ({
  vaultTokenAddress,
  amount,
  onUpdate,
  wrap = false,
}) => {
  const [statusMessage, setStatusMessage] = useState("Withdraw");
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
        setStatusMessage("Withdraw");
        setTransactionInitiated(false);
      }, 3000);
      onUpdate();
    } else if (isError && transactionInitiated) {
      setStatusMessage("Error");
      setTimeout(() => {
        setStatusMessage("Withdraw");
        setTransactionInitiated(false);
      }, 3000);
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate]);

  const handleAction = async () => {
    if (isButtonDisabled || isLoading) return;
    setStatusMessage("Withdrawing...");
    setIsButtonDisabled(true);

    try {
      const amountInWei = ethers.utils.parseUnits(amount.toString(), "ether");

      const txResponse = await writeContractAsync({
        abi: ASXVaultsABINative,
        address: vaultTokenAddress,
        functionName: "withdraw",
        args: [amountInWei, wrap], // Ensure the args match the expected types: uint256 and bool
      });

      setTransactionHash(txResponse);
      setTransactionInitiated(true);
      addRecentTransaction({
        hash: txResponse,
        description: "Vault Withdraw BNB",
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      setStatusMessage("Error");
      setIsButtonDisabled(false);
    } finally {
      setTimeout(() => setStatusMessage("Withdraw"), 5000);
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

export default VaultWithdrawButtonBNB;
