import { ethers } from "ethers";
import LPAddress from "./address.json";
import IERC20 from "./abi/EIP20Interface.json";
import IComptroller from "./abi/CErc20.json";
import CERC20 from "./abi/CErc20.json";
import IOracle from "./abi/SimplePriceOracle.json";


const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()
window.provider = provider;
window.signer = signer;

const cTokenTemplate = new ethers.Contract('0x0000000000000000000000000000000000000000', CERC20);
const IERC20Template = new ethers.Contract('0x0000000000000000000000000000000000000000', IERC20);
const IComptrollerTemplate = new ethers.Contract('0x0000000000000000000000000000000000000000', IComptroller);
const IOracleTemplate = new ethers.Contract('0x0000000000000000000000000000000000000000', IOracle);


export const contracts = {
    LP:[
    {
        name: "BTC",
        decimals: 8,
        underlying: IERC20Template.attach(LPAddress.BTC.underlying).connect(signer),
        cToken: cTokenTemplate.attach(LPAddress.BTC.cToken).connect(signer),
    },
     {
        name: "ETH",
        decimals: 18,
        underlying: IERC20Template.attach(LPAddress.ETH.underlying).connect(signer),
        cToken: cTokenTemplate.attach(LPAddress.ETH.cToken).connect(signer),
    },
    {
        name: "USDT",
        decimals: 18,
        underlying: IERC20Template.attach(LPAddress.USDT.underlying).connect(signer),
        cToken: cTokenTemplate.attach(LPAddress.USDT.cToken).connect(signer),
    }
    ],
    Comptroller: IComptrollerTemplate.attach(LPAddress.comptroller).connect(signer),
    Oracle: IOracleTemplate.attach(LPAddress.oracle).connect(signer)
}
window.contracts = contracts;


/*
mint:
    underlying.approve(ctoken.address, amount);
    ctoken.mint(amount);
borrow:
    prepare: Comptroller.

*/