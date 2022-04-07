import {getLockedAccounts, LockedAccount} from "./src/useLockedAccounts";
import {AccountLockedInfo, getAccountLockedInfo} from "./src/useAccountLockedInfo";
import {writeFileSync as writeFile, readFileSync, existsSync as fileExists} from 'fs';
import {config} from 'dotenv';

const accountFile = config().parsed?.WRITE_ACCOUNTS_CACHE;
const accountFileNotFound = "json file not defined"

type AllInfo = LockedAccount & AccountLockedInfo;

const getAccountsDataFromJson = (json: string): AllInfo[] => {
    try {
        return [].concat(JSON.parse(json));
    } catch {
        return [];
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

const appendFile = (data: AllInfo): AllInfo|undefined => {
    if (accountFile === undefined) {
        throw accountFileNotFound;
    }
    const existingData = getAccountsDataFromJson(readFileSync(accountFile, {encoding: 'utf8'}));
    if (typeof existingData === 'object') {
        writeFile(accountFile, JSON.stringify(existingData.concat(data)));
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
