# Avoiding common attacks

## Integer overflow and underflow
SafeMath library by OpenZeppelin is implemented where arithmetic operations are required. This way
over- and underflows are avoided.

## Denial of service with Failed Call
The only calls that are called out of the smart contract are within Praise domain (between Praise
and Administration).

## Denial of Service by Block Gas Limit
Actions executed by smart contracts are not iterating through arrays and thus can not reach gas 
requirement that would exceed maximum allowed gas per block.

## Force sending Ether
None of the smart contracts utilize Ether and can not be impacted by insufficient balance of Ether.

## Transaction ordering and timestamp dependence
If transactions are received out of order, the impact on the service is not critical (the only
unexpected result might be for a user to be promoted to a next stage before the stage thresholds are
updated). So transaction ordering does not present an issue to reliable operation.
There is no timestamp dependency since no methods are reliant upon time.

## Re-entrancy attacks
As with denial of service with failed call, the only calls exiting the smart contracts are within
the platform domain which is carefully deisgned not to have any reentrancy vulnerabilities or
unexpected call faliures.