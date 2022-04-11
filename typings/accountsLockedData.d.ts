import {LockedAccount} from "../src/useLockedAccounts";
import {AccountLockedInfo} from "../src/useAccountLockedInfo";

export type AccountInfo = LockedAccount & AccountLockedInfo;
export interface AccountsLockedData {
    accounts: AccountInfo[],
    lastUpdated: Date,
}