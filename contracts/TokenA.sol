// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenA is ERC20 {
    constructor() ERC20("TokenA", "TKA") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); 
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}