---
title: OpeNft - Secure decentralised NFT minting
status: Draft
author: @alenhorvat, @weslito 
type: A
created: 2022-09-03
requires: TZIP-12
replaces: 
superseded-by:
date: 2022-09-09
version: 0
---

## Summary

The proposal enables a secure decentralised NFT minting that prevents front-running and enables authors to prove their authorship in a reliable way.

## Abstract

Binding physical or digital assets to NFTs on a public blockchain is challenging, as all the blockchain transactions are public, and information is easy to copy, giving malicious actors an excellent opportunity to steal your work or sell fake products. Hence, a secure and reliable NFT-binding process is crucial to protect authors, buyers, and sellers. We introduce an open NFT binding process that enables everyone to bind digital or physical assets to NFTs reliably and securely.

## Motivation

The NFT minting process today faces several challenges. First, NFTs and assets are bound via a URL, and content at that URL is, in most cases, mutable. Second, the current NFT minting model does not allow you to prove you created the artifact. As an attacker, I can see your transaction and mint another NFT that references your work; note that the attacker can copy your content. Third, the current model does not protect the buyers, as they don't have an assurance the digital work referenced with the NFT was minted by the author (or with the author's authorisation). Fourth, the current model does not for a secure binding of physical artifacts like contracts or physical items with NFTs.

## Specification

### Open and decentralised NFT minting

The proposal enables a decentralised NFT minting. The smart contract doesn't have an owner, NFT minting is open and available to everyone, all NFTs are minted in the same smart contract, authors can always prove authorship.

Hence, the smart contracts can be considered as public good.

### NFT binding of digital assets

NFT binding of digital assets happens in two steps:

- timestamp the NFT ID
- mint the NFT

In the first step we, as the author (or a 3rd party authorised by the author)

- create our Tezos address `tz_addr`
- compute the digital asset identifier as `asset_id = sha256(digital asset)`
- compute the NFT id as `nft_id = sha256(author's tz_addr || asset identifier) = sha256(tz_addr, asset_id)`
- pre-mint the NFT by timestamping the `nft_id` in the smart contract

Note that anyone can timestamp the NFT ID, but only we, as the author, can mint the corresponding NFT as only we know the asset identifier and we own the address.

In the second step, the we mint the token by invoking the method `mint(asset_id)`. The smart contract computes the `nft_id_computed = sha256(msg.Sender() || asset_id)`, checks whether the claim digest is timestamped and mints the NFT.

The smart contract ensures that the `asset_id` is bound to the
`nft_id` that was timestamped first.

#### Assurance

Only the author can mint an NFT bound to the digest of the digital asset. Author can prove authorship proving she controls the address that minted the NFT.

### NFT binding and Authorship Statements

An author statement recognises individual author contributions, reduces authorship disputes, facilitates collaboration, and enables authors to prove their authorship. The statement can be issued in a digital or physical form. We introduce a digital author statement that enable authors to prove their authorship.

The minting process is the same as in the previous section, except that now we
bind an NFT to an asset id and author's statement.

In the first step, the author

- creates its Tezos address `tz_addr`
- issues an Author's Statement and computes the authorship statement id as `authorship_statement_id = sha256(author statement)`
  - to compute the authorship statement digest which is a JSON object, we must canonicalise it using JCS, and UTF-8 encode it
  - the authorship statement can be e-signed or e-sealed
- defines the asset id
  - in the case of digital assets, the asset id should be the digital asset digest  `asset_id = asset_digest = sha256(digital asset)`
  - in the case of a physical assets, the asset id derivation is defined by the domain/use case
- computes hash of the NFT ID as `nft_id = sha256(tz_addr || asset_id || authorship_statement_id)`

In the second step, the author mints the token by calling the method
`mint(asset_id, authorship_statement_digest)`. The smart contract computes the `nft_id computed = sha256(msg.Sender() || asset_id || authorship_statement_id)`, checks whether the NFT ID is timestamped and mints an NFT with `NFT id == claim_digest`.

The smart contract ensures that the `asset_id` is bound to the
`nft_id` that was timestamped first.

#### Assurance

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
description: Authorship Claim schema
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
## Rationale

The rationale fleshes out the specification by describing what motivated the
design and why particular design decisions were made. It should describe
alternate designs that were considered and related work. The rationale may also 
provide evidence of consensus within the community, and should discuss important 
objections or concerns raised during discussion.

## Backwards Compatibility

The proposal is compatible with FA2 (TZIP-12) nfts.

## Security Considerations

- If you publish your work before you register the author's statement, a malicious actor may steal your work
- If you try to mint the NFT before you timestamp the NFT ID, a malicious actor may steal your work
- You can reveal the secret only after you register the author's statement
- We recommend using public keys or ZKPs for proving authorship

## Test Cases

Test cases for an implementation are recommended as are proofs of correctness via 
formal methods if applicable.

## Implementations

Reference implementation to be provided

## Appendix

A list of references relevant to the proposal.

## Copyright

Copyright and related rights waived via
[CC0](https://creativecommons.org/publicdomain/zero/1.0/).
