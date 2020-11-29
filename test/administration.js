let catchRevert = require("./exceptions_helpers.js").catchRevert
var administration = artifacts.require("./Administration.sol");
var chai = require('chai');

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Administration", function (accounts) {

  const smart_contract = accounts[0]
  const owner = accounts[1]
  const admin = accounts[2]
  const registeredUser = accounts[3]
  const unregisteredUser = accounts[4]
  const secondaryOwner = accounts[5]

  beforeEach(async () => {
    instance = await administration.new()
  })

  it("should assert true", async function () {
    await administration.deployed();
    return chai.assert.isTrue(true);
  });

  it("should not allow to appoint admin if contract is not registered", async function () {
    await catchRevert(instance.appointAdmin(owner, admin, { from: smart_contract }))
  });

  it("should change the state of registered on initial registration of previously unregistered contract", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })

    const registered = await instance.checkRegistrationStatus(smart_contract, { from: smart_contract })

    chai.assert.isTrue(registered, 'NewContractRegistration does not set the registred attribute to true for the contract')
  });

  it("should set the owner on initial registration of previously unregistered contract", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })

    const contract_owner = await instance.checkOwnership(owner, { from: smart_contract })

    chai.assert.isTrue(contract_owner, 'NewContractRegistration does not set the owner for the contract')
  });

  it("should should not allow initialRegistration method to be called if the contract is already registered", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })

    await catchRevert(instance.initialRegistration(secondaryOwner, { from: smart_contract }))
  });

  it("should emit the appropriate event on initial registration of previously unregistered contract", async function () {
    const result = await instance.initialRegistration(owner,  {from: smart_contract })

    const result_contract = result.logs[0].args.smartContract
    const result_owner = result.logs[0].args.owner

    chai.assert.equal(smart_contract, result_contract, 'NewContractRegistration event smartContract property not emitted, check initialRegistration method')
    chai.assert.equal(owner, result_owner, 'NewContractRegistration event owner property not emitted, check initialRegistration method')
  });

  it("should transfer the ownership of the contract when initiated by the owner", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.transferOwnership(owner, secondaryOwner, { from: smart_contract })

    const contract_owner = await instance.checkOwnership(secondaryOwner, { from: smart_contract })

    chai.assert.isTrue(contract_owner, 'transferOwnership does not transfer the ownership for the contract')
  });

  it("should revoke old owner's permissions after transfer of ownership", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.transferOwnership(owner, secondaryOwner, { from: smart_contract })

    const previous_owner = await instance.checkOwnership(owner, { from: smart_contract })

    chai.assert.isFalse(previous_owner, 'transferOwnership does not revoke the persmissions of previous owner')
  });

  it("should emit the appropriate event when owner initiates the transfer of ownership", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    const result = await instance.transferOwnership(owner, secondaryOwner, { from: smart_contract })

    const result_contract = result.logs[0].args.smartContract
    const result_old_owner = result.logs[0].args.oldOwner
    const result_new_owner = result.logs[0].args.newOwner

    chai.assert.equal(smart_contract, result_contract, 'OwnershipTransfer event smartContract property not emitted, check transferOwnership method')
    chai.assert.equal(owner, result_old_owner, 'OwnershipTransfer event oldOwner property not emitted, check transferOwnership method')
    chai.assert.equal(secondaryOwner, result_new_owner, 'OwnershipTransfer event newOwner property not emitted, check transferOwnership method')
  });

  it("should allow owner to appoint administrator", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.appointAdmin(owner, admin, { from: smart_contract })

    const result = await instance.checkAdministatorship(admin, { from: smart_contract })

    chai.assert.isTrue(result, "appointAdmin doesn't appoint an administrator")
  });

  it("should emit the appropriate event when owner to appoints an administrator", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    const result = await instance.appointAdmin(owner, admin, { from: smart_contract })

    const result_contract = result.logs[0].args.smartContract
    const result_administrator = result.logs[0].args.administrator

    chai.assert.equal(result_contract, smart_contract, 'AdministratorAppointed event smartContract property not emitted, check appointAdmin method')
    chai.assert.equal(result_administrator, admin, 'AdministratorAppointed event administrator property not emitted, check appointAdmin method')
  });

  it("should allow owner to demote administrator", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.appointAdmin(owner, admin, { from: smart_contract })
    await instance.demoteAdmin(owner, admin, { from: smart_contract })

    const result = await instance.checkAdministatorship(admin, { from: smart_contract })

    chai.assert.isFalse(result, "demoteAdmin doesn't demote an administrator")
  });

  it("should emit the appropriate event when owner to demotes an administrator", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.appointAdmin(owner, admin, { from: smart_contract })
    const result = await instance.demoteAdmin(owner, admin, { from: smart_contract })

    const result_contract = result.logs[0].args.smartContract
    const result_administrator = result.logs[0].args.administrator

    chai.assert.equal(result_contract, smart_contract, 'AdministratorDemoted event smartContract property not emitted, check demoteAdmin method')
    chai.assert.equal(result_administrator, admin, 'AdministratorDemoted event administrator property not emitted, check demoteAdmin method')
  });

  it("should not allow non-owner to appoint administrator", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await catchRevert(instance.appointAdmin(secondaryOwner, admin, { from: smart_contract }))
  });

  it("should not allow appointment of an already existing administrator", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.appointAdmin(owner, admin, { from: smart_contract })
    await catchRevert(instance.appointAdmin(owner, admin, { from: smart_contract }))
  });

  it("should not allow demotion of someone that is not an administrator", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await catchRevert(instance.demoteAdmin(owner, admin, { from: smart_contract }))
  });

  it("should not give administration rights to someone that was not appointed", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })

    const result = await instance.checkAdministatorship(unregisteredUser, { from: smart_contract })

    chai.assert.isFalse(result, 'administratorship right are given to non-appointed accounts')
  });

  it("should give administration rights to owner", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })

    const result = await instance.checkAdministatorship(owner, { from: smart_contract })

    chai.assert.isTrue(result, 'administratorship rights are not given to owner')
  });

  it("should revoke administration rights of owner when ownership is transfered", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.transferOwnership(owner, secondaryOwner, { from: smart_contract })

    const result = await instance.checkAdministatorship(owner, { from: smart_contract })

    chai.assert.isFalse(result, 'administratorship rights persist for owner after the ownership is transferred')
  });

  it("should grant administration rights to new owner when ownership is transfered", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.transferOwnership(owner, secondaryOwner, { from: smart_contract })

    const result = await instance.checkAdministatorship(secondaryOwner, { from: smart_contract })

    chai.assert.isTrue(result, 'administratorship rights are not granted to new owner after the ownership is transferred')
  });

  it("should allow owner to register user", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.registerUser(owner, registeredUser, { from: smart_contract })

    const result = await instance.checkRegisteredUser(registeredUser, { from: smart_contract })

    chai.assert.isTrue(result, 'owner is not allowed to register user')
  });

  it("should allow owner to unregister user", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.registerUser(owner, registeredUser, { from: smart_contract })
    await instance.unregisterUser(owner, registeredUser, { from: smart_contract })

    const result = await instance.checkRegisteredUser(registeredUser, { from: smart_contract })

    chai.assert.isFalse(result, 'owner is not allowed to unregister user')
  });

  it("should allow administrator to register user", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.appointAdmin(owner, admin, { from: smart_contract })
    await instance.registerUser(admin, registeredUser, { from: smart_contract })

    const result = await instance.checkRegisteredUser(registeredUser, { from: smart_contract })

    chai.assert.isTrue(result, 'administrator is not allowed to register user')
  });

  it("should allow administrator to unregister user", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.appointAdmin(owner, admin, { from: smart_contract })
    await instance.registerUser(admin, registeredUser, { from: smart_contract })
    await instance.unregisterUser(admin, registeredUser, { from: smart_contract })

    const result = await instance.checkRegisteredUser(registeredUser, { from: smart_contract })

    chai.assert.isFalse(result, 'administrator is not allowed to unregister user')
  });

  it("should emit the appropriate event when user is registered", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    const result = await instance.registerUser(owner, registeredUser, { from: smart_contract })

    const result_contract = result.logs[0].args.smartContract
    const result_user = result.logs[0].args.user

    chai.assert.equal(result_contract, smart_contract, 'UserRegistered event smartContract property not emitted, check registerUser method')
    chai.assert.equal(result_user, registeredUser, 'UserRegistered event user property not emitted, check registerUser method')
  });

  it("should emit the appropriate event when user is unregistered", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.registerUser(owner, registeredUser, { from: smart_contract })
    const result = await instance.unregisterUser(owner, registeredUser, { from: smart_contract })

    const result_contract = result.logs[0].args.smartContract
    const result_user = result.logs[0].args.user

    chai.assert.equal(result_contract, smart_contract, 'UserUnregistered event smartContract property not emitted, check registerUser method')
    chai.assert.equal(result_user, registeredUser, 'UserUnregistered event user property not emitted, check registerUser method')
  });

  it("should grant registered user permissions to owner", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })

    const result = await instance.checkRegisteredUser(owner, { from: smart_contract })

    chai.assert.isTrue(result, 'owner is not granted registered user privilleges')
  });

  it("should grant registered user permissions to administrator", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.appointAdmin(owner, admin, { from: smart_contract })

    const result = await instance.checkRegisteredUser(admin, { from: smart_contract })

    chai.assert.isTrue(result, 'admin is not granted registered user privilleges')
  });

  it("should not grant registered user permissions to unregistered user", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })

    const result = await instance.checkRegisteredUser(unregisteredUser, { from: smart_contract })

    chai.assert.isFalse(result, 'unregistered user is granted registered user privilleges')
  });

  it("should not permit registered user to register another user", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.registerUser(owner, registeredUser, { from: smart_contract })
    await catchRevert(instance.registerUser(registeredUser, unregisteredUser, { from: smart_contract }))
  });

  it("should not permit registered user to unregister another registered user", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await instance.registerUser(owner, registeredUser, { from: smart_contract })
    await instance.registerUser(owner, unregisteredUser, { from: smart_contract })
    await catchRevert(instance.registerUser(registeredUser, unregisteredUser, { from: smart_contract }))
  });

  it("should not permit unregistered user to register another user", async function () {
    await instance.initialRegistration(owner, { from: smart_contract })
    await catchRevert(instance.registerUser(registeredUser, unregisteredUser, { from: smart_contract }))
  });
});
