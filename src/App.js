import './App.css';
import 'antd/dist/antd.css';

import {useState} from "react";
import {BackTop, Input, Layout, PageHeader, Tag} from "antd";
import {Content} from "antd/lib/layout/layout";
import {DownloadOutlined, GithubOutlined, TwitterOutlined} from "@ant-design/icons";
import AccountsTable from "./AccountsTable";

//const vaultFlagSigner = 'GCTXWXCZ2GKRACYXROMCBF6DBLH65TTIN7W3JCHRVGZOHBUBTFOJKH7O';

function App() {
    const [search, setSearch] = useState(undefined);

    const handleTableUpdated = (date) => {

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
            <AccountsTable filter={search} onUpdated={handleTableUpdated} onFiltered={() => {}} />
        </Content>
        </Layout>);
}

export default App;
