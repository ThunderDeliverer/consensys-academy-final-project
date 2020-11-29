let catchRevert = require("./exceptions_helpers.js").catchRevert
var administration = artifacts.require("./Administration.sol");
var praise = artifacts.require("./Praise.sol");
var chai = require('chai');
const { isMainThread } = require("worker_threads");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Praise", function (accounts) {

  const owner = accounts[0]
  const admin = accounts[1]
  const firstUser = accounts[2]
  const secondUser = accounts[3]
  const secondaryOwner = accounts[4]

  beforeEach(async () => {
    admin_contract = await administration.new()
    instance = await praise.new(admin_contract.address, 1, 2, { from: owner })
    smart_contract = instance.address
  })

  it('should assert true', async function () {
    await praise.deployed();
    return chai.assert.isTrue(true);
  });

  it('should initialize with growth thresholds passed into constructor', async function () {
    const firstGrowthThreshold = await instance.firstGrowth()
    const secondGrowthThreshold = await instance.secondGrowth()

    chai.assert.equal(web3.utils.hexToNumber(firstGrowthThreshold), 1, 'firstGrowth is not equal to param passed to constructor')
    chai.assert.equal(web3.utils.hexToNumber(secondGrowthThreshold), 2, 'secondGrowth is not equal to param passed to constructor')
  });

  it("should transfer the ownership of the contract when initiated by the owner", async function () {
    await instance.transferOwnership(secondaryOwner, { from: owner })

    const contract_owner = await admin_contract.checkOwnership(secondaryOwner, { from: smart_contract })

    chai.assert.isTrue(contract_owner, 'transferOwnership does not transfer the ownership for the contract')
  });

  it("should succesfully appoint admin", async function () {
    await instance.appointAdmin(admin, { from: owner })

    const contract_admin = await admin_contract.checkAdministatorship(admin, { from: smart_contract })

    chai.assert.isTrue(contract_admin, 'appointAdmin does not appoint administrator')
  });

  it("should succesfully demote admin", async function () {
    await instance.appointAdmin(admin, { from: owner })
    await instance.demoteAdmin(admin, { from: owner })

    const contract_admin = await admin_contract.checkAdministatorship(admin, { from: smart_contract })

    chai.assert.isFalse(contract_admin, 'demoteAdmin does not demote administrator')
  });

  it("should succesfully register user", async function () {
    await instance.registerUser(firstUser, { from: owner })

    const contract_registered_user = await admin_contract.checkRegisteredUser(firstUser, { from: smart_contract })

    chai.assert.isTrue(contract_registered_user, 'registerUser does not register user')
  });

  it("should succesfully unregister user", async function () {
    await instance.registerUser(firstUser, { from: owner })
    await instance.unregisterUser(firstUser, { from: owner })

    const contract_registered_user = await admin_contract.checkRegisteredUser(firstUser, { from: smart_contract })

    chai.assert.isFalse(contract_registered_user, 'unregisterUser does not unregister user')
  });

  it("should emit event NewSeedling on first registration of a user", async function () {
    let eventEmitted = false

    const tx = await instance.registerUser(firstUser, { from: owner })

    if (tx.logs[0].event == 'NewSeedling') {
      eventEmitted = true
    }

    chai.assert.isTrue(eventEmitted, 'NewSeedling event is not emitted upon first registration of a user')
  });

  it('should update growth thresholds if called by tenant with admin access', async function (){
    await instance.setGrowthThresholds(2, 3, { from: owner })

    const firstGrowthThreshold = await instance.firstGrowth()
    const secondGrowthThreshold = await instance.secondGrowth()

    chai.assert.equal(web3.utils.hexToNumber(firstGrowthThreshold), 2, 'firstGrowth is not equal to param passed to setGrowthThreshold')
    chai.assert.equal(web3.utils.hexToNumber(secondGrowthThreshold), 3, 'secondGrowth is not equal to param passed to setGrowthThreshold')
  });

  it('should allow to update only second growth theshold', async function (){
    await instance.setGrowthThresholds(0, 3, { from: owner })

    const firstGrowthThreshold = await instance.firstGrowth()
    const secondGrowthThreshold = await instance.secondGrowth()

    chai.assert.equal(web3.utils.hexToNumber(firstGrowthThreshold), 1, 'firstGrowth has been modified, but should remain the same, check setGrowthThreshold')
    chai.assert.equal(web3.utils.hexToNumber(secondGrowthThreshold), 3, 'secondGrowth is not equal to param passed to setGrowthThreshold')
  });

  it('should allow to update only first growth theshold', async function () {
    await instance.setGrowthThresholds(0, 4, { from: owner })
    await instance.setGrowthThresholds(2, 0, { from: owner })

    const firstGrowthThreshold = await instance.firstGrowth()
    const secondGrowthThreshold = await instance.secondGrowth()

    chai.assert.equal(web3.utils.hexToNumber(firstGrowthThreshold), 2, 'firstGrowth is not equal to param passed to setGrowthThreshold')
    chai.assert.equal(web3.utils.hexToNumber(secondGrowthThreshold), 4, 'secondGrowth has been modified, but should remain the same, check setGrowthThreshold')
  });

  it('should ignore 0 as an input value for threshold setting', async function (){
    await instance.setGrowthThresholds(0, 0, { from: owner })

    const firstGrowthThreshold = await instance.firstGrowth()
    const secondGrowthThreshold = await instance.secondGrowth()

    chai.assert.equal(web3.utils.hexToNumber(firstGrowthThreshold), 1, 'firstGrowth has been changed to 0, check setGrowthThreshold')
    chai.assert.equal(web3.utils.hexToNumber(secondGrowthThreshold), 2, 'secondGrowth has been changed to 0, check setGrowthThreshold')
  });

  it('should not allow to set the second growth threshold lower than the first one', async function () {
    await instance.setGrowthThresholds(2, 3, { from: owner })
    await catchRevert(instance.setGrowthThresholds(3, 2, { from: owner }))
  });

  it('should not allow to set the first growth threshold higher than the second one', async function () {
    await catchRevert(instance.setGrowthThresholds(3, 0, { from: owner }))
  });

  it('should not allow to set the first growth threshold equal to the second one', async function () {
    await catchRevert(instance.setGrowthThresholds(3, 3, { from: owner }))
  });

  it('should not allow chenging growth threshold values by users without admin permissions', async function () {
    await catchRevert(instance.setGrowthThresholds(3, 3, { from: firstUser }))
  });

  it('should emit NewPraise event when new praise in issued', async function(){
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })

    let eventEmitted = false

    const tx = await instance.givePraise(firstUser, 'Praise', { from: secondUser })

    if (tx.logs[0].event == 'NewPraise') {
      eventEmitted = true
    }

    chai.assert.isTrue(eventEmitted, 'NewPraise event is not emitted when praise is given, check givePraise')
  });

  it('should add the new praise to the users array', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    await instance.givePraise(firstUser, 'Praise one', { from: secondUser })
    await instance.givePraise(firstUser, 'Praise two', { from: secondUser })

    const userPraiseData = await instance.viewUserPraiseData(firstUser)
    const numberOfPraises = userPraiseData[0]
    const stage = userPraiseData[1]
    const praiseData = await instance.viewPraise(firstUser, 1)
    const praiseGiver = praiseData[0]
    const praiseText = praiseData[1]

    chai.assert.equal(web3.utils.hexToNumber(numberOfPraises), 2, 'number of praises on user does not match actual number, check givePraise')
    chai.assert.equal(web3.utils.hexToNumber(stage), 2, 'stage of the user does not reflect correct stage, check givePraise')
    chai.assert.equal(praiseGiver, secondUser, 'praise giveron user does not match actual giver, check givePraise')
    chai.assert.equal(praiseText, 'Praise two', 'praise does not match the actual praise, check givePraise')
  });

  it('should not allow to give praise to unregistered user', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await catchRevert(instance.givePraise(secondUser, 'Praise one', { from: firstUser }))
  });

  it('should not allow unregistered user to give praise to registered user', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await catchRevert(instance.givePraise(firstUser, 'Praise one', { from: secondUser }))
  });

  it('should not allow unregistered user to give praise to unregistered user', async function () {
    await catchRevert(instance.givePraise(secondUser, 'Praise one', { from: firstUser }))
  });

  it('should not allow user to give praise to self', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await catchRevert(instance.givePraise(firstUser, 'Praise one', { from: firstUser }))
  });

  it('should emit correct data when new praise is given', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    const result = await instance.givePraise(firstUser, 'Praise one', { from: secondUser })

    const result_giver = result.logs[0].args.praiseGiver
    const result_receiver = result.logs[0].args.praiseReceiver
    const result_praise = result.logs[0].args.praise

    chai.assert.equal(result_giver, secondUser, 'praiseGiver param in NewPraise is incorrect, check GivePraise')
    chai.assert.equal(result_receiver, firstUser, 'praiseReceiver param in NewPraise is incorrect, check GivePraise')
    chai.assert.equal(result_praise, 'Praise one', 'praise param in NewPraise is incorrect, check GivePraise')
  });

  it('should emit correct event when new user surpasses first threshold upon receiving praise', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    let eventEmitted = false

    const tx = await instance.givePraise(firstUser, 'Praise', { from: secondUser })

    if (tx.logs[1].event == 'UserGrowthToShrub') {
      eventEmitted = true
    }

    chai.assert.isTrue(eventEmitted, 'user param in UserGrowthToShrub is incorrect, check updateUserStage')
  });

  it('should emit correct data when new user surpasses first threshold upon receiving praise', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    const result = await instance.givePraise(firstUser, 'Praise one', { from: secondUser })

    const result_user = result.logs[1].args.user

    chai.assert.equal(result_user, firstUser, 'user param in UserGrowthToShrub is incorrect, check updateUserStage')
  });

  it('should emit correct event when new user surpasses second threshold upon receiving praise', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    await instance.givePraise(firstUser, 'Praise', { from: secondUser })
    let eventEmitted = false

    const tx = await instance.givePraise(firstUser, 'Praise', { from: secondUser })

    if (tx.logs[1].event == 'UserGrowthToTree') {
      eventEmitted = true
    }

    chai.assert.isTrue(eventEmitted, 'user param in UserGrowthToTree is incorrect, check updateUserStage')
  });

  it('should emit correct data when new user surpasses second threshold upon receiving praise', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    await instance.givePraise(firstUser, 'Praise one', { from: secondUser })
    const result = await instance.givePraise(firstUser, 'Praise two', { from: secondUser })

    const result_user = result.logs[1].args.user

    chai.assert.equal(result_user, firstUser, 'user param in UserGrowthToTree is incorrect, check updateUserStage')
  });

  it('should update user stage when calling forceUpdateOfUserStage if conditions are met', async function (){
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    await instance.setGrowthThresholds(0, 10, { from: owner })
    await instance.givePraise(firstUser, 'Praise one', { from: secondUser })
    await instance.givePraise(firstUser, 'Praise two', { from: secondUser })
    await instance.givePraise(firstUser, 'Praise three', { from: secondUser })
    await instance.setGrowthThresholds(0, 2, { from: owner })


    const partialUserPraiseData = await instance.viewUserPraiseData(firstUser)
    const partialStage = partialUserPraiseData[1]

    await instance.forceUpdateOfUserStage(firstUser, { from: owner })

    const finalUserPraiseData = await instance.viewUserPraiseData(firstUser)
    const finalStage = finalUserPraiseData[1]
  
    chai.assert.equal(web3.utils.hexToNumber(partialStage), 1, 'stage of the user is updated regardless of not reaching threshold, check updateUserPraise')
    chai.assert.equal(web3.utils.hexToNumber(finalStage), 2, 'stage of the user is not updated after force updating, check forceUpdateOfUserStage')
  });

  it('should emit event when calling forceUpdateOfUserStage if conditions are met', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    await instance.setGrowthThresholds(0, 10, { from: owner })
    await instance.givePraise(firstUser, 'Praise one', { from: secondUser })
    await instance.givePraise(firstUser, 'Praise two', { from: secondUser })
    await instance.givePraise(firstUser, 'Praise three', { from: secondUser })
    await instance.setGrowthThresholds(0, 2, { from: owner })
    let eventEmitted = false

    const tx = await instance.forceUpdateOfUserStage(firstUser, { from: owner })

    if (tx.logs[0].event == 'UserGrowthToTree') {
      eventEmitted = true
    }

    chai.assert.isTrue(eventEmitted, 'event is not emmited when user stage is upgraded, check forceUpdateOfUserStage')
  });

  it('should not emit event when calling forceUpdateOfUserStage if conditions are met', async function () {
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    await instance.setGrowthThresholds(0, 10, { from: owner })
    await instance.givePraise(firstUser, 'Praise one', { from: secondUser })
    await instance.givePraise(firstUser, 'Praise two', { from: secondUser })
    await instance.givePraise(firstUser, 'Praise three', { from: secondUser })
    let eventEmitted = false

    const tx = await instance.forceUpdateOfUserStage(firstUser, { from: owner })

    if (tx.logs != 0) {
      eventEmitted = true
    }

    chai.assert.isFalse(eventEmitted, 'event is emmited even if theuser stage is not upgraded, check forceUpdateOfUserStage')
  });

  it('should not allow someone without admin permissions to call forceUpdateOfUserStage', async function () {
    await catchRevert(instance.forceUpdateOfUserStage(secondUser, { from: firstUser }))
  });

  it('should not allow anoyne without admin permissions to stop the operation of the smart contract', async function (){
    await instance.registerUser(firstUser, { from: owner })
    await catchRevert(instance.emergencyStop({ from: firstUser }))
    await catchRevert(instance.emergencyStop({ from: secondUser }))
  });

  it('should allow someone with admin permissions to stop the operation', async function(){
    await instance.appointAdmin(admin, { from: owner })
    await instance.emergencyStop({ from: admin })

    const stopped = await instance.stopped()

    chai.assert.isTrue(stopped, 'cct is not stopped when stopOperation is called')
  });

  it('should prohibit execution of givePraise when operation is stopped', async function () {
    await instance.appointAdmin(admin, { from: owner })
    await instance.registerUser(firstUser, { from: owner })
    await instance.registerUser(secondUser, { from: owner })
    await instance.emergencyStop({ from: admin })

    await catchRevert(instance.givePraise(firstUser, 'Praise', { from: secondUser }))
  });

  it('should allow someone with admin permissions to resume the operation', async function () {
    await instance.appointAdmin(admin, { from: owner })
    await instance.emergencyStop({ from: admin })
    await instance.resumeOperation({ from: admin })

    const stopped = await instance.stopped()

    chai.assert.isFalse(stopped, 'cct is not stopped when stopOperation is called')
  });

  it('should not allow someone without admin permissions to resume the operation', async function () {
    await instance.appointAdmin(admin, { from: owner })
    await instance.emergencyStop({ from: admin })
    await catchRevert(instance.emergencyStop({ from: firstUser }))
  });
});
