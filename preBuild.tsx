import {getLockedAccounts} from "./src/useLockedAccounts";
import {getAccountLockedInfo} from "./src/useAccountLockedInfo";
import {writeFileSync as writeFile, readFileSync, existsSync as fileExists} from 'fs';
import {config} from 'dotenv';
import {AccountInfo, AccountsLockedData} from './typings/accountsLockedData';

const accountFile = config().parsed?.WRITE_ACCOUNTS_CACHE;
const accountFileNotFound = "json file not defined"

const getAccountsDataFromJson = (json: string): AccountsLockedData => {
    try {
        return JSON.parse(json) as AccountsLockedData;
    } catch {
        return {
            accounts: [],
            lastUpdated: new Date(Date.now()),
        };
    }
}

const checkAccountsFile = (): boolean => {
    if (accountFile === undefined) {
        throw accountFileNotFound;
    }
    if (fileExists(accountFile)) {
        console.warn('accounts file already exists - skipping');
        return false;
    }
    writeFile(accountFile, '');
    return true;
}

const appendFile = (data: AccountInfo): AccountInfo|undefined => {
    if (accountFile === undefined) {
        throw accountFileNotFound;
    }
    const existingData = getAccountsDataFromJson(readFileSync(accountFile, {encoding: 'utf8'}));
    if (typeof existingData === 'object') {
        existingData.accounts = existingData.accounts.concat(data);
        existingData.lastUpdated = new Date;
        writeFile(accountFile, JSON.stringify(existingData));
        return data;
    }
}

const build = () => {
    checkAccountsFile() && getLockedAccounts()
        .then(lockedAccounts => lockedAccounts.map(acc =>
            getAccountLockedInfo(acc.id)
                .then(info => appendFile({...acc, ...info}))
                .then(allInfo => console.log(allInfo?.id))
                .catch(console.warn)
        ))
        .catch(console.warn)
}

build();
