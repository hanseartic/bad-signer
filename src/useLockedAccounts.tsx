import {useEffect, useState} from "react";
import {badSigner, server} from "./common";
import loopcall from "@cosmic-plus/loopcall";
import {ServerApi} from "stellar-sdk";

interface AccountRecord extends ServerApi.AccountRecord {
    last_modified_time: string, // e.g. 2021-11-16T07:24:31Z
}

export interface LockedAccount {
    id: string,
    last_modified_time: string,
}

export type GetLockedAccountsPromise = Promise<LockedAccount[]>;
export const getLockedAccounts: (limit?: number) => GetLockedAccountsPromise = (limit?: number): GetLockedAccountsPromise => {
    const callBuilder = server.accounts().forSigner(badSigner).limit(200);
    return loopcall(
        callBuilder,
        {
            filter: (r: AccountRecord) => r.id !== badSigner,
            limit: limit??undefined,
        })
        .then((accounts: AccountRecord[]) => accounts.sort((a, b) =>
            Date.parse(b.last_modified_time) - Date.parse(a.last_modified_time)
        ))
        .then((accounts: AccountRecord[]) => accounts.map(a => ({id: a.id, last_modified_time: a.last_modified_time} as LockedAccount)))
}

const useLockedAccounts: () => LockedAccount[] = (): LockedAccount[] => {
    const [accounts, setAccounts] = useState<LockedAccount[]>([]);
    useEffect(() => {
        getLockedAccounts(10)
            .then(setAccounts)
    }, []);
    return accounts;
};

export default useLockedAccounts;
