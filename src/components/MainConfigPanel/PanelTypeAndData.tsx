import './index.scss'
import {useEffect, useRef, useState} from 'react';
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
}

export default function PanelTypeAndData({ config, datasourceRange, setConfig, tableList, tableFields }: IProps) {
  const { t } = useTranslation();
  const [tableId, setTableId] = useState<string>(config.tableId);
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

  useEffect(() => {
    setTableId(config.tableId)
  }, [config.tableId])

  useEffect(() => {
    setDataRangeId(config.datasourceRange)
  }, [config.datasourceRange])

  useEffect(() => {
    setCurrentFields(tableFields)
  }, [tableFields])

  useEffect(() => {
    setDataRange(datasourceRange)
  }, [datasourceRange])

  const tableChange = async (tableId: any) => {
    config.tableId = tableId;
    setTableId(tableId)
    const datasourceRange = await dashboard.getTableDataRange(tableId);
    setDataRange(datasourceRange)
    config.datasourceRange = ''
    setConfig({...config })
    setDataRangeId('All')
    const table = await base.getTable(tableId);
    const tableFields = (await table.getFieldMetaList()) as any[]
    setCurrentFields(tableFields)
    setKeyIndicatorsFieldId('')
  }

  const datasourceRangeChange = (range: string) => {
    config.datasourceRange = range
    setConfig({...config })
  }

  const handlerChange = (key: string, value: any) => {
    setConfig({ ...config, [key]: value });
    if (key === 'keyIndicatorsFieldId') {
      setKeyIndicatorsFieldId(value)
    }
  }

  const momOrYoyItemChange = (item: MomOrYoy, key: string, value: any, index: number) => {
    item = { ...item, [key]: value };
    if (key === 'momOrYoyDesc') {
      item.manualSetDesc = true;
    }
    const manualSetDesc: any = momOrYoyCalcTypeList.find(optionItem =>optionItem.value === item.momOrYoyCalcType)
    if (manualSetDesc) {
      item.momOrYoyDesc = manualSetDesc.label;
    }
    config.momOrYoy[index] = item;
    setConfig({ ...config });
  }

  const scrollToBottomRef = useRef<HTMLDivElement | null>(null);
  const addMomOrYoyItem = () => {
    const item: MomOrYoy = {
      momOrYoyDesc: t('momGrowthRate'),
      momOrYoyFieldId: '',
      manualSetDesc: false,
      momOrYoyCalcMethod: 'mom',
      momOrYoyCalcType: 'differenceRate',
      indicatorsRollup: 'SUM'
    } as MomOrYoy
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

  const chooseTag = (key: string) => {
    const findItem = methodList.find(dropItem => dropItem.type === key )
    const keyOfName: string = findItem?.keyOfName ?? ''
    return  t(keyOfName)
  }

  const selectedFieldIds = () => {
    const ids: string[] = [];
    if (config.keyIndicatorsFieldId) {
      ids.push(config.keyIndicatorsFieldId)
    }
    config.momOrYoy.forEach(item => {
      if (item.momOrYoyFieldId) {
        ids.push(item.momOrYoyFieldId)
      }
    })
    return ids;
  }

  return (
    <div className="form-main">
      <div className="form-title">{t('dataSource')}</div>
      <div className='form-item' key='dataSource'>
        <Select
            style={{width : '100%'}}
            prefix={<Icon svg={<IconTable />} />}
            optionList={tableList}
            value={tableId}
            onChange={tableChange}>
        </Select>
      </div>
      <div className="form-title">{t('dataRange')}</div>
      <div className='form-item' key="dataRange">
        <Select
            prefix={<Icon svg={<IconTable />} />}
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
            defaultValue={dataRangeId}
            value={dataRangeId}
            onChange={ (value) => {
              datasourceRangeChange(value as string)
            }}>
        </Select>
      </div>
      <Divider style={{ borderColor: 'var(--divider)', margin: '20px 0 20px 0' }} />

      <div className="form-title">{t('key_indicators')}</div>
      <div className='form-item'>
        <Select
            className='drop-down-select'
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
                            const data = (event.target as any).textContent;
                            const findItem = methodList.find(tempItem => t(tempItem.keyOfName) === data);
                            if (findItem) {
                              console.log(findItem.type)
                              config.keyIndicatorsRollup = findItem.type
                              setConfig({...config })
                              setKeyIndicatorsFieldIdRollup(findItem.type)
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
              >{
                chooseTag(keyIndicatorsFieldIdRollup)
              }</Tag>
            </Dropdown>}
            defaultValue={keyIndicatorsFieldId}
            value={keyIndicatorsFieldId}
            onChange={(value) => { handlerChange('keyIndicatorsFieldId', value) }}
            optionList={currentFields.map(item => {
              const ids = selectedFieldIds()
              return {
                value: item.id,
                label: item.name,
                disabled: item.type !== 2 || ids.some(id => id === item.id)
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
            <Select
              prefix={<Icon svg={<IconNumber />} />}
              placeholder={t('auxiliary_index')}
              position='top'
              defaultValue={item.momOrYoyFieldId}
              value={item.momOrYoyFieldId}
              onChange={(value) =>  momOrYoyItemChange(item, 'momOrYoyFieldId', value, index)}
              optionList={currentFields.map(item => {
                const ids = selectedFieldIds()
                return {
                  value: item.id,
                  label: item.name,
                  disabled: item.type !== 2 || ids.some(id => id === item.id)
                };
              })}
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
                        { methodList.map(dropItem => {
                          return (<Dropdown.Item key={dropItem.type}
                                                 onClick={(event) => {
                                                   const data = (event.target as any).textContent;
                                                   const findItem = methodList.find(tempItem => t(tempItem.keyOfName) === data);
                                                   if (findItem) {
                                                     console.log(findItem.type)
                                                     momOrYoyItemChange(item, 'indicatorsRollup', findItem.type, index)
                                                     setConfig({...config })
                                                   }
                                                 }}
                          >{ t(dropItem.keyOfName) }
                          </Dropdown.Item>)
                        }) }
                      </Dropdown.Menu>
                    }
                >
                  <Tag className="drop-down-tag" onClick={(e) => {
                    e.stopPropagation();
                  }}
                  >{chooseTag(item.indicatorsRollup)}</Tag>
                </Dropdown>}
            >
            </Select>

            <div className='form-subTitle'>{t('description')}</div>
            <Input
                value={item.momOrYoyDesc}
                onChange={(value) =>  momOrYoyItemChange(item, 'momOrYoyDesc', value, index)} />

            <div className='form-subTitle'>{t('calculationType')}</div>
            <Select
              position='top'
              optionList={momOrYoyCalcTypeList as Mutable<typeof momOrYoyCalcTypeList>}
              defaultValue={item.momOrYoyCalcType}
              value={item.momOrYoyCalcType}
              onChange={(value) => momOrYoyItemChange(item, 'momOrYoyCalcType', value, index)}>
            </Select>
            <div ref={scrollToBottomRef}></div>
          </div>
        ))
      }
    </div>
  )
}
