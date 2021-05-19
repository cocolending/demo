import { ethers } from "ethers";
import LPAddress from "./address.json";
import IERC20 from "./abi/EIP20Interface.json";
import IComptroller from "./abi/ComptrollerG6.json";
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

export class CToken {
    constructor(cToken, underlying, comptroller, oracle) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        this.cToken = cTokenTemplate.attach(cToken).connect(signer);
        this.underlying = IERC20Template.attach(underlying).connect(signer);
        this.comptroller = IComptrollerTemplate.attach(comptroller).connect(signer);
        this.oracle = IOracleTemplate.attach(oracle).connect(signer);
    }
    async getAccount() {
        return window.ethereum.enable().then(accs=>accs[0]);
    }

    // 存款
    async mint(amount) {
        const account = await this.getAccount();
        const allowance = await this.underlying.allowance(account, this.cToken.address);
        if (allowance.lt(amount))
            await this.enableMarket();
        await this.cToken.mint(amount)
    }
    // 取款
    async redeem(amount, useCtoken = false) {
        if (useCtoken)
            await this.cToken.redeem(amount);
        else
            await this.cToken.redeemUnderlying(amount);
    }

    // 借款
    async borrow(amount) {
        await this.cToken.borrow(amount);
    }
    // 归还借款
    async repayBorrow(amount) {
        const account = await this.getAccount();
        const allowance = await this.underlying.allowance(account, this.cToken.address);
        if (allowance.lt(amount))
            await this.enableMarket();
        await this.cToken.repayBorrow(amount);
    }

    // 启用抵押
    async enterMarket() {
        await this.comptroller.enterMarkets([this.cToken.address])
    }
    // 获取抵押是否开启
    async getMarketEntered() {
        const account = await this.getAccount();
        return await this.comptroller.checkMembership(account, this.cToken.address);
    }

    // 启用市场
    async enableMarket() {
        await this.underlying.approve(this.cToken.address, ethers.constants.MaxUint256);
    }
    // 市场是否启用
    async getMarketEnabled() {
        const account = await this.getAccount();
        const threshold = 0;
        const allowance = await this.underlying.allowance(account, this.cToken.address);
        return allowance.gt(threshold);
    }

    // 借款上限
    async getBorrowLimit() {
        return 0;
    }

    // 当前市场总借款(未偿还+利息)
    async getBorrowBalance() {
        return await this.cToken.callStatic.totalBorrowsCurrent();
    }
    // 当前市场存款余额
    async getSupplyBalance() {
        return await this.cToken.getCash();
    }
    // 当前市场风险金
    async getReserve() {
        return await this.cToken.totalReserves();
    }

    // 查询账户存借状态
    async getAccountSnapshot() {
        const account = await this.getAccount();
        const snap = await this.cToken.getAccountSnapshot(account);
        if(Number(snap[0]) != 0) throw `getAccountSnapshot ${snap}`;
        return snap.slice(1);
    }
    // 存款APY 年化
    async getSupplyAPY() {
        const perBlock = await this.cToken.supplyRatePerBlock();
        const blockTime = 2;
        return (Number(perBlock.mul(365 * 24 * 3600 / blockTime)) / 1e18 + 1) ** 365 - 1;
    }
    // 借款APY 年化
    async getBorrowAPY() {
        const perBlock = await this.cToken.borrowRatePerBlock()
        const blockTime = 2;
        return (Number(perBlock.mul(365 * 24 * 3600 / blockTime)) / 1e18 + 1) ** 365 - 1;
    }

}


export const contracts = [
    {
        name: "BTC",
        decimals: 8,
        lp: new CToken(LPAddress.BTC.cToken, LPAddress.BTC.underlying, LPAddress.comptroller, LPAddress.oracle)
    },
    {
        name: "ETH",
        decimals: 18,
        lp: new CToken(LPAddress.ETH.cToken, LPAddress.ETH.underlying, LPAddress.comptroller, LPAddress.oracle)
    },
    {
        name: "USDT",
        decimals: 18,
        lp: new CToken(LPAddress.USDT.cToken, LPAddress.USDT.underlying, LPAddress.comptroller, LPAddress.oracle)
    }
];
window.contracts = contracts;


/*
mint:
    underlying.approve(ctoken.address, amount);
    ctoken.mint(amount);
borrow:
    prepare: Comptroller.
APY:
    cToken.borrowRatePerBlock();

*/