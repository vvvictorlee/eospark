import React,{Component} from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Tabs,Table,Spin,Icon,Modal } from 'antd';
import jQuery from 'jquery';
import NotFound from '../../components/NotFound';
import * as tool from '../../utils/tool';
import styles from './css/Block.css';
const TabPane = Tabs.TabPane;

class Trade extends Component{
  constructor(props){
    super(props);
    this.state = {
      detail: {},
      dataSource: [],
      loading: true,
      count: 0,
    };
    this.domLoadFlag = false;
    this.mypre = null;
    this.columns = [{
      title: '交易',
      dataIndex: 'name',
      key: 'name',
      render: (text,record) => {return this.renderRow(record);},
    }];
  }

  showMore = (detail) => {
    let myObject = JSON.parse(detail);
    // 格式化
    let formattedStr = JSON.stringify(myObject, null, 2);
    Modal.info({
      maskClosable: true,
      okText: '确定',
      title: '参数:',
      width: 700,
      content: <pre>{formattedStr}</pre>,
    });
  };

  renderRow = (record)=>{
     let data = record;
     console.log('>>>>>>>', data);

    let flag = false;
    let s = data.data;
    if(s.length > 108){
      flag = true;
      s = s.substring(0,100) + '...';
    }

     if(data){
       return (<div>
         <div style={{display: 'flex'}}>
           <div style={{width: 220}}>发起人：{data.actor}@{data.permission}</div>
           <div style={{width: 160}}>合约: {data.account}</div>
           <div style={{ width: 150}}>接口: {data.name}</div>
           <div style={{ width: 760}} className={styles.params}>
             <span>参数: {s}</span>
             {flag ? <Icon onClick={()=>this.showMore(data.data)} style={{marginLeft:10,cursor:'pointer',color:'#2d8fff',fontWeight:'bold'}} type="search"/> :null}
           </div>
         </div>
         <div style={{marginTop: 10, color: '#ccc'}}>hex_data {data.hex_data}</div>
       </div>);
     }else{
       return <div></div>;
     }
  };

  componentDidMount(){

  }

  componentWillReceiveProps(nextProps){
    console.log('》》》props变化', nextProps);
    if(this.props.match.params.id != nextProps.match.params.id){
      console.log('重新请求');
      this.init(nextProps.match.params.id);
    }
  }

  init = (id)=>{
    this.props.dispatch({
      type: 'eos/getTradeDetail',
      params:{
        id: id,
      },
      callback: (data)=>{
        this.setState({
          detail: data,
          loading: false,
        });
        if(data.raw_data){
          console.log('》》》》》已经加载', data.raw_data);
          let s = data.raw_data;
          jQuery(this.mypre).html(this.syntaxHighlight(JSON.parse(s)));
        }
      },
      errCallback:()=>{
        this.setState({
          detail: data,
          loading: false,
        })
      }
    });

    this.props.dispatch({
      type: 'eos/getTradeAction',
      params:{
        id: id,
        page_num: 1,
        page_size: 10,
      },
      callback: (data)=>{
        let dataSource = this.getDataSource(data.action_info);
        this.setState({
          dataSource: dataSource,
          count: dataSource.length,
        })
      }
    });
  };

  componentWillMount(){
     this.init(this.props.match.params.id);
  }

  syntaxHighlight = (json) => {
    if (typeof json != 'string') {
      json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
      var cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  };

  getDataSource = (data)=>{
    let rs = [];
    for(let i in data){
      let item = data[i];
      item.authorization.map((d,index)=>{
        item.actor = d.actor;
        item.permission = d.permission;
        item.key = i;
        rs.push(item);
      });
    }
    return rs;
  };

  onPaginationChange = ()=>{

  };

  toBlockPage = (id)=>{
    this.props.dispatch(routerRedux.push(tool.getUri('/block/'+id)));
  };

  renderNotFound = ()=>{
    return (
      <NotFound/>
    );
  };

  render(){
    let {detail,loading} = this.state;
    if(loading){
      return (
        <div className={styles.spinWrapper}>
          <Spin />
        </div>
      );
    } else if(detail.id){
      return this.renderDetail();
    }else{
      return this.renderNotFound();
    }
  }

  toIndex = ()=>{
    window.location = window.location.origin + tool.getUri('/');
  };

  toBlockPage2 = (id)=>{
    window.location = window.location.origin + tool.getUri('/block/'+id);
  };

  renderDetail = () => {
    let {detail,dataSource} = this.state;
    let signatures = '';
    if(detail.signatures){
      if ((detail.signatures instanceof Array) && detail.signatures.length > 0) {
        signatures = detail.signatures.join(',');
      } else {
        signatures = detail.signatures;
      }
    }
    let tab1 = `actions(${this.state.count})`;
    return (
      <div>

        <div className={styles.bread}>
          <a href="javascript:void(0)" style={{color:'rgba(0, 0, 0, 0.65)'}} onClick={this.toIndex}>首页</a> / <a href="javascript:void(0)" style={{color:'rgba(0, 0, 0, 0.65)'}} onClick={()=>this.toBlockPage2(detail.ref_block_num)}>区块#{detail.ref_block_num}</a> / 交易详情
        </div>

        <div className={styles.basic}>
          <div style={{marginBottom: 10}}><span className={styles.title}>交易Hash:</span> {detail.id}</div>

          <div style={{overflow:'hidden'}}>

            <div className={styles.leftWrapper}>
              <div className={styles.item}>
                <div className={styles.itemLabel}>过期时间:</div>
                <div className={styles.itemValue}>{detail.expiration}</div>
              </div>
              <div className={styles.item}>
                <div className={styles.itemLabel}>所在区块:</div>
                <div className={styles.itemValue}><a href="javascript:void(0)" onClick={ ()=> {this.toBlockPage(detail.block_num)} }>#{detail.block_num}</a></div>
              </div>
              <div className={styles.item}>
                <div className={styles.itemLabel}>引用区块:</div>
                <div className={styles.itemValue}><a href="javascript:void(0)" onClick={ ()=> {this.toBlockPage(detail.ref_block_num)} }>#{detail.ref_block_num}</a></div>
              </div>
              <div className={styles.item}>
                <div className={styles.itemLabel}>确认数:</div>
                <div className={styles.itemValue}>{detail.block_num - detail.ref_block_num}</div>
              </div>
              <div className={styles.item}>
                <div className={styles.itemLabel}>delay_sec:</div>
                <div className={styles.itemValue}>{detail.delay_sec}</div>
              </div>
            </div>

            <div className={styles.rightWrapper}>
              <div className={styles.item}>
                <div className={styles.itemLabel2}>签名:</div>
                <div className={styles.itemValue2}>{signatures}</div>
              </div>
              <div className={styles.item}>
                <div className={styles.itemLabel2}>压缩数据:</div>
                <div className={styles.itemValue2}>{detail.packed_trx}</div>
              </div>
              <div className={styles.item}>
                <div className={styles.itemLabel2}>max_net_usage_words:</div>
                <div className={styles.itemValue2}>{detail.max_kcpu_usage}</div>
              </div>
            </div>

          </div>

        </div>
        <div className={styles.detail}>
          <Tabs defaultActiveKey="1" onChange={()=>{}}>
            <TabPane tab={tab1} key="1">
              <Table
                showHeader={false}
                dataSource={dataSource}
                columns={this.columns}
                pagination={false}
              />
            </TabPane>
            <TabPane tab="RAW数据" key="2"  forceRender={true}>
              <pre ref={(r) => { this.mypre = r; }} >
              </pre>
            </TabPane>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default connect()(Trade);