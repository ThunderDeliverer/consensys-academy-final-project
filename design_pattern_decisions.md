# Design pattern decisions

## Restricting access
Access to all of the functions that change state is restricted and powered by **Administration.sol**.
This way no malicious user can come and corrupt our praise data and if one of the legitimate users
is compromised, the access for that account can be revoked.

Implementing self standing access control means that multiple smart contracts can use the same access
control provider without having their data accidentally mixed or corrupted.

Only smart contract can modify it's own access control and it uses interface of the **Administration.sol**
to do so.

## Circuit breaker
**Praise.sol** has circuit breaker design implemented into its operation. It ensures that giving
praises can temporarily be paused if a malicious user gains access to the smart contract or if an
exploit is found.

All of the administrative and view functions are operational in case of operation pause, so that the
issues can be resolved and that the state of the smart contract and actions upon it are as
transparent as possible.

## Reasoning behind not using other design patterns

### Auto deprecation
Auto deprecation design pattern doesn't make sense in this use case, since we want to encourage
users to do their best and grow over time and there are no actions that would become obsolete in the
future.

### Mortal
Since we want to have praise data available and presentable to the user as long as the service is
running and even if we migrate to a newer version of the smart contract we have no need for Mortal
design pattern.

### Withdrawal pattern
No monetary transactions are present in this use case and this means there is no need for Withdrawal
design pattern.

### State machine
We want all of the praises to be public and visible to everyone therefore it doesn't make sense to
implement State machine design pattern.

### Speed bump
We want as many users to do their best as we can this is why we do not want to slow them down. If a
team of 10 people did great, we want them all to receive a praise and want a single person to be
able to do it. Speed bump design pattern would degrade the user experience in this case.