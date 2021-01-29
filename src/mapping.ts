import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { Splitter, SplitTransferCall } from "../generated/Splitter/Splitter"
import { DonateCall, DonationSent } from "../generated/BulkCheckout/BulkCheckout"
import { fetchToken } from "./helpers"
import { MASK_ADDRESS, SOURCE_TYPE_BULK_CHECKOUT, SOURCE_TYPE_SPLITTER } from "./constants"
import { Donation, Donor } from "../generated/schema"

export function handleSplitTransfer(call: SplitTransferCall): void {
    let address = Address.fromHexString(MASK_ADDRESS) as Address

    // not a Mask related donation
    if (call.inputs.toFirst != address && call.inputs.toSecond != address) {
        return
    }

    // create token
    let token = fetchToken(call.inputs.tokenAddress)
    token.save()

    // create donor
    let donor = new Donor(call.from.toHexString())
    donor.address = call.from
    donor.save()

    // create donation 
    let donation = new Donation(call.transaction.hash.toHexString())
    donation.source_type = SOURCE_TYPE_SPLITTER
    donation.tx_id = call.transaction.hash.toHexString()
    donation.token = token.id
    donation.donor = donor.id
    donation.dest = address
    donation.creation_time = call.block.timestamp.toI32()

    // the first one is the donation for Mask
    if (call.inputs.toFirst == address) {
        donation.total = call.inputs.valueFirst
    }

    // the second one is the donation for Mask
    if (call.inputs.toSecond == address) {
        donation.total = call.inputs.valueSecond
    }
    donation.save()
}

export function handleDonate(call: DonateCall): void {
    let address = Address.fromHexString(MASK_ADDRESS) as Address
    let _donations = call.inputs._donations

    for (let i = 0; i < _donations.length; i+= 1) {
        let _donation = _donations[i]

        // not a Mask related donation
        if (_donation.dest != address) {
            continue
        }

        // create token
        let token = fetchToken(_donation.token)
        token.save()

        // create donor
        let donor = new Donor(call.from.toHexString())
        donor.address = call.from
        donor.save()

        // create donation
        let donation = new Donation(call.transaction.hash.toHexString())
        donation.source_type = SOURCE_TYPE_BULK_CHECKOUT
        donation.tx_id = call.transaction.hash.toHexString()
        donation.token = token.id
        donation.donor = donor.id
        donation.dest = address
        donation.creation_time = call.block.timestamp.toI32()
        donation.total = _donation.amount
        donation.save()
    }
}

export function handleDonationSent(event: DonationSent): void {
    log.info('handle donation sent event', [])
}