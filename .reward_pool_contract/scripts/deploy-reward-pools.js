const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function required(value, label) {
  if (!value || value === "REPLACE_ME") {
    throw new Error(`Missing ${label}`);
  }
  return value;
}

async function main() {
  const configPath = process.env.POOL_CONFIG || path.join(__dirname, "..", "deploy-pools.json");
  const configRaw = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(configRaw);

  const rewardToken = required(config.rewardToken, "rewardToken");
  const pools = Array.isArray(config.pools) ? config.pools : [];
  if (!pools.length) throw new Error("No pools defined");

  const RewardPool = await hre.ethers.getContractFactory("RewardPool");
  const deployments = [];

  for (const pool of pools) {
    const label = pool.label || "RewardPool";
    const stakeToken = required(pool.stakeToken, `${label} stakeToken`);
    const rewardPerBlock = required(pool.rewardPerBlock, `${label} rewardPerBlock`);

    if (pool.address) {
      deployments.push({
        label,
        stakeToken,
        rewardToken,
        rewardPerBlock: String(rewardPerBlock),
        address: pool.address,
      });
      console.log(`${label}: ${pool.address} (skipped)`);
      continue;
    }

    const contract = await RewardPool.deploy(stakeToken, rewardToken, rewardPerBlock);
    await contract.deployed();

    deployments.push({
      label,
      stakeToken,
      rewardToken,
      rewardPerBlock: String(rewardPerBlock),
      address: contract.address,
    });

    console.log(`${label}: ${contract.address}`);
  }

  const outPath = path.join(__dirname, "..", "deploy-output.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify({ network: hre.network.name, rewardToken, pools: deployments }, null, 2),
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
