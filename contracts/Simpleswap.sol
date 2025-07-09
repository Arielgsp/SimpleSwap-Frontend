// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";


/**
 * @title LiquidityToken
 * @notice Token ERC20 que representa participación en los pools de liquidez
 * @dev Solo el contrato SimpleSwap puede mintear/quemar estos tokens
 */
contract LiquidityToken is ERC20 {


    constructor() ERC20("SimpleSwap Liquidity Token", "SSLT") {}

    /**
     * @notice Mintea nuevos tokens de liquidez
     * @dev Solo llamable por SimpleSwap
     * @param to Dirección que recibirá los tokens
     * @param amount Cantidad de tokens a mintear
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Quema tokens de liquidez
     * @dev Solo llamable por SimpleSwap
     * @param from Dirección cuyos tokens serán quemados
     * @param amount Cantidad de tokens a quemar
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

/**
 * @title SimpleSwap
 * @notice Implementación de un AMM (Automated Market Maker) básico
 * @dev Permite swaps entre pares de tokens ERC20 y gestión de liquidez
 */
contract SimpleSwap {
 
    // Estructura para almacenar las reservas de cada par de tokens
    struct Reserve {
        uint256 reserveA;
        uint256 reserveB;
    }

    // Mapeo anidado para guardar las reservas (tokenA => tokenB => Reserve)
    mapping(address => mapping(address => Reserve)) public reserves;

    // Token que representa participación en los pools
    LiquidityToken public liquidityToken;

    // Eventos
    event LiquidityAdded(address indexed tokenA, address indexed tokenB, uint amountA, uint amountB, uint liquidity, address indexed to);
    event LiquidityRemoved(address indexed tokenA, address indexed tokenB, uint amountA, uint amountB, uint liquidity, address indexed to);
    event Swapped(address indexed tokenIn, address indexed tokenOut, uint amountIn, uint amountOut, address indexed to);

    constructor() {
        liquidityToken = new LiquidityToken();
    }

    // ======================================================
    // |                   FUNCIONES PRINCIPALES            |
    // ======================================================

    /**
     * @notice Añade liquidez a un pool de tokens
     * @param tokenA Dirección del primer token
     * @param tokenB Dirección del segundo token
     * @param amountADesired Cantidad deseada de tokenA a depositar
     * @param amountBDesired Cantidad deseada de tokenB a depositar
     * @param amountAMin Mínimo aceptable de tokenA (protección contra slippage)
     * @param amountBMin Mínimo aceptable de tokenB (protección contra slippage)
     * @param to Dirección que recibirá los tokens de liquidez
     * @param deadline Límite de tiempo para ejecutar la transacción
     * @return amountA Cantidad efectiva de tokenA depositada
     * @return amountB Cantidad efectiva de tokenB depositada
     * @return liquidity Cantidad de tokens de liquidez emitidos
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        require(block.timestamp <= deadline, "EXPIRED");
        require(tokenA != tokenB, "IDENTICAL_TOKENS");

        (uint reserveA, uint reserveB) = (reserves[tokenA][tokenB].reserveA, reserves[tokenA][tokenB].reserveB);

        // Primer proveedor de liquidez
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
            liquidity = sqrt(amountA*amountB);
        } else {
            // Calcula la proporción óptima
            uint amountBOptimal = quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                require(amountAOptimal >= amountAMin, "INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
            liquidity = min(
                amountA*liquidityToken.totalSupply() / reserveA,
                amountB*liquidityToken.totalSupply() / reserveB
            );
        }

        _safeTransferFrom(tokenA, msg.sender, address(this), amountA);
        _safeTransferFrom(tokenB, msg.sender, address(this), amountB);

        // Actualiza reservas
        reserves[tokenA][tokenB].reserveA = reserveA + amountA;
        reserves[tokenA][tokenB].reserveB = reserveB + amountB;

        liquidityToken.mint(to, liquidity);
        emit LiquidityAdded(tokenA, tokenB, amountA, amountB, liquidity, to);
    }

    /**
     * @notice Remueve liquidez de un pool
     * @param tokenA Dirección del primer token
     * @param tokenB Dirección del segundo token
     * @param liquidity Cantidad de tokens de liquidez a quemar
     * @param amountAMin Mínimo aceptable de tokenA a recibir
     * @param amountBMin Mínimo aceptable de tokenB a recibir
     * @param to Dirección que recibirá los tokens retirados
     * @param deadline Límite de tiempo para ejecutar la transacción
     * @return amountA Cantidad de tokenA recibida
     * @return amountB Cantidad de tokenB recibida
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB) {
        require(block.timestamp <= deadline, "EXPIRED");

        (uint reserveA, uint reserveB) = (reserves[tokenA][tokenB].reserveA, reserves[tokenA][tokenB].reserveB);
        uint totalSupply = liquidityToken.totalSupply();

        amountA = liquidity*reserveA / totalSupply;
        amountB = liquidity*reserveB / totalSupply;

        require(amountA >= amountAMin, "INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "INSUFFICIENT_B_AMOUNT");

        liquidityToken.burn(msg.sender, liquidity);
        _safeTransfer(tokenA, to, amountA);
        _safeTransfer(tokenB, to, amountB);

        // Actualiza reservas
        reserves[tokenA][tokenB].reserveA = reserveA - amountA;
        reserves[tokenA][tokenB].reserveB = reserveB - amountB;

        emit LiquidityRemoved(tokenA, tokenB, amountA, amountB, liquidity, to);
    }

    /**
     * @notice Intercambia una cantidad exacta de tokens por otros
     * @param amountIn Cantidad exacta de tokens a enviar
     * @param amountOutMin Mínimo aceptable de tokens a recibir
     * @param path Array con las direcciones de los tokens [entrada, salida]
     * @param to Dirección que recibirá los tokens de salida
     * @param deadline Límite de tiempo para ejecutar la transacción
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        require(block.timestamp <= deadline, "EXPIRED");
        require(path.length == 2, "INVALID_PATH");

        address tokenIn = path[0];
        address tokenOut = path[1];
        Reserve storage reserve = reserves[tokenIn][tokenOut];
        uint reserveIn = reserve.reserveA;
        uint reserveOut = reserve.reserveB;
        
        uint amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");

        _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
        _safeTransfer(tokenOut, to, amountOut);

        // Actualiza reservas
        reserve.reserveA = reserveIn + amountIn;
        reserve.reserveB = reserveOut - amountOut;

        emit Swapped(tokenIn, tokenOut, amountIn, amountOut, to);
    }

    // ======================================================
    // |                 FUNCIONES DE CONSULTA              |
    // ======================================================

    /**
     * @notice Obtiene el precio de un token en términos del otro
     * @dev Precio expresado en 1e18 decimales (ej: 2e18 = 1 tokenA = 2 tokenB)
     * @param tokenA Dirección del primer token
     * @param tokenB Dirección del segundo token
     * @return price Precio de tokenA en términos de tokenB
     */
    function getPrice(address tokenA, address tokenB) external view returns (uint price) {
        Reserve memory reserve = reserves[tokenA][tokenB];
        require(reserve.reserveA > 0 && reserve.reserveB > 0, "INSUFFICIENT_LIQUIDITY");
        price = reserve.reserveB*1e18/reserve.reserveA;
    }

    /**
     * @notice Calcula la cantidad de tokens a recibir en un swap
     * @param amountIn Cantidad de tokens de entrada
     * @param reserveIn Reservas actuales del token de entrada
     * @param reserveOut Reservas actuales del token de salida
     * @return amountOut Cantidad estimada de tokens a recibir
     */
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure returns (uint amountOut) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");
        amountOut = amountIn*reserveOut / reserveIn + amountIn;
    }

    // ======================================================
    // |                 FUNCIONES INTERNAS                 |
    // ======================================================

    /**
     * @dev Calcula la cantidad óptima de un token dada una cantidad del otro
     */
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        require(amountA > 0, "INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "INSUFFICIENT_LIQUIDITY");
        amountB = amountA*reserveB / reserveA;
    }

    /**
     * @dev Calcula la raíz cuadrada (para liquidez inicial)
     */
    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    /**
     * @dev Envía tokens de forma segura
     */
    function _safeTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TRANSFER_FAILED");
    }

    /**
     * @dev Recibe tokens de forma segura
     */
    function _safeTransferFrom(address token, address from, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TRANSFER_FROM_FAILED");
    }

    /**
     * @dev Devuelve el mínimo entre dos valores
     */
    function min(uint a, uint b) internal pure returns (uint) {
        return a < b ? a : b;
    }
}