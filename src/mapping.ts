import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { Splitter, SplitTransferCall } from "../generated/Splitter/Splitter"
import { DonateCall, DonationSent } from "../generated/BulkCheckout/BulkCheckout"
import { fetchToken } from "./helpers"
import { MASK_UNKNOWN_PROJECT, MASK_AID_FUND_PORJECT, MASK_NETWORK_PROJECT, PROJECT_TYPE_AID_FUND, PROJECT_TYPE_MASK_NETWORK, SOURCE_TYPE_BULK_CHECKOUT, SOURCE_TYPE_SPLITTER, PROJECT_TYPE_UNKNOWN } from "./constants"
import { Donation, Donor } from "../generated/schema"

function getProjectType(address: Address): number {
    if (address.toHexString() == MASK_AID_FUND_PORJECT) return PROJECT_TYPE_AID_FUND
    if (address.toHexString() == MASK_NETWORK_PROJECT) return PROJECT_TYPE_MASK_NETWORK
    return PROJECT_TYPE_UNKNOWN
}

function getProjectAddress(type: number): Address {
    if (type == PROJECT_TYPE_AID_FUND) return Address.fromHexString(MASK_AID_FUND_PORJECT) as Address
    if (type == PROJECT_TYPE_MASK_NETWORK) return Address.fromHexString(MASK_NETWORK_PROJECT) as Address
    return Address.fromHexString(MASK_UNKNOWN_PROJECT) as Address
}

export function handleSplitTransfer(call: SplitTransferCall): void {
    let toFirstProject = getProjectType(call.inputs.toFirst)
    let toSecondProject = getProjectType(call.inputs.toSecond)
    let project = toFirstProject

    if (toSecondProject != PROJECT_TYPE_UNKNOWN) {
        project = toSecondProject
    }

    // not a Mask related donation
    if (project == PROJECT_TYPE_UNKNOWN) {
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
    donation.project_type = project
    donation.tx_id = call.transaction.hash.toHexString()
    donation.token = token.id
    donation.donor = donor.id
    donation.total = BigInt.fromI32(0)
    donation.dest = getProjectAddress(project)
    donation.creation_time = call.block.timestamp.toI32()

    // the first one is the donation for Mask
    if (toFirstProject != PROJECT_TYPE_UNKNOWN) {
        donation.total = donation.total.plus(call.inputs.valueFirst)
    }

    // the second one is the donation for Mask
    if (toSecondProject != PROJECT_TYPE_UNKNOWN) {
        donation.total = donation.total.plus(call.inputs.valueSecond)
    }
    donation.save()
}

export function handleDonate(call: DonateCall): void {
    let _donations = call.inputs._donations

    for (let i = 0; i < _donations.length; i += 1) {
        let _donation = _donations[i]
        let _project = getProjectType(_donation.dest)

        // not a Mask related donation
        if (_project == PROJECT_TYPE_UNKNOWN) {
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
        donation.project_type = _project
        donation.tx_id = call.transaction.hash.toHexString()
        donation.token = token.id
        donation.donor = donor.id
        donation.dest = getProjectAddress(_project)
        donation.creation_time = call.block.timestamp.toI32()
        donation.total = _donation.amount
        donation.save()
    }
}

export function handleDonationSent(event: DonationSent): void {
    log.info('handle donation sent event', [])
}