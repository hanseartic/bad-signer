import {Statistic, Table} from "antd";
import {badSigner} from "./common";
import Highlighter from "react-highlight-words";
import {useEffect, useMemo, useState} from "react";
import {ColumnsType} from "antd/lib/table/interface";
import https from "https";
import {AccountInfo, AccountsLockedData} from "../typings/accountsLockedData";

const getAccountsInfo = (source: string): Promise<AccountsLockedData> => {
    return new Promise((resolve, reject) => {
        https
            .get(source, r => {
                let accounts = '';
                r.on('data', chunk => accounts += chunk);
                r.on('end', () => {
                    try {
                        resolve(JSON.parse(accounts));
                    } catch {
                        reject("Could not parse data from " + source);
                    }
                });
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}


const Account = ({id, search}: {id: string, search?: string}) => {
    return <a href={`https://stellar.expert/explorer/public/account/${id}`} target="_blank" rel="noreferrer">{
        search
            ? <Highlighter textToHighlight={id} searchWords={[search]} />
            : id
    }</a>
}


interface AccountsTableState {
    loading: boolean,
    count: number,
}
interface AccountsTableProps {
    filter: string,
    onUpdated: (updatedAt: Date) => void,
    onFiltered: (data: AccountsLockedData) => void,
}
const AccountsTable = ({filter, onUpdated, onFiltered}: AccountsTableProps) => {
    const [accounts, setAccounts] = useState<AccountInfo[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date>();
    const [state, setState] = useState<AccountsTableState>({loading: true, count: 0});

    useEffect(() => {
        getAccountsInfo('/bad-signer/accounts.json')
            .then(info => {
                setAccounts(info.accounts);
                setLastUpdated(info.lastUpdated);
            })
            .catch(() => {
                setState(p => ({...p, loading: false}))
            })
    }, []);

    useEffect(() => {
        try {
            if (undefined !== lastUpdated) {
                onUpdated(lastUpdated);
            }
        } catch {}
    }, [lastUpdated, onUpdated]);

    const sizes = useMemo(() => {
        const selectors = [25, 50, 100, 200, 500, 1000];
        if (accounts?.length??0 > 25) {
            return selectors.filter(e => e < accounts?.length??0).concat(accounts?.length??0)
        }
        return selectors.slice(0, 1);
    }, [accounts.length]);

    useEffect(() => {
        if (accounts.length) {
            setState(p => ({
                ...p,
                loading: false,
                count: accounts.length
            }));
        }
    }, [accounts.length]);

    const onAccountsFilter = (search: string|number|boolean, record: AccountInfo) => {
        return record.id.toLowerCase().includes(typeof search === 'string'?search.toLowerCase():`${search}`);
    }

    const columns = useMemo<ColumnsType<AccountInfo>>(() => [
        {
            title: 'account',
            dataIndex: 'id',
            render: (id) => <Account id={id} search={filter} />,
            sorter: (a, b) => a.id.localeCompare(b.id),
            onFilter: onAccountsFilter,
            filteredValue: filter ? [filter] : [],
        },
        {
            title: 'locked at',
            dataIndex: 'takeover',
            sorter: (a: AccountInfo, b: AccountInfo) => Date.parse(a.takeover) - Date.parse(b.takeover),
        },
        {
            title: 'last accessed',
            dataIndex: 'last_modified_time',
            sorter: (a: AccountInfo, b: AccountInfo) => Date.parse(a.last_modified_time) - Date.parse(b.last_modified_time),
        }
    ], [filter]);

    const tableFooter = () => {
        return <Statistic
            title={<>Accounts locked by <b>{badSigner}</b> (last updated: {lastUpdated?.toLocaleString()})</>}
            value={state.count}
            loading={state.loading} />
    }
    return <Table
        sticky
        scroll={{ x: 'max-content' }}
        pagination={{
            position: ["bottomCenter"],
            defaultPageSize: sizes[0],
            pageSizeOptions: sizes,
            total: state.count,
            showTitle: false,
            size: "small",
            showLessItems: true,
            showPrevNextJumpers: true,
            showQuickJumper: true,
        }}

        footer={tableFooter}
        columns={columns}
        loading={state.loading}
        dataSource={accounts}
        rowKey={account => account.id}
    />
};

export default AccountsTable;
