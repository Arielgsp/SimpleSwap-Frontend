const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let tokenA, tokenB, swap;
  let owner;

  before(async () => {
    [owner] = await ethers.getSigners();

    tokenA = await ethers.deployContract("TokenA");
    tokenB = await ethers.deployContract("TokenB");
    swap = await ethers.deployContract("SimpleSwap");

    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();
    await swap.waitForDeployment();

    // Mint inicial
    await tokenA.mint(owner.address, ethers.parseEther("1000"));
    await tokenB.mint(owner.address, ethers.parseEther("1000"));
  });

  // --- Tests principales  ---
  describe("addLiquidity", () => {
    it("Should add liquidity and update reserves", async () => {
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 600;

      await tokenA.approve(swap.getAddress(), ethers.parseEther("100"));
      await tokenB.approve(swap.getAddress(), ethers.parseEther("100"));

      await swap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("100"),
        ethers.parseEther("100"),
        0,
        0,
        owner.address,
        deadline
      );

      const reserves = await swap.reserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(reserves.reserveA).to.equal(ethers.parseEther("100"));
    });

    it("Should revert if tokens are identical", async () => {
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 600;
      await expect(
        swap.addLiquidity(
          await tokenA.getAddress(),
          await tokenA.getAddress(),
          ethers.parseEther("100"),
          ethers.parseEther("100"),
          0,
          0,
          owner.address,
          deadline
        )
      ).to.be.revertedWith("IDENTICAL_TOKENS");
    });
  });

  describe("swapExactTokensForTokens", () => {
    it("Should swap TokenA for TokenB", async () => {
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 600;

      // Añade liquidez primero
      await tokenA.approve(swap.getAddress(), ethers.parseEther("200"));
      await tokenB.approve(swap.getAddress(), ethers.parseEther("200"));

      await swap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("100"),
        ethers.parseEther("100"),
        0,
        0,
        owner.address,
        deadline
      );

      // Realiza el swap
      await tokenA.approve(swap.getAddress(), ethers.parseEther("10"));

      await swap.swapExactTokensForTokens(
        ethers.parseEther("10"),
        0,
        [await tokenA.getAddress(), await tokenB.getAddress()],
        owner.address,
        deadline
      );

      const reserves = await swap.reserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(reserves.reserveA).to.be.gt(ethers.parseEther("100"));
    });
  });
});
