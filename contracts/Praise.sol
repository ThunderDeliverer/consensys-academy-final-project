// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import './Administration.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

/// @author Jan Turk
/// @title Praise
contract Praise{
  using SafeMath for uint256;

  Administration administration;

  bool public stopped;
  uint256 public firstGrowth;
  uint256 public secondGrowth;

  mapping (address => Users) users;

  enum Stage { Seedling, Shrub, Tree }

  struct Users{
    uint256 totalNumberOfPraises;
    Stage stage;
    mapping (uint256 => Praises) praises;
  }

  struct Praises{
    address praiseGiver;
    string praise;
  }

  /// @notice Event to notify that operation has been stopped
  /// @param executedBy the address of the admin that executed the pause of operation
  event OperationStopped(address indexed executedBy);

  /// @notice Event to notify that operation has been resumed
  /// @param executedBy the address of the admin that executed the resumal of operation
  event OperationResumed(address indexed executedBy);

  /// @notice Event to notify that first growth threshold has been updated
  /// @param newGrowthThreshold new growth threshold value
  event FirstGrowthThresholdUpdated(uint256 newGrowthThreshold);

  /// @notice Event to notify that second growth threshold has been updated
  /// @param newGrowthThreshold new growth threshold value
  event SecondGrowthThresholdUpdated(uint256 newGrowthThreshold);

  /// @notice Event to notify that new user has reached Seedling state
  /// @param user user that reached the state
  event NewSeedling(address indexed user);

  /// @notice Event to notify that new user has reached Shrub state
  /// @param user user that reached the state
  event UserGrowthToShrub(address indexed user);

  /// @notice Event to notify that new user has reached Tree state
  /// @param user user that reached the state
  event UserGrowthToTree(address indexed user);

  /// @notice Event to notify that new praise has been issued
  /// @param praiseGiver user that gave the praise
  /// @param praiseReceiver user that received the praise
  /// @param praise praise that was given
  event NewPraise(address indexed praiseGiver, address indexed praiseReceiver, string praise);

  /// @notice only allows execution it the contract isn't stopped
  modifier onlyWhenOperational{
    require(!stopped);
    _;
  }

  /// @notice only allows execution it the contract is stopped
  modifier onlyWhenStopped{
    require(stopped);
    _;
  }

  /// @notice only allows execution it the caller is contract owner
  modifier onlyOwner{
    require(administration.checkOwnership(msg.sender));
    _;
  }

  /// @notice only allows execution it the caller is contract owner or admin
  modifier onlyAdmin{
    require(administration.checkAdministatorship(msg.sender));
    _;
  }

  /// @notice only allows execution it the caller is contract owner, admin or registered user
  modifier onlyRegisteredUser{
    require(administration.checkRegisteredUser(msg.sender));
    _;
  }

  /// @notice constructor of the smart contract
  /// @param administrationAddress address of the Administration smart contract
  /// @param initialFirstGrowthThreshold value of the initial first growth threshold
  /// @param initialSecondGrowthThreshold value of the initial second growth threshold
  constructor (
    address administrationAddress,
    uint256 initialFirstGrowthThreshold,
    uint256 initialSecondGrowthThreshold
  )
    public
  {
    administration = Administration(administrationAddress);
    administration.initialRegistration(msg.sender);
    firstGrowth = initialFirstGrowthThreshold;
    secondGrowth = initialSecondGrowthThreshold;
  }

  /// @notice used to view user praise data
  /// @param _user address of the user whoose data we are looking at
  /// @return totalNumberOfPraises number of praises that the user received
  /// @return Stage stage that the user reached
  function viewUserPraiseData(
    address _user
  )
    public view
    returns(
      uint256 totalNumberOfPraises,
      Stage
    )
  {
    return(
      users[_user].totalNumberOfPraises,
      users[_user].stage
    );
  }

  /// @notice used to view user's praise
  /// @param _user address of the user whoose data we are looking at
  /// @param _praiseId ID of the praise we are retrieving
  /// @return praiseGiver user that gave praise
  /// @return praise text explaining the praise
  function viewPraise(
    address _user,
    uint256 _praiseId
  )
    public view
    returns(
      address praiseGiver,
      string memory praise
    )
  {
    return(
      users[_user].praises[_praiseId].praiseGiver,
      users[_user].praises[_praiseId].praise
    );
  }

  /// @notice used to stop the operation of the contract
  /// @return successful execution of the function
  function emergencyStop() public onlyWhenOperational onlyAdmin returns(bool){
    require(toggleOperation());
    return true;
  }

  /// @notice used to resume the operation of the contract
  /// @return successful execution of the function
  function resumeOperation() public onlyWhenStopped onlyAdmin returns(bool){
    require(toggleOperation());
    return true;
  }

  /// @notice used to transfer ownership of the contract
  /// @param _newOwner address to receive the ownership of the contract
  /// @return successful executipn of the contract
  function transferOwnership(address _newOwner) public onlyOwner returns(bool){
    require(administration.transferOwnership(msg.sender, _newOwner));
    return true;
  }

  /// @notice used to appoin administrator of the contract
  /// @param _admin address to receive the administratorship of the contract
  /// @return successful executipn of the contract
  function appointAdmin(address _admin) public onlyOwner returns(bool){
    require(administration.appointAdmin(msg.sender, _admin));
    return true;
  }

  /// @notice used to demote administrator of the contract
  /// @param _admin address to have the administratorship of the contract revoked
  /// @return successful executipn of the contract
  function demoteAdmin(address _admin) public onlyOwner returns(bool){
    require(administration.demoteAdmin(msg.sender, _admin));
    return true;
  }

  /// @notice used to register user of the contract
  /// @param _user address to receive the registered user rights of the contract
  /// @return successful executipn of the contract
  function registerUser(address _user) public onlyAdmin returns(bool){
    require(administration.registerUser(msg.sender, _user));
    if(users[_user].totalNumberOfPraises == 0){
      users[_user].stage = Stage.Seedling;
      emit NewSeedling(_user);
    }
    return true;
  }

  /// @notice used to unregister user of the contract
  /// @param _user address to loose the registered user rights of the contract
  /// @return successful executipn of the contract
  function unregisterUser(address _user) public onlyAdmin returns(bool){
    require(administration.unregisterUser(msg.sender, _user));
    return true;
  }

  /// @notice used to set new growth thresholds
  /// @dev if input value is set to 0, then the threshold value is not updated
  /// @param _firstGrowth value to be set for first growth threshold
  /// @param _secondGrowth value to be set for second growth threshold
  /// @return successful execution of the contract
  function setGrowthThresholds(
    uint256 _firstGrowth,
    uint256 _secondGrowth
  )
    public
    onlyAdmin
    returns(bool)
  {
    require(
      _secondGrowth > _firstGrowth || (_secondGrowth == 0 && _firstGrowth < secondGrowth)
    );
    if(_firstGrowth != 0 && _firstGrowth != firstGrowth){
      firstGrowth = _firstGrowth;
      emit FirstGrowthThresholdUpdated(_firstGrowth);
    }
    if(_secondGrowth != 0 && _secondGrowth != secondGrowth){
      secondGrowth = _secondGrowth;
      emit SecondGrowthThresholdUpdated(_secondGrowth);
    }
    return true;
  }

  /// @notice used to force the update od the stage of the user is the growth params have been changed and the user stage should be higher
  /// @param _user address that has to have stage updated
  /// @return successful execution of the function
  function forceUpdateOfUserStage(address _user) public onlyAdmin returns(bool){
    require(updateUserStage(_user));
    return true;
  }

  /// @notice used to give praise from one user to another
  /// @dev user can not give praise to self
  /// @dev usregistered users can not receive or give praises
  /// @param _user address to receive praise
  /// @param _praise text explaining the praise
  /// @return successful execution of the contract
  function givePraise(
    address _user,
    string memory _praise
  )
    public
    onlyRegisteredUser onlyWhenOperational
    returns(bool)
  {
    require(msg.sender != _user);
    require(administration.checkRegisteredUser(_user));
    users[_user].praises[users[_user].totalNumberOfPraises].praiseGiver = msg.sender;
    users[_user].praises[users[_user].totalNumberOfPraises].praise = _praise;
    users[_user].totalNumberOfPraises = users[_user].totalNumberOfPraises.add(1);
    emit NewPraise(msg.sender, _user, _praise);
    require(updateUserStage(_user));
    return true;
  }

  /// @notice toggles the operation stage of the contract
  /// @return successful execution of the contract
  function toggleOperation() internal returns(bool){
    stopped = !stopped;
    return true;
  }

  /// @notice used to update the stage of the user
  /// @dev this is used in multiple other functions and should just ignore users that do not require stage update
  /// @param _user address that is being checked for stage update
  /// @return successful execution of the function
  function updateUserStage(address _user) internal returns(bool){
    if(users[_user].stage == Stage.Shrub && users[_user].totalNumberOfPraises >= secondGrowth){
      users[_user].stage = Stage.Tree;
      emit UserGrowthToTree(_user);
    }
    else if(
      users[_user].stage == Stage.Seedling && users[_user].totalNumberOfPraises >= firstGrowth
    )
    {
      users[_user].stage = Stage.Shrub;
      emit UserGrowthToShrub(_user);
    }
    return true;
  }
}
