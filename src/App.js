import './App.css';
import 'antd/dist/antd.css';
import loopcall from '@cosmic-plus/loopcall'
import {useEffect, useState} from "react";
import {Server} from "stellar-sdk";
import {Layout, Skeleton, Table} from "antd";
import {Content} from "antd/lib/layout/layout";

const server = new Server('https://horizon.stellar.org');
const badSigner = 'GCTXWXCZ2GKRACYXROMCBF6DBLH65TTIN7W3JCHRVGZOHBUBTFOJKH7O';
//const vaultFlagSigner = 'GCTXWXCZ2GKRACYXROMCBF6DBLH65TTIN7W3JCHRVGZOHBUBTFOJKH7O';

const useLockedAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    const callBuilder = server.accounts().forSigner(badSigner);
    loopcall(
        callBuilder,
        {
            filter: r => r.id !== badSigner
        })
        .then(accounts => accounts.sort((a, b) => {
            return new Date(b.last_modified_time) - new Date(a.last_modified_time)
        }))
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
        loopcall(server.operations().order("desc").forAccount(id), {
            breaker: record => record.type === 'set_options' && record.high_threshold === 20,
            filter: record => record.source_account === id,
        }).then(ops => ({
            takeover: ops[0].created_at,
            opsAfterTakeover: ops.length-1,
            opTypes: ops.map(o => o.type),
            ops: ops,
        }))
            .then(setLockInfo)
    }, [id]);
    return lockInfo;
}

const LockInfo = ({id}) => {
    const lockInfo = useAccountLockedInfo(id);
    return (lockInfo && lockInfo.takeover) ||
        <Skeleton.Input size={"small"} active style={{lineHeight: "10 !important", height: 20}} />
}

function App() {
  const accounts = useLockedAccounts();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
      setLoading(accounts.length === 0)
  }, [accounts]);
  const columns = [
      {
          title: 'account',
          dataIndex: 'id',
          render: id => <Account id={id} />,
          sorter: (a, b) => a.id.localeCompare(b.id),
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

  return (
      <Layout className={"App"}>
        <Content className={"App-content"}>
        <Table
            title={(a) => "Accounts locked by " + badSigner }
            columns={columns}
            loading={loading}
            dataSource={accounts.map(a => ({...a, key:a.id}))}
        />
        </Content>
      </Layout>
  );
}

export default App;
