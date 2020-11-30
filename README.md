# Consensys academy final project: Praise

## Table of contents
- [Consensys academy final project: Praise](#consensys-academy-final-project-praise)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
    - [Basic operation](#basic-operation)
    - [Administrative operations](#administrative-operations)
  - [Smart contracts](#smart-contracts)
    - [Praise.sol](#praisesol)
    - [Administration.sol](#administrationsol)
  - [Libraries](#libraries)
  - [Directory structure](#directory-structure)
  - [Build instructions](#build-instructions)
  - [Other resources](#other-resources)

## Introduction
Praise project aims to give the users the ability to complement each other on jobs well done. It is
inspired by [Infinum](infinum.com) internal praise giving system that allows employees to tag other
employees and praise them for job well done.

My project introduces user growth presented in three stages; from a mere Seedling growing into a
promising Shrub and finally into a mighty Tree. Progression through stages is achieved when praises
from other users are received. Each praise means one step closer to the next stage of growth.

Only registered users can receive and give praises to limit the ability to cheat the system and
praises can not be given to self.

Praises consist of user that receives the praise and the reason why the praise was given. The praise
giver is visible and bound to the praise as well.

### Basic operation
1. Once the smart contracts are deployed, the owner registeres the user.
2. User can write a praise for another registered user and send it to them using the other user's
address
3. The praise can be seen by anyone an the praise receiver's state is updated

### Administrative operations
Each administrative tier can do everything that the tier lower than that tier can do.

These are defined administrative tiers (descending in access rights):
1. owner
2. administrator
3. registered user
4. unregistered user

Based on the tier they are present in:

owners can:
* transfer ownership
* addpoint and demote administartors

administrators can:
* register and unregister users
* set growth thresholds
* stop and resume operation of the smart contract in emergency

registered users can:
* give and receive praises

unregistered users can:
* view praises
* view state of users


## Smart contracts
Project consists of two interacting smart contract. The core of the platform is **Praise.sol** and
auxiliary smart contract, neccessary for the firs one to work, **Administration.sol**.

### Praise.sol
The main logic smart contract is **Praise.sol**. It contains data storage of the praises for the
users as well as the business logic on how users send praises and how they progress through stages.
It uses Circuit breaker design pattern, SafeMath computation when counting the total number of
praises the user receives and access control provided by **Administration.sol**.

### Administration.sol
Access control is provided by **Administration.sol**. The reason why this is a selfstanding contract
is, that is can provide access control to as many smart contracts as our ecosystem requires and more.

## Libraries
**SafeMath** OpenZeppelin library is used to guard against owerflows on total number of praises
conter that each user of the platform is assigned.

## Directory structure
* **client** directory contains files required to run the front end interface of the DAPP

* **contracts** directory contains smart contracts that are used in the project

* **migrations** directory contains deploy instructions that are passed to `truffle migrate` to
properly deploy the smart contracts

* **test** directory contains test for the smart contracts to check for expected behaviour and are
written in JavaScript

## Build instructions
To deploy the smart contracts locally use commands in root directory of the project:
```
ganache-cli
truffle compile
truffle migrate
```
To deploy smart contracts on Ropsten testnet use in root directory of the project:
```
truffle compile
truffle migrate --network ropsten
```
If you wish to run the client, you have to first move into client directory from root project directory:
```
cd client
```
and then install necessary dependencies and run the client:
```
npm install
npm run
```
The client interface is the accessible on *localhost:3000* or another URL if you specified it
differently.

If you modify any of the functions of the smart contracts don't forget to run
```
ganache-cli
truffle test
```
in order to test that the smart contracts still behave as expected.

## Other resources
Design pattern decisions can be found in [design_pattern_decisions.md](./design_pattern_decisions.md).

Security steps taken and measures implemented for avoiding common atack can be founf in
[avoiding_common_attacks.md](./avoiding_common_attacks.md)

Addressed of the smart contracts on Ropsten network can be found in [deployed_addresses.txt](./deployed_addresses.txt)

Video showcasing the operation of the DAPP can be found [here](https://youtu.be/ZZVXzlYSZjk).