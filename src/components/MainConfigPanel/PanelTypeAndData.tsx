import './index.scss'
import {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Divider, Input, Form, Select, Dropdown, Tag} from '@douyinfe/semi-ui';
import Icon, {IconDeleteStroked, IconPlus} from '@douyinfe/semi-icons';
import type {ICategory} from '@lark-base-open/js-sdk';
import {base, dashboard, IDataRange, Rollup, SourceType} from "@lark-base-open/js-sdk";
import {ICustomConfig, ITableItem, MomOrYoy, MomOrYoyCalcMethod, MomOrYoyCalcType, Mutable} from '@/common/type';
import {momOrYoyCalcTypeList} from '@/common/constant';
import {getMomYoyDesc, getNewMomOrYoyCalcMethodList} from '@/utils';
import IconTable from '@/assets/icon_table.svg?react';
import IconNumber from '@/assets/icon_number.svg?react';

interface IProps {
  config: ICustomConfig;
  datasourceRange: IDataRange[];
  setConfig: (data: ICustomConfig) => void;
  tableList: ITableItem[];
  tableFields: { id: string, name: string, type: number }[];
  numberOrCurrencyList: ICategory[];
  setData: (config: ICustomConfig, tableIdChange: boolean) => void;
}

export default function PanelTypeAndData({ config, datasourceRange, setConfig, tableList, tableFields, numberOrCurrencyList, setData }: IProps) {
  const { t } = useTranslation();

  const [newMomOrYoyCalcMethodList, setNewMomOrYoyCalcMethodList] = useState(getNewMomOrYoyCalcMethodList(config.dateRange));

  const [currentFields, setCurrentFields] = useState<{ id: string, name: string, type: number }[]>(tableFields);
  const [keyIndicatorsFieldId, setKeyIndicatorsFieldId] = useState(config.keyIndicatorsFieldId);
  const [keyIndicatorsFieldIdRollup, setKeyIndicatorsFieldIdRollup] = useState(config.keyIndicatorsRollup ?? Rollup.SUM);
  const [dataRange, setDataRange] = useState<IDataRange[]>(datasourceRange)
  const [dataRangeId, setDataRangeId] = useState<string>(config.datasourceRange)
  const methodList: { keyOfName: string, type: Rollup }[] = [
    { keyOfName: 'sum', type: Rollup.SUM },
    { keyOfName: 'average', type: Rollup.AVERAGE },
    { keyOfName: 'max', type: Rollup.MAX },
    { keyOfName: 'min', type: Rollup.MIN },
  ]

  const tableChange = async (tableId: any) => {
    config.tableId = tableId;
    const datasourceRange = await dashboard.getTableDataRange(tableId);
    setDataRange(datasourceRange)
    setDataRangeId('All')
    config.datasourceRange = ''
    console.log(datasourceRange, 'tableChange-------------')
    const table = await base.getTable(tableId);
    console.log(table, 'get table for ', tableId)
    const tableFields = (await table.getFieldMetaList()) as any[]
    console.log(tableFields, 'get fields for', tableId);
    setCurrentFields(tableFields)
    setKeyIndicatorsFieldId('')
    setData(config, true);
  }

  const datasourceRangeChange = (range: string) => {
    console.log(range)
    config.datasourceRange = range
    console.log(range, 'datasourceRangeChange-------------')
    setData(config, false);
  }

  const handlerChange = (key: string, value: any) => {
    setConfig({ ...config, [key]: value });
  }

  const momOrYoyItemChange = (item: MomOrYoy, key: string, value: any, index: number) => {
    item = { ...item, [key]: value };
    if (key === 'momOrYoyDesc') {
      item.manualSetDesc = true;
    }
    const { manualSetDesc, momOrYoyCalcMethod, momOrYoyCalcType } = item;
    if (!manualSetDesc) {
      item.momOrYoyDesc = getMomYoyDesc(momOrYoyCalcMethod, momOrYoyCalcType);
    }
    config.momOrYoy[index] = item;
    setConfig({ ...config });
  }

  const scrollToBottomRef = useRef<HTMLDivElement>(null);
  const addMomOrYoyItem = () => {
    const item: MomOrYoy = {
      momOrYoyDesc: t('momGrowthRate'),
      momOrYoyFieldId: '',
      manualSetDesc: false,
      momOrYoyCalcMethod: 'mom',
      momOrYoyCalcType: 'differenceRate',
    }
    config.momOrYoy.push(item);
    setConfig({ ...config });
    setTimeout(() => {
      scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }

  const deleteMomOrYoyItem = (index: number) => {
    config.momOrYoy.splice(index, 1);
    setConfig({ ...config });
  }

  const changeComputeMethod = (value) => {
    config.keyIndicatorsRollup = value
    setConfig(config)
    setKeyIndicatorsFieldIdRollup(value)
  }

  const dropItemClick = (e) => {

  }

  return (
    <Form className="form-main">
      <div className="form-title">{t('dataSource')}</div>
      <div className='form-item'>
        <Form.Select noLabel={true}
                     field='dataSource'
          prefix={<Icon svg={<IconTable />} />}
          optionList={tableList as Mutable<typeof tableList>}
          value={config.tableId} onChange={tableChange}>
        </Form.Select>
      </div>
      <div className="form-title">{t('dataRange')}</div>
      <div className='form-item'>
        <Form.Select
            prefix={<Icon svg={<IconTable />} />}
            noLabel={true}
            field='dataRange'
            optionList={dataRange.map(item => {
              if (item.type === SourceType.ALL) {
                return {
                  value: 'All',
                  label: t('view_all'),
                };
              } else {
                return {
                  value: item.viewId,
                  label: item.viewName,
                };
              }
            })}
            value={dataRangeId} onChange={datasourceRangeChange}>
        </Form.Select>
      </div>
      <Divider style={{ borderColor: 'var(--divider)', margin: '20px 0 20px 0' }} />

      <div className="form-title">{t('key_indicators')}</div>
      <div className='form-item'>
        <Form.Select
            noLabel={true}
            className='drop-down-select'
            field='keyIndicators'
            placeholder={t('key_indicators')}
            prefix={<Icon svg={<IconNumber />} />}
            showArrow={false}
            suffix={
              <Dropdown
                  className='select-suffix'
                  position='bottomRight'
                  trigger={'click'}
                  stopPropagation={true}
                  clickToHide={true}
                render={
                  <Dropdown.Menu>
                    { methodList.map(item => {
                      return (<Dropdown.Item key={item.type}
                          onClick={(event) => {
                            const data = event.target.textContent;
                            const findItem = methodList.find(tempItem => t(tempItem.keyOfName) === data);
                            if (findItem) {
                              console.log(findItem.type)
                            }
                          }}
                      >{ t(item.keyOfName) }
                      </Dropdown.Item>)
                    }) }
                  </Dropdown.Menu>
                }
            >
              <Tag className="drop-down-tag" onClick={(e) => {
                e.stopPropagation();
              }}
              >Hover Me</Tag>
            </Dropdown>}
            value={config.keyIndicatorsFieldId}
            onChange={(value) => { handlerChange('keyIndicatorsFieldId', value) }}
            optionList={currentFields.map(item => {
              return {
                value: item.id,
                label: item.name,
                disabled: item.type !== 2
              };
          })}
        />
      </div>

      <div className="form-title">
        <span>{t('auxiliary_index')}</span>
        <Button
          disabled={config.momOrYoy.length >= 4}
          theme='borderless'
          icon={<IconPlus size='small' />}
          style={{ fontWeight: 'normal' }}
          onClick={addMomOrYoyItem}>
          {t('add_index')}
        </Button>
      </div>
      {
        (config.momOrYoy ?? []).map((item, index) => (
          <div className='form-item bg-grey' key={index}>
            {config.momOrYoy.length > 1 && (
              <div className='icon-delete' onClick={() => { deleteMomOrYoyItem(index) }}>
                <IconDeleteStroked size='small' />
              </div>
            )}
            <div className='form-subTitle'>{t('field')}</div>
            {/*momOrYoyCalcMethod*/}
            <Form.Select
              noLabel={true}
              field={'momOrYoyFieldId' + index}
              position='top'
              value={item.momOrYoyFieldId}
              onChange={(value) =>  momOrYoyItemChange(item, 'momOrYoyFieldId', value, index)}
              optionList={currentFields.map(item => {
                return {
                  value: item.id,
                  label: item.name,
                  disabled: item.type !== 2
                };
              })}
            >
            </Form.Select>

            <div className='form-subTitle'>{t('description')}</div>
            <Input
                value={item.momOrYoyDesc}
                onChange={(value) =>  momOrYoyItemChange(item, 'momOrYoyDesc', value, index)} />

            <div className='form-subTitle'>{t('calculationType')}</div>
            <Form.Select
              noLabel={true}
              field={'momOrYoyCalcType' + index}
              position='top'
              optionList={momOrYoyCalcTypeList as Mutable<typeof momOrYoyCalcTypeList>}
              value={item.momOrYoyCalcType}
              onChange={(value) => momOrYoyItemChange(item, 'momOrYoyCalcType', value, index)}>
            </Form.Select>
            <div ref={scrollToBottomRef}></div>
          </div>
        ))
      }
    </Form>
  )
}
