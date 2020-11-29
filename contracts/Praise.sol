// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import './Administration.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

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

  event OperationStopped(address indexed executedBy);
  event OperationResumed(address indexed executedBy);
  event FirstGrowthThresholdUpdated(uint256 newGrowthThreshold);
  event SecondGrowthThresholdUpdated(uint256 newGrowthThreshold);
  event NewSeedling(address indexed user);
  event UserGrowthToShrub(address indexed user);
  event UserGrowthToTree(address indexed user);
  event NewPraise(address indexed praiseGiver, address indexed praiseReceiver, string praise);

  modifier onlyWhenOperational{
    require(!stopped);
    _;
  }

  modifier onlyWhenStopped{
    require(stopped);
    _;
  }

  modifier onlyOwner{
    require(administration.checkOwnership(msg.sender));
    _;
  }

  modifier onlyAdmin{
    require(administration.checkAdministatorship(msg.sender));
    _;
  }

  modifier onlyRegisteredUser{
    require(administration.checkRegisteredUser(msg.sender));
    _;
  }

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

  function emergencyStop() public onlyWhenOperational onlyAdmin returns(bool){
    require(toggleOperation());
    return true;
  }

  function resumeOperation() public onlyWhenStopped onlyAdmin returns(bool){
    require(toggleOperation());
    return true;
  }

  function transferOwnership(address _newOwner) public onlyOwner returns(bool){
    require(administration.transferOwnership(msg.sender, _newOwner));
    return true;
  }

  function appointAdmin(address _admin) public onlyOwner returns(bool){
    require(administration.appointAdmin(msg.sender, _admin));
    return true;
  }

  function demoteAdmin(address _admin) public onlyOwner returns(bool){
    require(administration.demoteAdmin(msg.sender, _admin));
    return true;
  }

  function registerUser(address _user) public onlyAdmin returns(bool){
    require(administration.registerUser(msg.sender, _user));
    if(users[_user].totalNumberOfPraises == 0){
      users[_user].stage = Stage.Seedling;
      emit NewSeedling(_user);
    }
    return true;
  }

  function unregisterUser(address _user) public onlyAdmin returns(bool){
    require(administration.unregisterUser(msg.sender, _user));
    return true;
  }

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

  function forceUpdateOfUserStage(address _user) public onlyAdmin returns(bool){
    require(updateUserStage(_user));
    return true;
  }

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

  function toggleOperation() internal returns(bool){
    stopped = !stopped;
    return true;
  }

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
