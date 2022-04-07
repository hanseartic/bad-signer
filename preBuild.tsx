import {getLockedAccounts, LockedAccount} from "./src/useLockedAccounts";
import {AccountLockedInfo, getAccountLockedInfo} from "./src/useAccountLockedInfo";
import {writeFileSync as writeFile, readFileSync} from 'fs';
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

const clearFile = (): true => {
    if (accountFile === undefined) {
        throw accountFileNotFound;
    }
    writeFile(accountFile, '');
    return true
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
    getLockedAccounts(3)
        .then(lockedAccounts => clearFile() && lockedAccounts.map(acc =>
            getAccountLockedInfo(acc.id)
                .then(info => appendFile({...acc, ...info}))
                .then(console.log)
                .catch(console.warn)
        ))
        .catch(console.warn)
}

build();
