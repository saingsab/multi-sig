const { expectRevert } = require('@openzeppelin/test-helpers');
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
});
