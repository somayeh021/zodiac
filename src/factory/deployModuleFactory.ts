import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { constants as ethersConstants } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSingletonFactory } from "./singletonFactory";

const { AddressZero } = ethersConstants;

const FactorySalt =
  "0xb0519c4c4b7945db302f69180b86f1a668153a476802c1c445fcb691ef23ef16";

/**
 * Deploy a module factory via the singleton factory.
 * It will therefore get the same address on any chain.
 *
 * @param hre hardhat runtime environment
 * @returns The address of the deployed module factory, or the zero address if it was already deployed
 */
export const deployModuleFactory = async (
  hre: HardhatRuntimeEnvironment
): Promise<string> => {
  const singletonFactory = await getSingletonFactory(hre);
  console.log("    Singleton Factory:     ", singletonFactory.address);
  const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");

  const targetAddress = await singletonFactory.callStatic.deploy(
    Factory.bytecode,
    FactorySalt
  );
  if (targetAddress === AddressZero) {
    console.log(
      "    ModuleProxyFactory already deployed to target address on this network."
    );
    return AddressZero;
  }

  console.log("    Target Factory Address:", targetAddress);

  const transactionResponse = await singletonFactory.deploy(
    Factory.bytecode,
    FactorySalt,
    { gasLimit: 1000000 }
  );

  const result = await transactionResponse.wait();
  console.log("    Deploy transaction:    ", result.transactionHash);

  const factory = await hre.ethers.getContractAt(
    "ModuleProxyFactory",
    targetAddress
  );

  const factoryArtifact = await hre.artifacts.readArtifact(
    "ModuleProxyFactory"
  );

  if (
    (await hre.ethers.provider.getCode(factory.address)) !==
    factoryArtifact.deployedBytecode
  ) {
    throw new Error(
      "    Deployment unsuccessful: deployed bytecode does not match."
    );
  } else {
    console.log(
      "    Successfully deployed ModuleProxyFactory to target address! 🎉"
    );
  }
  return targetAddress;
};
