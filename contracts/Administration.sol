// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

contract Administration {
  mapping (address => bool) private registered;
  mapping (address => mapping (address => bool)) private owners;
  mapping (address => mapping (address => bool)) private admins;
  mapping (address => mapping (address => bool)) private registeredUsers;

  event NewContractRegistration(
    address indexed smartContract,
    address indexed owner
  );

  event OwnershipTransfer(
    address indexed smartContract,
    address indexed oldOwner,
    address indexed newOwner
  );

  event AdministratorAppointed(
    address indexed smartContract,
    address indexed administrator
  );

  event AdministratorDemoted(
    address indexed smartContract,
    address indexed administrator
  );

  event UserRegistered(
    address indexed smartContract,
    address indexed user
  );

  event UserUnregistered(
    address indexed smartContract,
    address indexed user
  );

  constructor() public {
  }

  modifier onlyRegistered{
    require(registered[msg.sender]);
    _;
  }

  modifier onlyContractOwner(address _caller){
    require(owners[msg.sender][_caller]);
    _;
  }

  modifier onlyContractAdmin(address _caller){
    require(admins[msg.sender][_caller] || owners[msg.sender][_caller]);
    _;
  }

  function checkRegistrationStatus(address _contract) external view returns(bool){
    return registered[_contract];
  }

  function checkOwnership(address _tenant) external view returns(bool){
    return owners[msg.sender][_tenant];
  }

  function checkAdministatorship(address _tenant) external view returns(bool){
    return (owners[msg.sender][_tenant] || admins[msg.sender][_tenant]);
  }

  function checkRegisteredUser(address _tenant) external view returns(bool){
    return (
      owners[msg.sender][_tenant] ||
      admins[msg.sender][_tenant] ||
      registeredUsers[msg.sender][_tenant]
    );
  }

  function initialRegistration(address _initialOwner) external returns(bool){
    require(!registered[msg.sender]);
    owners[msg.sender][_initialOwner] = true;
    registered[msg.sender] = true;
    emit NewContractRegistration(msg.sender, _initialOwner);
    return false;
  }

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

  function changeAdminStatus(address _admin, bool _rights) internal returns(bool){
    admins[msg.sender][_admin] = _rights;
    return true;
  }

  function changeRegisteredUsers(address _user, bool _rights) internal returns(bool){
    registeredUsers[msg.sender][_user] = _rights;
    return true;
  }
}
