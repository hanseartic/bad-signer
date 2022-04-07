import './App.css';
import 'antd/dist/antd.css';

import {useEffect, useState, useMemo} from "react";
import {BackTop, Input, Layout, PageHeader, Statistic, Table, Tag} from "antd";
import {Content} from "antd/lib/layout/layout";
import {DownloadOutlined, GithubOutlined, TwitterOutlined} from "@ant-design/icons";
import {badSigner} from "./common"
import https from 'https';

//const vaultFlagSigner = 'GCTXWXCZ2GKRACYXROMCBF6DBLH65TTIN7W3JCHRVGZOHBUBTFOJKH7O';

const getAccountsInfo = (source) => {
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

const Account = ({id}) => {
    return <a href={`https://stellar.expert/explorer/public/account/${id}`} target="_blank" rel="noreferrer">{id}</a>
}

function App() {
    const [accounts, setAccounts] = useState(undefined);
    const [state, setState] = useState({loading: true, count: 0, sizes: [25]});
    const [search, setSearch] = useState(undefined);
    const [filter, setFilter] = useState([]);

    useEffect(() => {
      getAccountsInfo('/bad-signer/accounts.json')
          .then(setAccounts)
          .catch(() => {
              setState(p => ({...p, loading: false}))
          })
    }, []);

    useEffect(() => {
      setFilter([search])
    }, [search]);

    useEffect(() => {
        if (undefined !== accounts) {
            setState(p => ({
                ...p,
                loading: false,
                count: accounts.length
            }));
        }
    }, [accounts]);

    const sizes = useMemo(() => {
        const selectors = [25, 50, 100, 200, 500, 1000];
        if (accounts?.length??0 > 25) {
            return selectors.filter(e => e < accounts?.length??0).concat(accounts?.length??0)
        }
        return selectors.slice(0, 1);
    }, [accounts]);

    useEffect(() => {
      setState(p => ({...p, sizes: sizes}));
    }, [sizes]);

    const columns = [
      {
          title: 'account',
          dataIndex: 'id',
          render: id => <Account id={id} />,
          sorter: (a, b) => a.id.localeCompare(b.id),
          onFilter: (s, r) => r.id.toLowerCase().includes(s.toLowerCase()),
          filteredValue: (search && filter) || [],
      },
      {
          title: 'locked at',
          dataIndex: 'takeover',
          sorter: (a, b) => Date.parse(a.takeover) - Date.parse(b.takeover),
      },
      {
          title: 'last accessed',
          dataIndex: 'last_modified_time',
          sorter: (a, b) => Date.parse(a.last_modified_time) - Date.parse(b.last_modified_time),
      }
    ];

    const tableFooter = () => {
      return <Statistic title={"Accounts locked by " + badSigner} value={state.count} loading={state.loading} />
    }

    return (<Layout className={"App"}>
        <PageHeader
          key={"head"}
          title="Overview of stolen/locked accounts"
          tags={[
              <Tag key={"ph:tweet"} color="processing" icon={<TwitterOutlined />}><a href="https://twitter.com/vinamo_/status/1511027634448343047"  target="_blank" rel="noreferrer">Follow the convo on twitter</a></Tag>,
              <Tag key={"ph:gh"} icon={<GithubOutlined />}><a href="https://github.com/hanseartic/bad-signer" target="_blank" rel="noreferrer">Help to improve this on github</a></Tag>,
              <Tag key={"ph:download"} color="success" icon={<DownloadOutlined />}><a href="/bad-signer/accounts.json" target="_blank" rel="noreferrer">Download dataset (.json)</a></Tag>,
          ]} />

        <Content className={"App-content"}>
            <BackTop visibilityHeight={50} />
            <Input value={search} onChange={e => {e.preventDefault(); setSearch(e.target.value);}} placeholder={"Enter address to check if it is locked"} />
            <Table
                sticky
                scroll={{ x: 'max-content' }}
                pagination={{
                    position: ["bottomCenter"],
                    defaultPageSize: state.sizes[0],
                    pageSizeOptions: state.sizes,
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
        </Content>
        </Layout>);
}

export default App;
