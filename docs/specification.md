# Specification

- [Specification](#specification)
  - [Open and decentralised NFT minting](#open-and-decentralised-nft-minting)
  - [NFT binding of digital assets](#nft-binding-of-digital-assets)
  - [NFT binding and Authorship Statements](#nft-binding-and-authorship-statements)
    - [Assurance](#assurance)
  - [Security considerations](#security-considerations)
  - [Authorship statement specification](#authorship-statement-specification)

TODO: 

- Align the specs with the SC outline
- Update the terminology (see the SC)

The smart contract is available [here](contracts/opeNFT-v2.sol).

## Open and decentralised NFT minting

OpeNFT enables a decentralised NFT minting. OpeNFT smart contract doesn't have an owner, NFT minting is open and available to everyone, all NFTs are minted in the same smart contract, authors can always prove authorship.

Hence, the OpeNFT smart contracts can be considered as public good.

## NFT binding of digital assets

NFT binding of digital assets happens in two steps:

- timestamp the NFT ID
- mint the NFT

In the first step we, as the author (or a 3rd party authorised by the author)

- create our Ethereum address `eth_addr`
- compute the digital asset identifier as `asset_id = sha256(digital asset)`
- compute the NFT id as `nft_id = sha256(author's eth address || asset identifier) = sha256(eth_addr, asset_id)`
- pre-mint the NFT by timestamping the `nft_id` in the OpeNFT smart contract

Note that anyone can timestamp the NFT ID, but only we, as the author, can mint the corresponding NFT as only we know the asset identifier and we own the address.

In the second step, the we mint the token by invoking the method `mint(asset_id)`. The smart contract computes the `nft_id_computed = sha256(msg.Sender() || asset_id)`, checks whether the claim digest is timestamped and mints the NFT.

The smart contract ensures that the `asset_id` is bound to the
`nft_id` that was timestamped first.

Only the author can mint an NFT bound to the digest of the digital asset. Author can prove authorship proving she controls the address that minted the NFT.

## NFT binding and Authorship Statements

An author statement recognises individual author contributions, reduces authorship disputes, facilitates collaboration, and enables authors to prove their authorship. The statement can be issued in a digital or physical form. We introduce a digital author statement that enable authors to prove their authorship.

The minting process is the same as in the previous section, except that now we
bind an NFT to an asset id and author's statement.

In the first step, the author

- creates its Ethereum address `eth_addr`
- issues an Author's Statement and computes the authorship statement id as `authorship_statement_id = sha256(author statement)`
  - to compute the authorship statement digest which is a JSON object, we must canonicalise it using JCS, and UTF-8 encode it
  - the authorship statement can be e-signed or e-sealed
- defines the asset id
  - in the case of digital assets, the asset id should be the digital asset digest  `asset_id = asset_digest = sha256(digital asset)`
  - in the case of a physical assets, the asset id derivation is defined by the domain/use case
- computes hash of the NFT ID as `nft_id = sha256(eth_addr || asset_id || authorship_statement_id)`

In the second step, the author mints the token by calling the method
`mint(asset_id, authorship_statement_digest)`. The smart contract computes the `nft_id computed = sha256(msg.Sender() || asset_id || authorship_statement_id)`, checks whether the NFT ID is timestamped and mints an NFT with `NFT id == claim_digest`.

The smart contract ensures that the `asset_id` is bound to the
`nft_id` that was timestamped first.

### Assurance

- Only the author can mint an NFT bound to the digest of the digital asset
- Author can prove authorship by presenting a proof that she controls the
  address that minted the NFT.
- Author can use other means to prove the authorship, like a secret,
  zero-knowledge proof, physical or digital contract etc. For more, see the
  Author Statement section
- Guarantor's statement can be referenced or the Guarantor's statement can reference the NFT ID
- Buyer can always check the asset she is buying belongs to an author

## Security considerations

Asset id must not be revealed before the pre-minting step is completed.

## Authorship statement specification

```yaml
$schema: http://json-schema.org/draft-07/schema#
title: Authorship Claim
description: OpeNFT Authorship Claim schema
type: object
required:
  - id
  - secret
properties:
  fullName:
    description: Full name of the author(s). If there's more than one author, names are comma separated.
    type: string
  date:
    description: Date, when the work was created.
    type: string
    format: date
  id:
    description: Identifier that is used to reference the work. If the artifact is digital, identifier should be a (multi-)hash of the artifact. If we're referencing a non-digital artifact, identifier must be uniquely linked to the artifact, e.g., serial number, contract number, other identifier.
    type: string
  secret:
    description: Secret, id, public-key or zero-knowledge proof that are only known to the author of the work/artifact at the time of NFT minting to protect the authorship.
    type: object
    properties:
      type:
        description: |
          Supported types:
            - id: Hash or other unique ID that is uniquely linked with the artifact.
            - secret: Random number or a word sequence generated by the author.
            - public-key: Public key or address of the author. Author proves her rights by proving control of the corresponding private key.
            - zkp: Zero-knowledge proof.
        enum:
          - id
          - secret
          - public-key
          - zkp
  license:
    description: License information.
    type: object
    properties:
      name:
        description: license name
        type: string
      uri:
        description: URI to the license.
        type: string
        format: URI
```
