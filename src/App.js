import './App.css';
import 'antd/dist/antd.css';
import loopcall from '@cosmic-plus/loopcall'
import {useEffect, useState, useMemo} from "react";
import {Server} from "stellar-sdk";
import {BackTop, Input, Layout, PageHeader, Skeleton, Statistic, Table, Tag} from "antd";
import {Content} from "antd/lib/layout/layout";
import {GithubOutlined, TwitterOutlined} from "@ant-design/icons";

const server = new Server('https://horizon.stellar.lobstr.co');
const badSigner = 'GCTXWXCZ2GKRACYXROMCBF6DBLH65TTIN7W3JCHRVGZOHBUBTFOJKH7O';
//const vaultFlagSigner = 'GCTXWXCZ2GKRACYXROMCBF6DBLH65TTIN7W3JCHRVGZOHBUBTFOJKH7O';

const useLockedAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    const callBuilder = server.accounts().forSigner(badSigner).limit(200);
    loopcall(
        callBuilder,
        {
            filter: r => r.id !== badSigner
        })
        .then(accounts => accounts.sort((a, b) => {
            return new Date(b.last_modified_time) - new Date(a.last_modified_time)
        }))
        .then(accounts => accounts.map(a => ({id: a.id, last_modified_time: a.last_modified_time})))
        .then(setAccounts)
  }, []);
  return accounts;
};


const Account = ({id}) => {
    return <>
        <a href={`https://stellar.expert/explorer/public/account/${id}`} target="_blank" rel="noreferrer">{id}</a>
    </>
}

const useAccountLockedInfo = (id) => {
    const [lockInfo, setLockInfo] = useState();
    useEffect(() => {
        loopcall(server.operations().order("desc").forAccount(id).limit(200), {
            breaker: record => record.type === 'set_options' && record.high_threshold === 20,
            filter: record => record.source_account === id,
        }).then(ops => ({
            takeover: ops[0].created_at,
            opsAfterTakeover: ops.length-1,
            opTypes: ops.map(o => o.type),
            //ops: ops,
        }))
            .then(setLockInfo)
        // eslint-disable-next-line
    }, []);
    return lockInfo;
}

const LockInfo = ({id}) => {
    const lockInfo = useAccountLockedInfo(id);
    return (lockInfo && lockInfo.takeover) ||
        <Skeleton.Input size={"small"} active style={{lineHeight: "10 !important", height: 20}} />
}

function App() {
  const sizes = useMemo(() => [25, 50, 100, 200, 500, 1000], []);
  const accounts = useLockedAccounts();
  const [state, setState] = useState({loading: true, count: 0, sizes: sizes.slice(0, 1)});
  const [search, setSearch] = useState(undefined);
  const [filter, setFilter] = useState([]);
  useEffect(() => {
      setFilter([search])
  }, [search]);
  useEffect(() => {
      setState(prev => ({
          loading: accounts.length === 0,
          count: accounts.length,
          sizes: accounts.length === 0
              ? prev.sizes
              : sizes.filter(e => e < accounts.length).concat(accounts.length)
      }));
  }, [accounts, sizes]);

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
          key: 'locked',
          render: a => <LockInfo id={a.id} />
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
              dataSource={accounts.map(a => ({...a, key:a.id}))}
          />
      </Content>
      </Layout>);
}

export default App;
