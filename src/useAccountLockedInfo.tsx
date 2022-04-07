import {useEffect, useState} from "react";
import loopcall from "@cosmic-plus/loopcall"
import {server} from "./common"
import {ServerApi} from "stellar-sdk";
type OperationRecord = ServerApi.OperationRecord;

type OpType = Pick<OperationRecord, "transaction_hash"|"type"|"created_at">

export interface AccountLockedInfo {
    takeover: string,
    opsAfterTakeover: number,
    opsTypes: OpType[],
    // opsTypes: OperationResponseType[],
}

export type GetAccountLockedInfoPromise = Promise<AccountLockedInfo>;
export const getAccountLockedInfo = (id: string): GetAccountLockedInfoPromise => {
    return loopcall(
        server.operations().order("desc").forAccount(id).limit(200),
        {
            breaker: (operation: OperationRecord) => operation.type === 'set_options' && operation.high_threshold === 20,
            filter: (operation: OperationRecord) => operation.source_account === id,
        })
        .then((operations: OperationRecord[]) => operations.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)))
        .then((operations: OperationRecord[]) => ({
            takeover: operations[0].created_at,
            opsAfterTakeover: operations.length-1,
            opsTypes: operations.map(o => ({type: o.type, created_at: o.created_at, transaction_hash: o.transaction_hash})),
        }));
}

const useAccountLockedInfo = (id: string): AccountLockedInfo|undefined => {
    const [lockInfo, setLockInfo] = useState<AccountLockedInfo>();
    useEffect(() => {
        getAccountLockedInfo(id).then(setLockInfo)
        // eslint-disable-next-line
    }, []);
    return lockInfo;
}

export default useAccountLockedInfo;
