import React, { Component } from "react";
import PraiseContract from "./contracts/Praise.json";
import {
  Blockie,
  Box,
  Button,
  Checkbox,
  EthAddress,
  Form,
  Field,
  Flex,
  Heading,
  Input,
  Loader,
  MetaMaskButton,
  Radio,
  Select,
  Text,
  Textarea
} from "rimble-ui";
import getWeb3 from "./getWeb3";
import Web3 from "web3";

import "./App.css";

class App extends Component {
  state = {
    web3: null,
    account: '0x0',
    contract: null ,
    contractAddress: '0x0',
    stage: '',
    totalNumberOfPraises: '',
    praiseGiver: '0x0',
    praise: ''
  }

  // componentDidMount = async () => {
  //   try {
  //     // Get network provider and web3 instance.
  //     // const web3 = await getWeb3();
  //     const web3 = new Web3(web3.currentProvider);

  //     // Use web3 to get the user's accounts.
  //     const accounts = await web3.eth.getAccounts();

  //     // Get the contract instance.
  //     const networkId = await web3.eth.net.getId();
  //     const deployedNetwork = PraiseContract.networks[networkId];
  //     const instance = new web3.eth.Contract(
  //       PraiseContract.abi,
  //       deployedNetwork && deployedNetwork.address,
  //     );

  //     // Set web3, accounts, and contract to the state, and then proceed with an
  //     // example of interacting with the contract's methods.
  //     // this.setState({ web3, accounts, contract: instance }, this.runExample);
  //   } catch (error) {
  //     // Catch any errors for any of the above operations.
  //     alert(
  //       `Failed to load web3, accounts, or contract. Check console for details.`,
  //     );
  //     console.error(error);
  //   }
  // };

  viewOwnState = async () => {
    const { account, contract } = this.state;

    // Stores a given value, 5 by default.
    // await contract.methods.set(5).send({ from: accounts[0] });
    // // Get the value from the contract to prove it worked.
    // const response = await contract.methods.get().call();
    const response = await contract.methods.viewUserPraiseData(account[0]).call();
    if(response[1] == 2){
      this.setState({
        totalNumberOfPraises: response[0],
        stage: 'Tree'
      });
    } else if (response[1] == 1){
      this.setState({
        totalNumberOfPraises: response[0],
        stage: 'Shrub'
      });
    } else {
      this.setState({
      totalNumberOfPraises: response[0],
      stage: 'Seedling'
      });
    }
    // // Update state with the result.
    // this.setState({ storageValue: response });
  };

  viewLatestPraise = async () => {
    const { account, contract } = this.state;

    // Stores a given value, 5 by default.
    // await contract.methods.set(5).send({ from: accounts[0] });

    // // Get the value from the contract to prove it worked.
    // const response = await contract.methods.get().call();
    const initialResponse = await contract.methods.viewUserPraiseData(account[0]).call();
    const response = await contract.methods.viewPraise(account[0], (initialResponse[0] - 1)).call();

    this.setState({ praiseGiver: response[0], praise: response[1] });
    // // Update state with the result.
    // this.setState({ storageValue: response });
  };

  // handleClick = async () => {
  //   const contract = this.state.contract;
  //   const accounts = this.state.accounts;

  //   const response = await contract.methods.viewUserPraiseData(accounts[0]).call({ from: accounts[0] });

  //   this.setState({ numberOfPraises: response[0] });
  // }

  connectToMetamask = async () => {
    try {
      // Get network provider and web3 instance.
      // const web3 = await getWeb3();
      const web3 = new Web3(window.web3.currentProvider);

      // Use web3 to get the user's accounts.
      const account = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = PraiseContract.networks[networkId];
      const instance = new web3.eth.Contract(
        PraiseContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, account, contract: instance , contractAddress: deployedNetwork.address});
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }

  submitPraise = async () => {
    const { account, contract } = this.state;
    const praisee = document.getElementById('inputReceiver').value;
    const praiseToGive = document.getElementById('inputPraise').value;
    // Stores a given value, 5 by default.
    // await contract.methods.set(5).send({ from: accounts[0] });

    // // Get the value from the contract to prove it worked.
    // const response = await contract.methods.get().call();
    await contract.methods.givePraise(praisee, praiseToGive).send({ from: account[0]});

    // // Update state with the result.
    // this.setState({ storageValue: response });
  }

