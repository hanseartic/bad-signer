import './App.css';
import 'antd/dist/antd.css';
import loopcall from '@cosmic-plus/loopcall'
import {useEffect, useState} from "react";
import {Server} from "stellar-sdk";
import {Layout, PageHeader, Skeleton, Statistic, Table, Tag} from "antd";
import {Content} from "antd/lib/layout/layout";
import {GithubOutlined, TwitterOutlined} from "@ant-design/icons";

const server = new Server('https://horizon.stellar.org');
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
  const accounts = useLockedAccounts();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
      setLoading(accounts.length === 0);
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

  const tableFooter = () => {
      return <Statistic title={"Accounts locked by " + badSigner} value={accounts.length} loading={loading} />
  }
  return (<Layout className={"App"}>
      <PageHeader
          title="Overview of stolen/locked accounts"
          tags={[
              <Tag color="processing" icon={<TwitterOutlined />}><a href="https://twitter.com/vinamo_/status/1511027634448343047"  target="_blank" rel="noreferrer">Follow convo on twitter</a></Tag>,
              <Tag icon={<GithubOutlined />}><a href="https://github.com/hanseartic/bad-signer" target="_blank" rel="noreferrer">Improve this on github</a></Tag>,
          ]} />

      <Content className={"App-content"}>
          <Table
              pagination={{ position: ["bottomCenter"], defaultPageSize: 15, pageSizeOptions: [15, 50, 100, accounts.length], simple: false, total: accounts.length, size: "small"}}
              footer={tableFooter}
              columns={columns}
              loading={loading}
              dataSource={accounts.map(a => ({...a, key:a.id}))}
          />
      </Content>
      </Layout>);
}

export default App;
