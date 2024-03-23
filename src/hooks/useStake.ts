
/*
import { useWriteContract, useReadContract } from 'wagmi';
import { ethers } from 'ethers';
import { ASXStakingABI as abi } from '../abis/ASXStakingABI';

interface UseStakeTokenProps {
  stakingContractAddress: string;
  stakeAmount: string;
}

const useStakeToken = ({ tokenAddress, stakingContractAddress, stakeAmount }) => {
  // State to track whether approval is needed
  const [needsApproval, setNeedsApproval] = useState(false);

  // Check the current allowance
  const { data: allowance } = useContractRead({
    addressOrName: tokenAddress,
    contractInterface: ERC20ABI,
    functionName: 'allowance',
    args: [/* User Address *//*, stakingContractAddress],
  });

  // Effect to update needsApproval based on allowance and stakeAmount
  useEffect(() => {
    const currentAllowance = allowance ? ethers.BigNumber.from(allowance) : ethers.BigNumber.from(0);
    const requiredAmount = ethers.utils.parseEther(stakeAmount);
    setNeedsApproval(currentAllowance.lt(requiredAmount));
  }, [allowance, stakeAmount]);

  // Approve function
  const { write: approve, isLoading: isApproving } = useContractWrite({
    addressOrName: tokenAddress,
    contractInterface: ERC20ABI,
    functionName: 'approve',
    args: [stakingContractAddress, ethers.constants.MaxUint256], // Approving max amount for convenience
  });

  // Stake function
    const { write: stake, isLoading: isStaking } = useContractWrite({
      addressOrName: stakingContractAddress,
      contractInterface: stakingAbi,
      functionName: 'stake',
      args: [ethers.utils.parseEther(stakeAmount)],
    });

    return { approve, stake, isApproving, isStaking, needsApproval };
  };
*/