  submitOwnershipTransfer = async () => {
    const { account, contract } = this.state;
    const newOwner = document.getElementById('inputOwner').value;

    await contract.methods.transferOwnership(newOwner).send({ from: account[0] });
  }

  submitAppontAdmin = async () => {
    const { account, contract } = this.state;
    const newAdmin = document.getElementById('inputAdminToPromote').value;

    await contract.methods.appointAdmin(newAdmin).send({ from: account[0] });
  }

  submitDemoteAdmin = async () => {
    const { account, contract } = this.state;
    const oldAdmin = document.getElementById('inputAdminToDemote').value;

    await contract.methods.demoteAdmin(oldAdmin).send({ from: account[0] });
  }

  submitUserRegistration = async () => {
    const { account, contract } = this.state;
    const newUser = document.getElementById('inputUserToRegister').value;

    await contract.methods.registerUser(newUser).send({ from: account[0] });
  }

  submitUserRegistration = async () => {
    const { account, contract } = this.state;
    const newUser = document.getElementById('inputUserToRegister').value;

    await contract.methods.registerUser(newUser).send({ from: account[0] });
  }

  submitUserUnregistration = async () => {
    const { account, contract } = this.state;
    const oldUser = document.getElementById('inputUserToUnregister').value;

    await contract.methods.unregisterUser(oldUser).send({ from: account[0] });
  }

  submitUpdateGrowthThresholds = async () => {
    const { account, contract } = this.state;
    const newFirst = document.getElementById('inputFirstThreshold').value;
    const newSecond = document.getElementById('inputSecondThreshold').value;

    await contract.methods.setGrowthThresholds(newFirst, newSecond).send({ from: account[0] })
  }

  fetchCurrentThresholds = async () => {
    const { account, contract } = this.state;
    const firstGrowth = await contract.methods.firstGrowth().call();
    const secondGrowth = await contract.methods.secondGrowth().call();

    this.setState({ firstThreshold: firstGrowth, secondThreshold: secondGrowth })
  }

  initiateEmergencyStop = async () => {
    const { account, contract } = this.state;

    await contract.methods.emergencyStop().send({ from: account[0] })
  }

  initiateResumeOfOperation = async () => {
    const { account, contract } = this.state;

    await contract.methods.resumeOperation().send({ from: account[0] })
  }

