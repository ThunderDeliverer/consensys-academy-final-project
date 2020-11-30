// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

/// @author Jan Turk
/// @title Administration
contract Administration {
  mapping (address => bool) private registered;
  mapping (address => mapping (address => bool)) private owners;
  mapping (address => mapping (address => bool)) private admins;
  mapping (address => mapping (address => bool)) private registeredUsers;

  /// @notice Event to notify listeners of new contract that will use the administration
  /// @param smartContract the contract that started using the administration
  /// @param owner the owner of the contract 
  event NewContractRegistration(
    address indexed smartContract,
    address indexed owner
  );

  /// @notice Event to notify listeners of ownership trandfer of one of the contracts
  /// @param smartContract the contract of which the ownership was transferred
  /// @param oldOwner the old owner of the contract
  /// @param newOwner the new owner of the contract
  event OwnershipTransfer(
    address indexed smartContract,
    address indexed oldOwner,
    address indexed newOwner
  );

  /// @notice Event to notify listeners that one of the contracts had an admin appointed
  /// @param smartContract the contract which got new administrator appointed
  /// @param administrator the new administrator of the contract
  event AdministratorAppointed(
    address indexed smartContract,
    address indexed administrator
  );

  /// @notice Event to notify listeners that one of the contracts had an admin demoted
  /// @param smartContract the contract which got an administrator demoted
  /// @param administrator the administrator of the contract that got demoted
  event AdministratorDemoted(
    address indexed smartContract,
    address indexed administrator
  );

  /// @notice Event to notify listeners that one of the contracts had a new user registered
  /// @param smartContract the contract which got new user registered
  /// @param user the new user of the contract
  event UserRegistered(
    address indexed smartContract,
    address indexed user
  );

  /// @notice Event to notify listeners that one of the contracts had a user unregistered
  /// @param smartContract the contract which got user unregistered
  /// @param user the user of the contract that was unregistered
  event UserUnregistered(
    address indexed smartContract,
    address indexed user
  );

  constructor() public {
  }

  /// @notice Checks wether the smart contract is registered in Administration
  /// @dev Used so that the owner can be set by anyone the first time the owner is set for the contract
  modifier onlyRegistered{
    require(registered[msg.sender]);
    _;
  }

  /// @notice Checks whether the caller is the owner of the contract
  /// @param _caller The address to be checked for permissions
  modifier onlyContractOwner(address _caller){
    require(owners[msg.sender][_caller]);
    _;
  }

  /// @notice Checks wether the caller is the owner or the administrator of the contract
  /// @param _caller The address to be checked for permissions
  modifier onlyContractAdmin(address _caller){
    require(admins[msg.sender][_caller] || owners[msg.sender][_caller]);
    _;
  }

  /// @notice Checks wether the caller is the owner, administrator or the registered user of the contract
  /// @param _contract The address to be checked for permissions
  function checkRegistrationStatus(address _contract) external view returns(bool){
    return registered[_contract];
  }

  /// @notice Checks wether the caller is the owner
  /// @param _tenant The address to be checked for permissions
  /// @return Confirmation of restriction of the permissions
  function checkOwnership(address _tenant) external view returns(bool){
    return owners[msg.sender][_tenant];
  }

  /// @notice Checks wether the caller is the owneror  administrator  of the contract
  /// @param _tenant The address to be checked for permissions
  /// @return Confirmation of restriction of the permissions
  function checkAdministatorship(address _tenant) external view returns(bool){
    return (owners[msg.sender][_tenant] || admins[msg.sender][_tenant]);
  }

  /// @notice Checks wether the caller is the owner, administrator or the registered user of the contract
  /// @param _tenant The address to be checked for permissions
  /// @return Confirmation of restriction of the permissions
  function checkRegisteredUser(address _tenant) external view returns(bool){
    return (
      owners[msg.sender][_tenant] ||
      admins[msg.sender][_tenant] ||
      registeredUsers[msg.sender][_tenant]
    );
  }

  /// @notice Seths the owner and registered the contract to Administration
  /// @param _initialOwner The address of the owner of the smart contract being registered
  /// @return Confirmation of successful execution
  function initialRegistration(address _initialOwner) external returns(bool){
    require(!registered[msg.sender]);
    owners[msg.sender][_initialOwner] = true;
    registered[msg.sender] = true;
    emit NewContractRegistration(msg.sender, _initialOwner);
    return false;
  }

  /// @notice Transfer the ownershp of the contract
  /// @param _caller The address that initiated the transfer of ownership
  /// @param _newOwner The address to receive ownership of the contract
  /// @return Confirmation of successful execution
  function transferOwnership(
    address _caller,
    address _newOwner
  )
    external
    onlyRegistered onlyContractOwner(_caller)
    returns(bool)
  {
    owners[msg.sender][_caller] = false;
    owners[msg.sender][_newOwner] = true;
    emit OwnershipTransfer(msg.sender, _caller, _newOwner);
    return true;
  }

  /// @notice Appoint admin of the contract
  /// @param _caller The address that initiated the appointment
  /// @param _admin The address to receive administratorship of the contract
  /// @return Confirmation of successful execution
  function appointAdmin(
    address _caller,
    address _admin
  )
    external
    onlyRegistered onlyContractOwner(_caller)
    returns(bool)
  {
    require(!admins[msg.sender][_admin]);
    require(changeAdminStatus(_admin, true));
    emit AdministratorAppointed(msg.sender, _admin);
    return true;
  }

  /// @notice Demote admin of the contract
  /// @param _caller The address that initiated the demotion
  /// @param _admin The address to have administratorship of the contract revoked
  /// @return Confirmation of successful execution
  function demoteAdmin(
    address _caller,
    address _admin
  )
    external
    onlyRegistered onlyContractOwner(_caller)
    returns(bool)
  {
    require(admins[msg.sender][_admin]);
    require(changeAdminStatus(_admin, false));
    emit AdministratorDemoted(msg.sender, _admin);
    return true;
  }

  /// @notice Register user of the contract
  /// @param _caller The address that initiated the registration
  /// @param _user The address to be a registered user of the contract
  /// @return Confirmation of successful execution
  function registerUser(
    address _caller,
    address _user
  )
    external
    onlyRegistered onlyContractAdmin(_caller)
    returns(bool)
  {
    require(!registeredUsers[msg.sender][_user]);
    require(changeRegisteredUsers(_user, true));
    emit UserRegistered(msg.sender, _user);
    return true;
  }

  /// @notice Register user of the contract
  /// @param _caller The address that initiated the registration
  /// @param _user The address to be unregistered as a user of the contract
  /// @return Confirmation of successful execution
  function unregisterUser(
    address _caller,
    address _user
  )
    external
    onlyRegistered onlyContractAdmin(_caller)
    returns(bool)
  {
    require(registeredUsers[msg.sender][_user]);
    require(changeRegisteredUsers(_user, false));
    emit UserUnregistered(msg.sender, _user);
    return true;
  }

  /// @notice Change state of the administrator rights
  /// @dev This is an internal function so that the external calls coming in are easier to discern
  /// @param _admin The address to have admin rights changed
  /// @param _rights The bool that marks _admin as administrator or not
  /// @return Confirmation of successful execution
  function changeAdminStatus(address _admin, bool _rights) internal returns(bool){
    admins[msg.sender][_admin] = _rights;
    return true;
  }

  /// @notice Change state of the registered user rights
  /// @dev This is an internal function so that the external calls coming in are easier to discern
  /// @param _user The address to have user rights changed
  /// @param _rights The bool that marks _user as registered or not
  /// @return Confirmation of successful execution
  function changeRegisteredUsers(address _user, bool _rights) internal returns(bool){
    registeredUsers[msg.sender][_user] = _rights;
    return true;
  }
}
