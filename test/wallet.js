const { expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const Wallet = artifacts.require('Wallet');

contract('Wallet', (accounts) => {
    let wallet;
    beforeEach(async () => {
        wallet = await Wallet.new([accounts[0], accounts[1], accounts[2]], 2);
        await web3.eth.sendTransaction({ from: accounts[0], to: wallet.address, value: 1000 });
    });

    it('should have correct approver and quorum', async () => {
        const approver = await wallet.getApprovers();
        const quorum = await wallet.quorum();

        assert(approver.length === 3);
        assert(approver[0] === accounts[0]);
        assert(approver[1] === accounts[1]);
        assert(approver[2] === accounts[2]);
        assert(quorum.toNumber() == 2);
    });
    it('should creatre transfers', async () => {
        await wallet.createTransfer(100, accounts[5], { from: accounts[0] });
        const transfers = await wallet.getTransfers();
        assert(transfers.length === 1);
        assert(transfers[0].id === '0');
        assert(transfers[0].amount === '100');
        assert(transfers[0].to === accounts[5]);
        assert(transfers[0].approvals === '0');
        assert(transfers[0].sent === false);
    });
    it('approve only transfer FN', async () => {
        await expectRevert(
            wallet.createTransfer(100, accounts[5], { from: accounts[4] }),
            'only approver allowed'
        );
    });
    it('approvals increament check', async () => {
        await wallet.createTransfer(1000, accounts[5], { from: accounts[0] });
        await wallet.approveTransfer(0, { from: accounts[0] });
        const transfers = await wallet.getTransfers();
        const balance = await web3.eth.getBalance(wallet.address);
        assert(transfers[0].approvals === '1');
        assert(transfers[0].sent === false);
        assert(balance === '1000');
    });
    it('successfully sent after reach quorum', async () => {
        const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));
        await wallet.createTransfer(100, accounts[6], { from: accounts[0] });
        await wallet.approveTransfer(0, { from: accounts[0] });
        await wallet.approveTransfer(0, { from: accounts[1] });
        const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));
        assert(balanceAfter.sub(balanceBefore).toNumber() === 100);
    });
    it('should not approve transfer if sender is not approved', async () => {
        await wallet.createTransfer(100, accounts[5], { from: accounts[0] });
        await expectRevert(
            wallet.approveTransfer(0, { from: accounts[4] }),
            'only approver allowed'
        )
    });
    it('should NOT approve transfer is transfer is already sent', async () => {
        await wallet.createTransfer(100, accounts[6], { from: accounts[0] });
        await wallet.approveTransfer(0, { from: accounts[0] });
        await wallet.approveTransfer(0, { from: accounts[1] });
        await expectRevert(
            wallet.approveTransfer(0, { from: accounts[2] }),
            'tranfer has already been sent'
        )
    });
    it('should NOT approve transfer twice', async () => {
        await wallet.createTransfer(100, accounts[6], { from: accounts[0] });
        await wallet.approveTransfer(0, { from: accounts[0] });
        await expectRevert(
            wallet.approveTransfer(0, { from: accounts[0] }),
            'Can not approve tranfer twice'
        );
    });
});