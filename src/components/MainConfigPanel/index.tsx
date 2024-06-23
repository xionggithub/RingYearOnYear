import './index.scss'
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Toast } from '@douyinfe/semi-ui';
import {dashboard, DashboardState, base, FieldType, IDataRange, IDataCondition} from "@lark-base-open/js-sdk";
import type { ICategory } from '@lark-base-open/js-sdk';
import { Tabs, TabPane } from '@douyinfe/semi-ui';
import PanelTypeAndData from './PanelTypeAndData';
import PanelCustomStyle from './PanelCustomStyle';
import type { ICustomConfig, IRenderData, ITableItem } from '@/common/type';
import { useConfig } from '@/hooks';
import { configFormatter, getPreviewData, renderMainContentData } from '@/utils';
import { debounce } from 'lodash-es';

interface IProps {
  setRenderData: (data: IRenderData) => void;
  initializeConfig: ICustomConfig;
}
export default function MainConfigPanel({ setRenderData, initializeConfig }: IProps) {
  const { t } = useTranslation();
  const tabList = [
    {
      key: '1',
      tab: t('type_Date'),
    },
    {
      key: '2',
      tab: t('customStyle'),
    }
  ];

  // create时的默认配置
  const [config, setConfig] = useState<ICustomConfig>(initializeConfig);
  const [datasourceRange, setDatasourceRange] = useState<IDataRange[]>([]);
  const [tableFields, setTableFields] = useState<any[]>([]);
  const [tableList, setTableList] = useState<ITableItem[]>([]);


  useConfig(setConfig).then();

  /**保存配置 */
  const onSaveConfig = async () => {
    console.log('save config', JSON.stringify(config), JSON.parse(JSON.stringify(config)))
    if (!config.keyIndicatorsFieldId) {
      Toast.error(t('dataPlaceholder'));
      return;
    }
    // 目前只持存保存一份查询配置
    const dataConditions: IDataCondition[] = await configFormatter(config)
    await dashboard.saveConfig({
      customConfig: config,
      dataConditions: dataConditions,//myDataCondition,
    } as any);
  }


  const getTableList = useCallback(async () => {
    const baseTableList = await base.getTableList();
    const resultList: ITableItem[] = [];

    for (const item of baseTableList) {
      const name = await item.getName();
      resultList.push({ value: item.id, label: name });
    }

    return resultList;
  }, []);


  const findAvailableTableForRender = async (tableList: { value: string, label: string }[], index: number) => {
    let result: { tableId: string, fields: any[] } | undefined = undefined;
    const findTableItem = tableList[index];
    if (!findTableItem) return  undefined;
    const table = await base.getTable(findTableItem.value);
    const fields = (await table.getFieldMetaList()) as any[]
    // 找到 有两个以上 数字字段的表
    const numberFields = fields.filter(field => field.type === 2)
    if (numberFields.length >= 2) {
      result = { tableId: findTableItem.value, fields: fields };
      return result
    }
    if (index < tableList.length - 1) {
      return await findAvailableTableForRender(tableList, index + 1);
    }
    return undefined;
  }
  // 给初始创建的 面板初始化渲染数据，这个时候需要遍历所有表找到符合要求的数据
  const initRenderDataForCreateIfNeeded = async ( tableList: { value: string, label: string }[],
                                                  config :ICustomConfig) => {
    const findAvailableTableInfo = await findAvailableTableForRender(tableList, 0);
    if (!findAvailableTableInfo) {
      return
    }
    config.tableId = findAvailableTableInfo.tableId
    const datasourceRange = await dashboard.getTableDataRange(config.tableId)
    setDatasourceRange(datasourceRange)
    if (!config.datasourceRange) {
      config.datasourceRange = 'All'
    }
    const numberFields = findAvailableTableInfo.fields.filter(field => field.type === 2)
    config.keyIndicatorsFieldId = numberFields[0].id
    config.momOrYoy[0].momOrYoyFieldId = numberFields[1].id;
    setTableFields(findAvailableTableInfo.fields)
    setConfig({...config})
  }

  const initData = async () => {
    const tableList = await getTableList();
    console.log(tableList, '----');
    setTableList(tableList);
    const customConfig = { ...config };
    if (dashboard.state === DashboardState.Create || customConfig.tableId.length ===0) {
      // 创建状态，无任务配置
      customConfig.tableId = tableList[0]?.value as string;
      await initRenderDataForCreateIfNeeded(tableList, customConfig);
      console.log(customConfig, '渲染初始化数据');
    }
    if (!customConfig.tableId) {
      setConfig({...customConfig})
      return;
    }
    const datasourceRange = await dashboard.getTableDataRange(customConfig.tableId)
    setDatasourceRange(datasourceRange)
    if (!customConfig.datasourceRange) {
      customConfig.datasourceRange = 'All'
    }
    console.log(config.datasourceRange, '--------------------')
    const table = await base.getTable(customConfig.tableId);
    const fields = (await table.getFieldMetaList()) as any[]
    setTableFields(fields)
    setConfig({...customConfig})
  }

  useEffect(() => {
    initData().then();
  }, []);

  // 用于临时存储SDK接口返回的指标数据
  const [valueArr, setValueArr] = useState<number[]>([]);

  const renderMainDataDebounce = debounce(async () => {
    if (!config.tableId) {
      return
    }
    const value = await getPreviewData(config);
    setValueArr(value);
    await renderMainContentData(config, value, setRenderData);
  }, 200);

  // 类型与数据面板变化，依赖base SDK接口的数据计算，重新获取指标数据
  useEffect(() => {
    renderMainDataDebounce();
  }, [config.tableId, config.keyIndicatorsFieldId, config.keyIndicatorsRollup, config.datasourceRange, JSON.stringify(config.momOrYoy)]);


  const renderMainStyleDebounce = debounce(() => {
    if (!config.tableId) {
      return
    }
    renderMainContentData(config, valueArr, setRenderData).then();
  }, 200);
  // 自定义样式面板变化，重新设置主面板的显示样式与格式
  useEffect(() => {
    renderMainStyleDebounce();
  }, [config.color, config.iconStyleId, config.decimal, config.numberFormat, config.prefix, config.suffix]);

  return (
    <div className='main-config-panel left-border'>
      <div className='form'>
        <Tabs defaultActiveKey='1'>
          {tabList.map((item) => (
            <TabPane tab={item.tab} itemKey={item.key} key={item.key}>
              {item.key === '1' && (
                <PanelTypeAndData
                  config={config}
                  datasourceRange={datasourceRange}
                  tableFields={tableFields}
                  setConfig={setConfig}
                  tableList={tableList}
                />
              )}
              {item.key === '2' && <PanelCustomStyle config={config} setConfig={setConfig} />}
            </TabPane>
          ))}
        </Tabs>
      </div>

      <Button className='btn' theme='solid' onClick={onSaveConfig}>
        {t('confirm')}
      </Button>
    </div >
  )
}
