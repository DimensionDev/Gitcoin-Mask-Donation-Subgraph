import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { Splitter, SplitTransferCall } from "../generated/Splitter/Splitter"
import { DonateCall, DonationSent } from "../generated/BulkCheckout/BulkCheckout"
import { fetchToken } from "./helpers"
import { MASK_AID_FUND_PORJECT, MASK_NETWORK_PROJECT, PROJECT_TYPE_AID_FUND, PROJECT_TYPE_MASK_NETWORK, SOURCE_TYPE_BULK_CHECKOUT, SOURCE_TYPE_SPLITTER } from "./constants"
import { Donation, Donor } from "../generated/schema"

function createSupportedListOfAddress(): Array<Address> {
    let listOfAddress = new Array<Address>(2)
    listOfAddress.push(Address.fromHexString(MASK_AID_FUND_PORJECT) as Address)
    listOfAddress.push(Address.fromHexString(MASK_NETWORK_PROJECT) as Address)
    return listOfAddress
}

export function handleSplitTransfer(call: SplitTransferCall): void {
    let listOfAddress = createSupportedListOfAddress()
    let toFirstProject = listOfAddress.indexOf(call.inputs.toFirst)
    let toSecondProject = listOfAddress.indexOf(call.inputs.toSecond)
    let project = toFirstProject

    if (toSecondProject != -1) {
        project = toSecondProject
    }

    // not a Mask related donation
    if (project == -1) {
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
    donation.project_type = project == 0 ? PROJECT_TYPE_AID_FUND : PROJECT_TYPE_MASK_NETWORK
    donation.tx_id = call.transaction.hash.toHexString()
    donation.token = token.id
    donation.donor = donor.id
    donation.total = BigInt.fromI32(0)
    donation.dest = listOfAddress[project]
    donation.creation_time = call.block.timestamp.toI32()

    // the first one is the donation for Mask
    if (toFirstProject != -1) {
        donation.total = donation.total.plus(call.inputs.valueFirst)
    }

    // the second one is the donation for Mask
    if (toSecondProject !== -1) {
        donation.total = donation.total.plus(call.inputs.valueSecond)
    }
    donation.save()
}

export function handleDonate(call: DonateCall): void {
    let listOfAddress = createSupportedListOfAddress()
    let _donations = call.inputs._donations

    for (let i = 0; i < _donations.length; i+= 1) {
        let _donation = _donations[i]
        let _project = listOfAddress.indexOf(_donation.dest)

        // not a Mask related donation
        if (_project == -1) {
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
        donation.project_type = _project == 0 ? PROJECT_TYPE_AID_FUND : PROJECT_TYPE_MASK_NETWORK;
        donation.tx_id = call.transaction.hash.toHexString()
        donation.token = token.id
        donation.donor = donor.id
        donation.dest = listOfAddress[_project]
        donation.creation_time = call.block.timestamp.toI32()
        donation.total = _donation.amount
        donation.save()
    }
}

export function handleDonationSent(event: DonationSent): void {
    log.info('handle donation sent event', [])
}