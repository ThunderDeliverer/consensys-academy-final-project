const Administration = artifacts.require("Administration");
const Praise = artifacts.require("Praise");

module.exports = function (deployer) {
  // deployer.deploy(Administration);
  // deployer.deploy(Praise);
  deployer.deploy(Administration).then(function() {
    return deployer.deploy(Praise, Administration.address, 1, 2);
  });
};
