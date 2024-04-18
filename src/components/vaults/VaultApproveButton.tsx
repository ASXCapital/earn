import React, { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { ethers } from "ethers";
import { ERC20ABI } from "../../abis/ERC20ABI";
import styles from "../../styles/StakingPage.module.css";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";

const VaultApproveButton = ({
  userAddress,
  tokenAddress,
  stakingContractAddress,
  onUpdate,
  inputValue,
}) => {
  const [statusMessage, setStatusMessage] = useState("Approve");
  const [transactionHash, setTransactionHash] = useState("");
  const [transactionInitiated, setTransactionInitiated] = useState(false);
  const addRecentTransaction = useAddRecentTransaction();
  const { writeContractAsync } = useWriteContract();
  const { data: allowance, isLoading: isLoadingAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "allowance",
    args: [userAddress, stakingContractAddress],
  });

  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: transactionHash
      ? `0x${transactionHash.replace(/^0x/, "")}`
      : undefined,
  });

  useEffect(() => {
    if ((isSuccess || isError) && transactionInitiated) {
      const newStatus = isSuccess ? "Success" : "Error";
      setStatusMessage(newStatus);
      setTimeout(() => {
        setStatusMessage("Approve");
        setTransactionInitiated(false);
        if (isSuccess) onUpdate();
      }, 3000);
    }
  }, [isSuccess, isError, transactionInitiated, onUpdate]);

  const handleApprove = async () => {
    if (isLoading || isLoadingAllowance || !userAddress) return;
    setStatusMessage("Approving...");
    setTransactionInitiated(true);

    try {
      const txResponse = await writeContractAsync({
        abi: ERC20ABI,
        address: tokenAddress,
        functionName: "approve",
        args: [stakingContractAddress, ethers.constants.MaxUint256.toString()],
      });
      setTransactionHash(txResponse);
      addRecentTransaction({
        hash: txResponse,
        description: "Approving tokens for staking",
      });
    } catch (error) {
      console.error("Approval error:", error);
      setStatusMessage("Error");
      setTimeout(() => setStatusMessage("Approve"), 5000);
      setTransactionInitiated(false);
    }
  };

  // Convert input value to a BigNumber for comparison
  const inputValueBigNumber = ethers.utils.parseUnits(
    inputValue || "0",
    "ether",
  );
  // Disable the button if the current allowance is already greater or equal to the input value, or if no value is inputted
  const isButtonDisabled =
    isLoading ||
    isLoadingAllowance ||
    !inputValue ||
    ethers.BigNumber.from(allowance || "0").gte(inputValueBigNumber);

  return (
    <div className={styles.buttonWrapper}>
      <button
        className={`${styles.actionButton} ${isButtonDisabled ? styles.disabledButton : ""}`}
        onClick={handleApprove}
        disabled={isButtonDisabled}
      >
        {isLoading ? "Confirming..." : statusMessage}
      </button>
    </div>
  );
};

export default VaultApproveButton;
