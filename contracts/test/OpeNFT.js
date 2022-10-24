const {
    expect
} = require("chai");
const crypto = require('crypto-js');
const sha256 = require('crypto-js/sha256');
const { ethers } = require("hardhat");
const Web3 = require('web3');
const web3 = new Web3();

// TODO: test NFT transfers, approvals, ...

describe("OpeNFT", function () {

    let OpeNFT, OpeNFTSC;
    let owner, alice, bob, carla, mallory;

    before(async function () {
        // Create an owner and a malicious actor, mallory
        [owner, alice, bob, carla, mallory] = await ethers.getSigners();
        // transform owner to cryptojs.WordArray
        console.log(owner.address, "SC owner's address")

        // Load the SC
        OpeNFTSC = await ethers.getContractFactory("OpeNFT");
        // Deploy the SC
        OpeNFT = await OpeNFTSC.connect(owner).deploy();

    });

    // @Gal
    it("Alice timestamps NFT ID", async function () {
        // Compute the asset id
        // @Gal: asset id je hash file-a, ki ga uporabnik uploada (SHA-256)
        let _assetId = sha256("This is my first Verifiable NFT!");
        let assetId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _assetId.toString());
        let nftId = assetId;
        // Timestamp the NFT id
        // @Gal: podpis z walletom
        await OpeNFT.connect(alice).timestamp(nftId);
    });

    it("Alice timestamps NFT ID 2x", async function () {
        // Compute the asset id
        let _assetId = sha256("This is my second Verifiable NFT");
        let assetId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _assetId.toString());
        let nftId = assetId;
        // Timestamp the NFT id
        await OpeNFT.connect(alice).timestamp(nftId)
        await expect(OpeNFT.connect(alice).timestamp(nftId)).to.be.revertedWith('Notice: NFT id is already timestamped');
    });

    it("Alice and Mallory timestamp same NFT ID", async function () {
        // Compute the asset id
        let _assetId = sha256("This is my third Verifiable NFT");
        let assetId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _assetId.toString());
        let nftId = assetId;
        // Timestamp the NFT id
        await OpeNFT.connect(alice).timestamp(nftId)
        await expect(OpeNFT.connect(mallory).timestamp(nftId)).to.be.revertedWith('Notice: NFT id is already timestamped');
    });

    it("Alice timestamps NFT ID and reads the timestamp", async function () {
        // Compute the asset id
        let _assetId = sha256("This is my fourth Verifiable NFT");
        let assetId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _assetId.toString());
        let nftId = assetId;
        // Timestamp the NFT id
        await OpeNFT.connect(alice).timestamp(nftId);
        await OpeNFT.connect(alice).getTimestamp(nftId);
        // console.log(await OpeNFT.connect(alice).getTimestamp(nftId));
        await OpeNFT.connect(mallory).getTimestamp(nftId)
    });

    // @Gal
    it("Alice timestamps NFT ID and mints an NFT", async function () {
        let _alice = crypto.enc.Hex.parse(alice.address.replace('0x', ''));

        // Compute the asset id
        // asset id je sha256 objekta, ki ga uporabnik uploada
        let _assetId = sha256("This is my 5. Verifiable NFT");
        let assetId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _assetId.toString());

        // Compute the authorship statement id
        // Authorship statement
        /**
         * {
         *   "address":"<address wallet-a, ki je naredil timestamp>",
         *   "assetId": "<asset_id>"
         *   "secret": "<random hex string>"
         * }
         */
        var _asId = sha256("@Alice Wonderland");
        let asId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _asId.toString());

        // Compute the verifiable asset id
        let _verifiableAssetId = sha256(_assetId.concat(_asId));

        // Compute the NFT ID
        let _nid = _alice.concat(_verifiableAssetId)
        let _nftId = sha256(_nid)
        let nftId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _nftId.toString());

        // Timestamp the NFT id
        await OpeNFT.connect(alice).timestamp(nftId)

        // Get timestamp info
        expect(await OpeNFT.getTimestamp(nftId)).to.equal(8)

        // Mint NFT
        await OpeNFT.connect(alice).safeMint(bob.address, assetId, asId, "https://api.openft.world")

    });

    it("Alice timestamps NFT and Mallory tries to mint it", async function () {
        let _alice = crypto.enc.Hex.parse(alice.address.replace('0x', ''));
        // Compute the asset id
        let _assetId = sha256("This is my 6. Verifiable NFT");
        let assetId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _assetId.toString());

        // Compute the authorship statement id
        var _asId = sha256("@Alice Wonderland 1");
        let asId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _asId.toString());

        // Compute the verifiable asset id
        let _verifiableAssetId = sha256(_assetId.concat(_asId));

        // Compute the NFT ID
        let _nid = _alice.concat(_verifiableAssetId)
        let _nftId = sha256(_nid)
        let nftId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _nftId.toString());
        // console.log("nftId:", nftId)

        // Timestamp the NFT id
        await OpeNFT.connect(alice).timestamp(nftId)
        // Mallory will fail to compute the asset id as his address is incorrect
        await expect(OpeNFT.connect(mallory).safeMint(bob.address, assetId, asId, "https://api.openft.world")).to.be.revertedWith("Error. NFT ID is not timestamped.")

    });

    it("Alice timestamps NFT and Mallory front-runs her", async function () {
        let _alice = crypto.enc.Hex.parse(alice.address.replace('0x', ''));
        let _mallory = crypto.enc.Hex.parse(mallory.address.replace('0x', ''));

        // Compute the asset id
        let _assetId = sha256("This is my 7. Verifiable NFT 1");
        let assetId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _assetId.toString());

        // Compute the authorship statement id
        var _asId = sha256("@Alice Wonderland 1");
        let asId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _asId.toString());

        // Compute the verifiable asset id
        let _verifiableAssetId = sha256(_assetId.concat(_asId));

        // Alice: Compute the NFT ID
        let _nid = _alice.concat(_verifiableAssetId)
        let _nftId = sha256(_nid)
        let nftId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _nftId.toString());
        // console.log("nftId:", nftId)
        // console.log(alice.address, "Author")
        // console.log(_assetId.toString(), "Asset id")
        // console.log(_asId.toString(), "Authorship statement id")

        // Alice: Timestamp the NFT ID
        await OpeNFT.connect(alice).timestamp(nftId)

        // Mallory: Compute the NFT ID
        let _nid_mallory = _mallory.concat(_verifiableAssetId)
        let _nftId_mallory = sha256(_nid_mallory)
        let nftId_mallory = await web3.eth.abi.encodeParameter('bytes32', '0x' + _nftId_mallory.toString());

        // Mallory: Timestamp the NFT ID
        await OpeNFT.connect(mallory).timestamp(nftId_mallory)

        // Mallory: Mint the NFT before Alice
        // await expect(OpeNFT.connect(mallory).safeMint(bob.address, assetId, asId, "https://api.openft.world")).to.be.revertedWith("Error: Unauthorised to mint.");
        await OpeNFT.connect(mallory).safeMint(bob.address, assetId, asId, "https://api.openft.world");
        expect(await OpeNFT.getNftId(assetId)).to.be.equal(nftId_mallory);
        // console.log("Get Asset Id by nft id", await OpeNFT.getNftId(assetId));

        // Alice: Mint the NFT and over-take the ownership
        await OpeNFT.connect(alice).safeMint(bob.address, assetId, asId, "https://api.openft.world");
        expect(await OpeNFT.getNftId(assetId)).to.be.equal(nftId);
        // console.log("Get Asset Id by nft id", await OpeNFT.getNftId(assetId));
    });

    it("Alice timestamps NFT and tries to steal the NFT", async function () {
        let _alice = crypto.enc.Hex.parse(alice.address.replace('0x', ''));
        let _mallory = crypto.enc.Hex.parse(mallory.address.replace('0x', ''));

        // Compute the asset id
        let _assetId = sha256("This is my 8. Verifiable NFT 1");
        let assetId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _assetId.toString());

        // Compute the authorship statement id
        var _asId = sha256("@Alice Wonderland 1");
        let asId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _asId.toString());

        // Compute the verifiable asset id
        let _verifiableAssetId = sha256(_assetId.concat(_asId));

        // Alice: Compute the NFT ID
        let _nid = _alice.concat(_verifiableAssetId)
        let _nftId = sha256(_nid)
        let nftId = await web3.eth.abi.encodeParameter('bytes32', '0x' + _nftId.toString());

        // Alice: Timestamp the NFT ID
        await OpeNFT.connect(alice).timestamp(nftId)

        // Mallory: Compute the NFT ID
        let _nid_mallory = _mallory.concat(_verifiableAssetId)
        let _nftId_mallory = sha256(_nid_mallory)
        let nftId_mallory = await web3.eth.abi.encodeParameter('bytes32', '0x' + _nftId_mallory.toString());

        // Mallory: Timestamp the NFT ID
        await OpeNFT.connect(mallory).timestamp(nftId_mallory)

        // Alice: Mint the NFT
        await OpeNFT.connect(alice).safeMint(bob.address, assetId, asId, "https://api.openft.world");
        expect(await OpeNFT.getNftId(assetId)).to.be.equal(nftId);
        // console.log("Get Asset Id by nft id", await OpeNFT.getNftId(assetId));

        // Mallory: Mint the NFT before Alice
        await expect(OpeNFT.connect(mallory).safeMint(bob.address, assetId, asId, "https://api.openft.world")).to.be.revertedWith("Error: Unauthorised to mint.");
        expect(await OpeNFT.getNftId(assetId)).to.be.equal(nftId);
        expect(await OpeNFT.tokenURI(nftId)).to.be.equal('https://api.openft.world');
        // console.log("Get Asset Id by nft id", await OpeNFT.getNftId(assetId));

    });
});