  render() {
    // if (!this.state.web3) {
    //   return (
    //     <div>
    //       <Text>Loading Web3, accounts, and contract...</Text>
    //       <Loader size="80px" /> 
    //     </div>
    //   );
    // }
    return (
      <div className="App">
        <div>
          <Flex>
            <Box p={3} width={1 / 9}></Box>
            <Box p={3} width={6 / 9}>
              <EthAddress address={this.state.account[0]}/>
            </Box>
            <Box p={3} width={2 / 9}>
              <span onClick={this.connectToMetamask.bind(this)}><MetaMaskButton.Outline>Connect with MetaMask</MetaMaskButton.Outline></span>
            </Box>
          </Flex>
          <Box>
            <Heading>Profile</Heading>
            <Text>Number of praises received: {this.state.totalNumberOfPraises}</Text>
            <Text>Stage reached: {this.state.stage}</Text>
          </Box>
          <span onClick={this.viewOwnState.bind(this)}>
            <Button>Check own state</Button>
          </span>
        </div>
        <div>
          <Box>
            <Heading>Latest praise</Heading>
            <Text>Praise giver: {this.state.praiseGiver}</Text>
            <Text>Praise: {this.state.praise}</Text>
          </Box>
          <span onClick={this.viewLatestPraise.bind(this)}>
            <Button>Check latest praise for self</Button>
          </span>
        </div>
        <div>
          <Heading>Give praise</Heading>
          <Box>
            <Box>
              <Field label="Give praise to:">
                <Input
                  type='text'
                  required = {true}
                  placeholder = 'address'
                  id='inputReceiver'
                />
              </Field>
            </Box>
            <Box>
              <Field label='Praise:' heigth={8}>
                <Textarea
                  placeholder = "Write your praise..."
                  required = {true}
                  id='inputPraise'
                />
              </Field>
            </Box>
          </Box>
          <Box>
            <Button onClick={this.submitPraise.bind(this)}>
              Submit Praise
            </Button>
          </Box>
        </div>

        <div className="Administration">
          <Heading>Administrative functions</Heading>
          <Flex>
            <Box p={2} width={1 / 2}>
              <Box>
                <Heading>Emergency stop</Heading>
                <Button onClick={this.initiateEmergencyStop.bind(this)}>STOP</Button>
              </Box>
            </Box>
            <Box p={2} width={1 / 2}>
              <Box>
                <Heading>Resume operation</Heading>
                <Button onClick={this.initiateResumeOfOperation.bind(this)}>RESUME</Button>
              </Box>
            </Box>
          </Flex>
          <Flex>
            <Box p={2} width={1 / 2}>
              <Heading>Transfer ownership</Heading>
              <Box>
                <Field label="New owner:">
                  <Input
                    type='text'
                    required={true}
                    placeholder='address'
                    id='inputOwner'
                  />
                </Field>
              </Box>
              <Box>
                <Button onClick={this.submitOwnershipTransfer.bind(this)}>
                  Submit ownership transfer
              </Button>
              </Box>
            </Box>
            <Box p={2} width={1 / 2}>
              <Heading>Appoint administrator</Heading>
              <Box>
                <Field label="Address to manage:">
                  <Input
                    type='text'
                    required={true}
                    placeholder='address'
                    id='inputAdminToPromote'
                  />
                </Field>
              </Box>
              <Box>
                <Button onClick={this.submitAppontAdmin.bind(this)}>
                  Appoint admin
              </Button>
              </Box>
            </Box>
            <Box p={2} width={1 / 2}>
              <Heading>Demote administrator</Heading>
              <Box>
                <Field label="Address to manage:">
                  <Input
                    type='text'
                    required={true}
                    placeholder='address'
                    id='inputAdminToDemote'
                  />
                </Field>
              </Box>
              <Box>
                <Button onClick={this.submitDemoteAdmin.bind(this)}>
                  Demote admin
              </Button>
              </Box>
            </Box>
          </Flex>
          <Flex>
            <Box p={2} width={1 / 2}>
              <Box>
                <Heading>Register user</Heading>
                <Box>
                  <Field label="New user:">
                    <Input
                      type='text'
                      required={true}
                      placeholder='address'
                      id='inputUserToRegister'
                    />
                  </Field>
                </Box>
                <Box>
                  <Button onClick={this.submitUserRegistration.bind(this)}>
                    Submit user registration
                </Button>
                </Box>
              </Box>
            </Box>
            <Box p={2} width={1 / 2}>
              <Box>
                <Heading>Unregister user</Heading>
                <Box>
                  <Field label="Existing user:">
                    <Input
                      type='text'
                      required={true}
                      placeholder='address'
                      id='inputUserToUnregister'
                    />
                  </Field>
                </Box>
                <Box>
                  <Button onClick={this.submitUserUnregistration.bind(this)}>
                    Submit user unregistration
                </Button>
                </Box>
              </Box>
            </Box>
          </Flex>
          <Flex>
            <Box p={2} width={1 / 2}>
              <Box>
                <Heading>Set growth thresholds</Heading>
                <Box>
                  <Field label="First growth threshold:">
                    <Input
                      type='number'
                      required={true}
                      placeholder='Input 0 for this field to be ignored'
                      id='inputFirstThreshold'
                    />
                  </Field>
                  <Field label="Second growth threshold:">
                    <Input
                      type='number'
                      required={true}
                      placeholder='Input 0 for this field to be ignored'
                      id='inputSecondThreshold'
                    />
                  </Field>
                </Box>
                <Box>
                  <Button onClick={this.submitUpdateGrowthThresholds.bind(this)}>
                    Submit update of growth thresholds
                </Button>
                </Box>
              </Box>
            </Box>
            <Box p={2} width={1 / 2}>
              <Box>
                <Heading>Current thresholds</Heading>
                <Box>First growth threshold: {this.state.firstThreshold}</Box>
                <Box>Second growth threshold: {this.state.secondThreshold}</Box>
                <Box>
                  <Button onClick={this.fetchCurrentThresholds.bind(this)}>
                    Fetch current thresholds
                </Button>
                </Box>
              </Box>
            </Box>
          </Flex>
        </div>
      </div>
    );
  }
}

export default App;
